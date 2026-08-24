---
title: Jhelum Labs W-1.1
emoji: 🧪
colorFrom: gray
colorTo: black
sdk: gradio
sdk_version: "4.44.1"
app_file: app.py
pinned: false
license: apache-2.0
---

# Jhelum Labs W-1.1 — Playground & API

123M-parameter experimental language model trained from scratch by Jhelum Labs.

## REST API

The `/generate` endpoint is called by the React research portal.

**POST `/generate`**
```json
{
  "prompt": "What is photosynthesis?",
  "max_new_tokens": 160,
  "temperature": 0.7,
  "top_k": 40
}
```

**Response:**
```json
{ "output": "...", "model": "w-1.1-125m-instruct" }
```

**Error codes:**
- `429` — rate limited or model busy
- `503` — cold start / model loading

## Links
- [GitHub repo](https://github.com/jhelum-labs/w-1.1)
- [Research portal](https://github.com/jhelum-labs/jhelum-public-research)
