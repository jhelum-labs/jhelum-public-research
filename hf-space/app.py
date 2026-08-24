"""
Jhelum Labs — W-1.1 Inference API
HuggingFace Space (FastAPI / Gradio-free)

Deploy this as a Docker Space on HuggingFace Hub:
  https://huggingface.co/spaces/jhelum-labs/w-1.1-playground

The Space downloads weights from the GitHub Release on first run and caches
them in /tmp so cold starts after the first request are fast.

Environment variables (set in Space settings):
  RATE_LIMIT_PER_MINUTE   max requests per IP per minute (default: 10)
  MAX_NEW_TOKENS_LIMIT    hard cap on max_new_tokens (default: 400)
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
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from safetensors.torch import load_file
from tokenizers import Tokenizer

# ---------------------------------------------------------------------------
# Config / constants
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
# Model architecture (matches src/wai/model.py exactly)
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
    def __init__(self, width: int, eps: float = 1e-6):
        super().__init__()
        self.weight = nn.Parameter(torch.ones(width))
        self.eps = eps

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps) * self.weight


def rotate_half(x: torch.Tensor) -> torch.Tensor:
    x1, x2 = x.chunk(2, dim=-1)
    return torch.cat((-x2, x1), dim=-1)


class Attention(nn.Module):
    def __init__(self, cfg: WAIConfig):
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

    def forward(self, x: torch.Tensor) -> torch.Tensor:
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
    def __init__(self, cfg: WAIConfig):
        super().__init__()
        self.gate = nn.Linear(cfg.d_model, cfg.d_ff, bias=False)
        self.up = nn.Linear(cfg.d_model, cfg.d_ff, bias=False)
        self.down = nn.Linear(cfg.d_ff, cfg.d_model, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.down(F.silu(self.gate(x)) * self.up(x))


class Block(nn.Module):
    def __init__(self, cfg: WAIConfig):
        super().__init__()
        self.attn_norm = RMSNorm(cfg.d_model)
        self.attn = Attention(cfg)
        self.ffn_norm = RMSNorm(cfg.d_model)
        self.ffn = SwiGLU(cfg)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = x + self.attn(self.attn_norm(x))
        return x + self.ffn(self.ffn_norm(x))


class WAI(nn.Module):
    def __init__(self, cfg: WAIConfig):
        super().__init__()
        self.cfg = cfg
        self.embed = nn.Embedding(cfg.vocab_size, cfg.d_model)
        self.blocks = nn.ModuleList([Block(cfg) for _ in range(cfg.n_layers)])
        self.norm = RMSNorm(cfg.d_model)
        self.lm_head = nn.Linear(cfg.d_model, cfg.vocab_size, bias=False)
        self.lm_head.weight = self.embed.weight  # tied embeddings

    def forward(self, tokens: torch.Tensor) -> torch.Tensor:
        x = self.embed(tokens)
        for block in self.blocks:
            x = block(x)
        return self.lm_head(self.norm(x))


# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------

def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest().upper()


def _download(url: str, dest: Path) -> None:
    print(f"[W-1.1] Downloading {url} -> {dest}", flush=True)
    urllib.request.urlretrieve(url, dest)
    print(f"[W-1.1] Download complete: {dest.stat().st_size / 1e6:.1f} MB", flush=True)


def load_everything() -> tuple[WAI, WAIConfig, Tokenizer]:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[W-1.1] Device: {device}", flush=True)

    # config.json
    cfg_path = CACHE_DIR / "config.json"
    if not cfg_path.exists():
        _download(CONFIG_URL, cfg_path)
    raw_cfg = json.loads(cfg_path.read_text())
    cfg = WAIConfig(**{k: raw_cfg[k] for k in WAIConfig.__dataclass_fields__ if k in raw_cfg})

    # tokenizer.json
    tok_path = CACHE_DIR / "tokenizer.json"
    if not tok_path.exists():
        _download(TOKENIZER_URL, tok_path)
    tokenizer = Tokenizer.from_file(str(tok_path))

    # weights
    w_path = CACHE_DIR / "w-1.1.safetensors"
    if not w_path.exists():
        _download(WEIGHTS_URL, w_path)
        digest = _sha256(w_path)
        if digest != WEIGHTS_SHA256:
            w_path.unlink()
            raise RuntimeError(f"SHA-256 mismatch: got {digest}")
        print(f"[W-1.1] SHA-256 verified OK", flush=True)

    model = WAI(cfg)
    state = load_file(str(w_path), device="cpu")
    missing, unexpected = model.load_state_dict(state, strict=False)
    if set(missing) - {"lm_head.weight"} or unexpected:
        raise RuntimeError(f"Incompatible weights — missing={missing}, unexpected={unexpected}")
    model.to(device).eval()
    print(f"[W-1.1] Model ready ({cfg.parameter_count:,} params)", flush=True)
    return model, cfg, tokenizer, device


# ---------------------------------------------------------------------------
# Inference
# ---------------------------------------------------------------------------

@torch.inference_mode()
def generate_text(
    model: WAI,
    cfg: WAIConfig,
    tokenizer: Tokenizer,
    device: str,
    prompt: str,
    max_new_tokens: int = 160,
    temperature: float = 0.7,
    top_k: int = 40,
    seed: int = 42,
) -> str:
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

    # Decode only the newly generated tokens (strip the prompt)
    generated_ids = x[0, len(ids):].tolist()
    return tokenizer.decode(generated_ids, skip_special_tokens=True).strip()


# ---------------------------------------------------------------------------
# Rate limiter (in-memory, per IP)
# ---------------------------------------------------------------------------

class RateLimiter:
    def __init__(self, max_per_minute: int):
        self.max = max_per_minute
        self._counts: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def is_allowed(self, ip: str) -> bool:
        now = time.time()
        window = 60.0
        with self._lock:
            timestamps = self._counts[ip]
            # drop old timestamps
            self._counts[ip] = [t for t in timestamps if now - t < window]
            if len(self._counts[ip]) >= self.max:
                return False
            self._counts[ip].append(now)
            return True


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(title="Jhelum Labs W-1.1 Inference API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict to your domain in production
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

rate_limiter = RateLimiter(max_per_minute=RATE_LIMIT)

# Load model at startup
_model: WAI | None = None
_cfg: WAIConfig | None = None
_tokenizer: Tokenizer | None = None
_device: str = "cpu"
_load_error: str | None = None
_inference_lock = Lock()


@app.on_event("startup")
def startup():
    global _model, _cfg, _tokenizer, _device, _load_error
    try:
        _model, _cfg, _tokenizer, _device = load_everything()
    except Exception as e:
        _load_error = str(e)
        print(f"[W-1.1] FATAL: failed to load model — {e}", file=sys.stderr, flush=True)


# ── Request / response schemas ──

class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=2000)
    max_new_tokens: int = Field(default=160, ge=1, le=400)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_k: int = Field(default=40, ge=0, le=200)
    seed: int = Field(default=42)


class GenerateResponse(BaseModel):
    output: str
    model: str = "w-1.1-125m-instruct"
    tokens_generated: int


# ── Endpoints ──

@app.get("/")
def root():
    return {
        "service": "Jhelum Labs W-1.1 Inference API",
        "version": "1.0.0",
        "status": "error" if _load_error else "ready",
        "model": "w-1.1-125m-instruct",
    }


@app.get("/health")
def health():
    if _load_error:
        return JSONResponse(status_code=503, content={"status": "error", "detail": _load_error})
    if _model is None:
        return JSONResponse(status_code=503, content={"status": "loading"})
    return {"status": "ok", "device": _device}


@app.post("/generate", response_model=GenerateResponse)
async def generate_endpoint(req: GenerateRequest, request: Request):
    # rate limit
    client_ip = request.headers.get("x-forwarded-for", request.client.host or "unknown").split(",")[0].strip()
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait a moment and try again.",
        )

    # model ready?
    if _load_error:
        raise HTTPException(status_code=503, detail=f"Model failed to load: {_load_error}")
    if _model is None:
        raise HTTPException(status_code=503, detail="Model is still loading. Try again in a few seconds.")

    # cap tokens
    max_tokens = min(req.max_new_tokens, MAX_TOKENS_CAP)

    # one inference at a time (avoids OOM on CPU Spaces)
    if not _inference_lock.acquire(blocking=False):
        raise HTTPException(
            status_code=429,
            detail="The model is busy with another request. Please try again in a moment.",
        )
    try:
        output = generate_text(
            _model, _cfg, _tokenizer, _device,
            prompt=req.prompt,
            max_new_tokens=max_tokens,
            temperature=req.temperature,
            top_k=req.top_k,
            seed=req.seed,
        )
    finally:
        _inference_lock.release()

    return GenerateResponse(
        output=output,
        tokens_generated=len(_tokenizer.encode(output).ids),
    )
