"""
Jhelum Labs — W-1.1 Inference API
HuggingFace Space — Gradio SDK (FREE tier)

This exposes BOTH:
  1. A Gradio UI  (visible in the Space iframe)
  2. A /generate  REST endpoint  (called by the React playground)

Deploy steps:
  - SDK: Gradio  (free, no Docker needed)
  - Hardware: CPU Basic (free)
  - Push this file as app.py to the Space repo
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
import time
import urllib.request
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from threading import Lock

import torch
import torch.nn as nn
import torch.nn.functional as F
import gradio as gr
from fastapi import Request
from fastapi.responses import JSONResponse
from safetensors.torch import load_file
from tokenizers import Tokenizer

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
WEIGHTS_URL = (
    "https://github.com/wasif-ali-ganie/origin-labs-w-1.1"
    "/releases/download/v1.0.0/w-1.1.safetensors"
)
TOKENIZER_URL = (
    "https://raw.githubusercontent.com/jhelum-labs/w-1.1/main/tokenizer.json"
)
CONFIG_URL = (
    "https://raw.githubusercontent.com/jhelum-labs/w-1.1/main/config.json"
)
WEIGHTS_SHA256 = "8B00898BCBBC77F9B6045D3C605BAC5FFFB90F7E8A60192B9232F1C33B6511F2"

CACHE_DIR = Path("/tmp/w11_cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

RATE_LIMIT = int(os.environ.get("RATE_LIMIT_PER_MINUTE", 10))
MAX_TOKENS_CAP = int(os.environ.get("MAX_NEW_TOKENS_LIMIT", 400))

PROMPT_TEMPLATE = "### User:\n{instruction}\n\n### Assistant:\n"

# ---------------------------------------------------------------------------
# Model architecture (exact copy of src/wai/model.py)
# ---------------------------------------------------------------------------

@dataclass
class WAIConfig:
    vocab_size: int = 32000
    context_length: int = 2048
    d_model: int = 768
    n_layers: int = 14
    n_heads: int = 12
    d_ff: int = 2048
    rope_theta: float = 10000.0


class RMSNorm(nn.Module):
    def __init__(self, width, eps=1e-6):
        super().__init__()
        self.weight = nn.Parameter(torch.ones(width))
        self.eps = eps

    def forward(self, x):
        return x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps) * self.weight


def rotate_half(x):
    x1, x2 = x.chunk(2, dim=-1)
    return torch.cat((-x2, x1), dim=-1)


class Attention(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.n_heads = cfg.n_heads
        self.head_dim = cfg.d_model // cfg.n_heads
        self.qkv = nn.Linear(cfg.d_model, 3 * cfg.d_model, bias=False)
        self.out = nn.Linear(cfg.d_model, cfg.d_model, bias=False)
        inv = 1.0 / (cfg.rope_theta ** (torch.arange(0, self.head_dim, 2).float() / self.head_dim))
        freq = torch.outer(torch.arange(cfg.context_length).float(), inv)
        emb = torch.cat((freq, freq), dim=-1)
        self.register_buffer("rope_cos", emb.cos()[None, None], persistent=False)
        self.register_buffer("rope_sin", emb.sin()[None, None], persistent=False)

    def forward(self, x):
        b, t, c = x.shape
        q, k, v = self.qkv(x).chunk(3, dim=-1)
        shape = (b, t, self.n_heads, self.head_dim)
        q, k, v = (z.view(shape).transpose(1, 2) for z in (q, k, v))
        cos = self.rope_cos[:, :, :t].to(q.dtype)
        sin = self.rope_sin[:, :, :t].to(q.dtype)
        q = q * cos + rotate_half(q) * sin
        k = k * cos + rotate_half(k) * sin
        y = F.scaled_dot_product_attention(q, k, v, dropout_p=0.0, is_causal=True)
        return self.out(y.transpose(1, 2).contiguous().view(b, t, c))


class SwiGLU(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.gate = nn.Linear(cfg.d_model, cfg.d_ff, bias=False)
        self.up = nn.Linear(cfg.d_model, cfg.d_ff, bias=False)
        self.down = nn.Linear(cfg.d_ff, cfg.d_model, bias=False)

    def forward(self, x):
        return self.down(F.silu(self.gate(x)) * self.up(x))


class Block(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.attn_norm = RMSNorm(cfg.d_model)
        self.attn = Attention(cfg)
        self.ffn_norm = RMSNorm(cfg.d_model)
        self.ffn = SwiGLU(cfg)

    def forward(self, x):
        x = x + self.attn(self.attn_norm(x))
        return x + self.ffn(self.ffn_norm(x))


class WAI(nn.Module):
    def __init__(self, cfg):
        super().__init__()
        self.cfg = cfg
        self.embed = nn.Embedding(cfg.vocab_size, cfg.d_model)
        self.blocks = nn.ModuleList([Block(cfg) for _ in range(cfg.n_layers)])
        self.norm = RMSNorm(cfg.d_model)
        self.lm_head = nn.Linear(cfg.d_model, cfg.vocab_size, bias=False)
        self.lm_head.weight = self.embed.weight

    def forward(self, tokens):
        x = self.embed(tokens)
        for block in self.blocks:
            x = block(x)
        return self.lm_head(self.norm(x))


# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------

def _sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest().upper()


def _download(url, dest):
    print(f"[W-1.1] Downloading {url}", flush=True)
    urllib.request.urlretrieve(url, dest)
    print(f"[W-1.1] Done — {Path(dest).stat().st_size / 1e6:.1f} MB", flush=True)


def load_everything():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[W-1.1] Device: {device}", flush=True)

    cfg_path = CACHE_DIR / "config.json"
    if not cfg_path.exists():
        _download(CONFIG_URL, cfg_path)
    raw_cfg = json.loads(cfg_path.read_text())
    cfg = WAIConfig(**{k: raw_cfg[k] for k in WAIConfig.__dataclass_fields__ if k in raw_cfg})

    tok_path = CACHE_DIR / "tokenizer.json"
    if not tok_path.exists():
        _download(TOKENIZER_URL, tok_path)
    tokenizer = Tokenizer.from_file(str(tok_path))

    w_path = CACHE_DIR / "w-1.1.safetensors"
    if not w_path.exists():
        _download(WEIGHTS_URL, w_path)
        digest = _sha256(w_path)
        if digest != WEIGHTS_SHA256:
            w_path.unlink()
            raise RuntimeError(f"SHA-256 mismatch: {digest}")
        print("[W-1.1] SHA-256 OK", flush=True)

    model = WAI(cfg)
    state = load_file(str(w_path), device="cpu")
    missing, unexpected = model.load_state_dict(state, strict=False)
    if set(missing) - {"lm_head.weight"} or unexpected:
        raise RuntimeError(f"Weights mismatch — missing={missing} unexpected={unexpected}")
    model.to(device).eval()
    print(f"[W-1.1] Ready on {device}", flush=True)
    return model, cfg, tokenizer, device


# ---------------------------------------------------------------------------
# Inference
# ---------------------------------------------------------------------------

@torch.inference_mode()
def generate_text(model, cfg, tokenizer, device, prompt,
                  max_new_tokens=160, temperature=0.7, top_k=40, seed=42):
    torch.manual_seed(seed)
    full_prompt = PROMPT_TEMPLATE.format(instruction=prompt)
    ids = tokenizer.encode(full_prompt).ids
    x = torch.tensor([ids], dtype=torch.long, device=device)
    for _ in range(max_new_tokens):
        logits = model(x[:, -cfg.context_length:])[:, -1].float()
        if temperature <= 0:
            nxt = logits.argmax(-1, keepdim=True)
        else:
            logits /= temperature
            if top_k > 0:
                cutoff = torch.topk(logits, min(top_k, logits.size(-1))).values[:, -1:]
                logits = logits.masked_fill(logits < cutoff, float("-inf"))
            nxt = torch.multinomial(torch.softmax(logits, -1), 1)
        x = torch.cat((x, nxt), dim=1)
    generated = x[0, len(ids):].tolist()
    return tokenizer.decode(generated, skip_special_tokens=True).strip()


# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------

class RateLimiter:
    def __init__(self, max_per_minute):
        self.max = max_per_minute
        self._counts = defaultdict(list)
        self._lock = Lock()

    def is_allowed(self, ip):
        now = time.time()
        with self._lock:
            self._counts[ip] = [t for t in self._counts[ip] if now - t < 60]
            if len(self._counts[ip]) >= self.max:
                return False
            self._counts[ip].append(now)
            return True


# ---------------------------------------------------------------------------
# Global state
# ---------------------------------------------------------------------------
_model = None
_cfg = None
_tokenizer = None
_device = "cpu"
_load_error = None
_inference_lock = Lock()
_rate_limiter = RateLimiter(RATE_LIMIT)

try:
    _model, _cfg, _tokenizer, _device = load_everything()
except Exception as e:
    _load_error = str(e)
    print(f"[W-1.1] FATAL: {e}", file=sys.stderr, flush=True)


# ---------------------------------------------------------------------------
# Gradio inference function (used by both the UI and the /generate endpoint)
# ---------------------------------------------------------------------------

def run_inference(prompt, max_new_tokens=160, temperature=0.7, top_k=40):
    """Called by Gradio UI."""
    if _load_error:
        return f"❌ Model failed to load: {_load_error}"
    if _model is None:
        return "⏳ Model is still loading. Please try again in a few seconds."
    if not prompt.strip():
        return ""

    max_new_tokens = min(int(max_new_tokens), MAX_TOKENS_CAP)

    if not _inference_lock.acquire(blocking=False):
        return "🚦 Too many requests — the model is busy. Please try again in a moment."
    try:
        return generate_text(
            _model, _cfg, _tokenizer, _device,
            prompt=prompt.strip(),
            max_new_tokens=max_new_tokens,
            temperature=float(temperature),
            top_k=int(top_k),
        )
    except Exception as e:
        return f"❌ Error: {e}"
    finally:
        _inference_lock.release()


# ---------------------------------------------------------------------------
# Gradio UI  (shown in the Space — clean, branded)
# ---------------------------------------------------------------------------

DESCRIPTION = """
## Jhelum Labs · W-1.1
**123M-parameter experimental language model — trained from scratch.**
Decoder-only Transformer · RoPE · RMSNorm · SwiGLU · 32K BPE vocab

