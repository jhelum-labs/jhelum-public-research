---
title: Jhelum Labs W-1.1 Playground
emoji: 🧪
colorFrom: gray
colorTo: black
sdk: docker
pinned: false
app_port: 7860
---

# Jhelum Labs W-1.1 — Inference API

FastAPI backend for the W-1.1 playground at [research.jhelumlabs.com/playground](https://research.jhelumlabs.com/playground).

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info |
| GET | `/health` | Health check |
| POST | `/generate` | Generate text |

## POST /generate

```json
{
  "prompt": "What is machine learning?",
  "max_new_tokens": 160,
  "temperature": 0.7,
  "top_k": 40,
  "seed": 42
}
```

**Response:**
```json
{
  "output": "Machine learning is...",
  "model": "w-1.1-125m-instruct",
  "tokens_generated": 94
}
```

**Error codes:**
- `429` — Too many requests (rate limited or model busy)
- `503` — Model loading / cold start

## Cold start

On first request, the Space downloads the weights (~500 MB) from the GitHub Release.
This takes ~60 s. Subsequent requests are fast.

## Rate limiting

Default: 10 requests per IP per minute. Configurable via `RATE_LIMIT_PER_MINUTE` env var.