> ⚠ Experimental research model. Outputs may be inaccurate or repetitive. Not for production use.
"""

EXAMPLES = [
    ["What is photosynthesis?", 160, 0.7, 40],
    ["Explain gravity in simple terms.", 160, 0.7, 40],
    ["Write a short poem about the night sky.", 200, 0.9, 50],
    ["What is machine learning?", 160, 0.7, 40],
    ["Who was Alan Turing?", 160, 0.7, 40],
]

with gr.Blocks(title="Jhelum Labs W-1.1", theme=gr.themes.Base()) as demo:
    gr.Markdown(DESCRIPTION)

    with gr.Row():
        with gr.Column(scale=1):
            prompt_box = gr.Textbox(
                label="Prompt",
                placeholder="Ask W-1.1 anything…",
                lines=5,
            )
            with gr.Row():
                max_tokens = gr.Slider(20, 400, value=160, step=10, label="Max tokens")
                temperature = gr.Slider(0.0, 1.5, value=0.7, step=0.05, label="Temperature")
            top_k = gr.Slider(0, 100, value=40, step=5, label="Top-k (0 = off)")
            run_btn = gr.Button("Run W-1.1 →", variant="primary")

        with gr.Column(scale=1):
            output_box = gr.Textbox(label="Output", lines=12, interactive=False)

    gr.Examples(
        examples=EXAMPLES,
        inputs=[prompt_box, max_tokens, temperature, top_k],
    )

    run_btn.click(
        fn=run_inference,
        inputs=[prompt_box, max_tokens, temperature, top_k],
        outputs=output_box,
    )
    prompt_box.submit(
        fn=run_inference,
        inputs=[prompt_box, max_tokens, temperature, top_k],
        outputs=output_box,
    )

    gr.Markdown(
        "**Model:** W-1.1-125M-instruct · v1.0.0 · "
        "[GitHub](https://github.com/jhelum-labs/w-1.1) · "
        "Developed by [Jhelum Labs](https://github.com/jhelum-labs)"
    )


# ---------------------------------------------------------------------------
# /generate REST endpoint  (called by the React playground)
# Gradio exposes the FastAPI app at demo.app — we mount a custom route on it.
# ---------------------------------------------------------------------------

@demo.app.post("/generate")
async def generate_endpoint(request: Request):
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid JSON"})

    prompt = str(body.get("prompt", "")).strip()
    if not prompt:
        return JSONResponse(status_code=400, content={"error": "prompt is required"})

    # Rate limit by IP
    client_ip = request.headers.get("x-forwarded-for", "unknown").split(",")[0].strip()
    if not _rate_limiter.is_allowed(client_ip):
        return JSONResponse(
            status_code=429,
            content={"error": "Too many requests. Please wait a moment and try again."},
        )

    if _load_error:
        return JSONResponse(status_code=503, content={"error": f"Model failed to load: {_load_error}"})
    if _model is None:
        return JSONResponse(status_code=503, content={"error": "Model is still loading."})

    max_new_tokens = min(int(body.get("max_new_tokens", 160)), MAX_TOKENS_CAP)
    temperature = float(body.get("temperature", 0.7))
    top_k = int(body.get("top_k", 40))

    if not _inference_lock.acquire(blocking=False):
        return JSONResponse(
            status_code=429,
            content={"error": "Model is busy with another request. Please try again shortly."},
        )
    try:
        output = generate_text(
            _model, _cfg, _tokenizer, _device,
            prompt=prompt,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_k=top_k,
        )
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    finally:
        _inference_lock.release()

    return JSONResponse(content={"output": output, "model": "w-1.1-125m-instruct"})


# ---------------------------------------------------------------------------
# Launch
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    demo.launch()
