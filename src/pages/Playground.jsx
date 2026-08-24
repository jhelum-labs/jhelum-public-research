import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Playground.css'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const API_URL = 'https://wasifali1-jhelum-labs.hf.space/generate'

const WEIGHTS_URL =
  'https://github.com/wasif-ali-ganie/origin-labs-w-1.1/releases/download/v1.0.0/w-1.1.safetensors'

const MODEL_REPO = 'https://github.com/jhelum-labs/w-1.1'

const EXAMPLES = [
  { label: 'Science', text: 'What is photosynthesis?' },
  { label: 'Physics', text: 'Explain the concept of gravity in simple terms.' },
  { label: 'Creative', text: 'Write a short poem about the night sky.' },
  { label: 'AI', text: 'What is machine learning?' },
  { label: 'History', text: 'Who was Alan Turing and what did he invent?' },
  { label: 'Math', text: 'Explain what a prime number is.' },
]

const MODEL_SPECS = [
  { label: 'Parameters', value: '123.7M' },
  { label: 'Vocabulary', value: '32K BPE' },
  { label: 'Context', value: '2,048 tok' },
  { label: 'Layers', value: '14' },
  { label: 'Heads', value: '12' },
  { label: 'Hidden', value: '768' },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Spinner({ size = 16 }) {
  return (
    <svg
      className="pg-spinner"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button className="pg-copy-btn" onClick={copy} title="Copy output" aria-label="Copy output">
      {copied ? (
        <>
          <CheckIcon /> Copied
        </>
      ) : (
        <>
          <CopyIcon /> Copy
        </>
      )}
    </button>
  )
}

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const ExternalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

// Animated token-by-token text reveal
function TypedOutput({ text }) {
  const [displayed, setDisplayed] = useState('')
  const iRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    iRef.current = 0
    if (!text) return
    const interval = setInterval(() => {
      iRef.current += 3 // reveal 3 chars per tick for fast feel
      setDisplayed(text.slice(0, iRef.current))
      if (iRef.current >= text.length) clearInterval(interval)
    }, 16)
    return () => clearInterval(interval)
  }, [text])

  return <span>{displayed}</span>
}

// Status dot
function StatusDot({ status }) {
  // status: 'idle' | 'loading' | 'ok' | 'error' | 'busy'
  const labels = { idle: 'Ready', loading: 'Generating…', ok: 'Done', error: 'Error', busy: 'Too many requests' }
  return (
    <span className={`pg-status pg-status--${status}`} aria-live="polite">
      <span className="pg-status__dot" />
      {labels[status] ?? 'Ready'}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function Playground() {
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | ok | error | busy
  const [errorMsg, setErrorMsg] = useState('')
  const [tokens, setTokens] = useState(160)
  const [temperature, setTemperature] = useState(0.7)
  const [topK, setTopK] = useState(40)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const outputRef = useRef(null)

  const run = async () => {
    if (!prompt.trim() || status === 'loading') return
    setStatus('loading')
    setOutput('')
    setErrorMsg('')

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          max_new_tokens: tokens,
          temperature,
          top_k: topK,
        }),
      })

      if (res.status === 429) {
        setStatus('busy')
        setErrorMsg('Too many requests — the model is currently busy. Please wait a moment and try again.')
        return
      }
      if (res.status === 503) {
        setStatus('error')
        setErrorMsg('The model server is waking up (cold start). This can take up to 60 seconds on first run. Please try again shortly.')
        return
      }
      if (!res.ok) {
        throw new Error(`Server error (${res.status})`)
      }

      const data = await res.json()
      setOutput(data.output ?? '')
      setStatus('ok')

      // scroll output into view on mobile
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    } catch (e) {
      setStatus('error')
      setErrorMsg(e.message || 'Network error — check your connection.')
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run()
  }

  const reset = () => {
    setPrompt('')
    setOutput('')
    setStatus('idle')
    setErrorMsg('')
  }

  const isLoading = status === 'loading'

  return (
    <div className="pg">
      <div className="container pg__inner">

        {/* ── Back nav ── */}
        <Link to="/" className="pg__back">← Research</Link>

        {/* ── Hero header ── */}
        <header className="pg__hero">
          <div className="pg__hero-left">
            <div className="pg__badge-row">
              <span className="pg__badge pg__badge--beta">Beta</span>
              <span className="pg__badge pg__badge--open">Open Weights</span>
            </div>
            <h1 className="pg__title">
              Try <span className="pg__title-accent">W-1.1</span>
            </h1>
            <p className="pg__desc">
              Jhelum Labs' first language model — 123M parameters, trained from scratch.
              Decoder-only Transformer with RoPE, RMSNorm and SwiGLU.
            </p>
            <p className="pg__warning">
              <span className="pg__warning-icon">⚠</span>
              Experimental research model. Outputs may be inaccurate, repetitive or unsafe.
              Not for production use.
            </p>
          </div>

          {/* Model spec card */}
          <div className="pg__spec-card">
            <p className="pg__spec-title">W-1.1 · Model specs</p>
            <ul className="pg__spec-list">
              {MODEL_SPECS.map(({ label, value }) => (
                <li key={label} className="pg__spec-item">
                  <span className="pg__spec-label">{label}</span>
                  <span className="pg__spec-value">{value}</span>
                </li>
              ))}
            </ul>
            <div className="pg__spec-links">
              <a href={MODEL_REPO} target="_blank" rel="noreferrer" className="pg__spec-link">
                GitHub repo <ExternalIcon />
              </a>
              <a href={WEIGHTS_URL} target="_blank" rel="noreferrer" className="pg__spec-link">
                Download weights <ExternalIcon />
              </a>
            </div>
          </div>
        </header>

        {/* ── Main inference UI ── */}
        <div className="pg__layout">

          {/* Left: input panel */}
          <div className="pg__panel pg__panel--input">

            {/* Example chips */}
            <div className="pg__section">
              <p className="pg__section-label">Try an example</p>
              <div className="pg__chips">
                {EXAMPLES.map(({ label, text }) => (
                  <button
                    key={text}
                    className={`pg__chip${prompt === text ? ' pg__chip--active' : ''}`}
                    onClick={() => setPrompt(text)}
                    title={text}
                  >
                    <span className="pg__chip-label">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt textarea */}
            <div className="pg__section">
              <label className="pg__section-label" htmlFor="pg-prompt">
                Prompt
                <span className="pg__char-count">{prompt.length} chars</span>
              </label>
              <textarea
                id="pg-prompt"
                className="pg__textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ask W-1.1 anything… (Ctrl+Enter to run)"
                rows={6}
                disabled={isLoading}
              />
            </div>

            {/* Basic sliders */}
            <div className="pg__section">
              <div className="pg__slider-row">
                <label className="pg__slider-label" htmlFor="pg-tokens">
                  Max tokens
                  <span className="pg__slider-val">{tokens}</span>
                </label>
                <input
                  id="pg-tokens"
                  type="range" min={20} max={400} step={10}
                  value={tokens}
                  onChange={(e) => setTokens(Number(e.target.value))}
                  className="pg__range"
                  disabled={isLoading}
                />
              </div>
              <div className="pg__slider-row">
                <label className="pg__slider-label" htmlFor="pg-temp">
                  Temperature
                  <span className="pg__slider-val">{temperature.toFixed(2)}</span>
                </label>
                <input
                  id="pg-temp"
                  type="range" min={0} max={1.5} step={0.05}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="pg__range"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Advanced toggle */}
            <button
              className="pg__advanced-toggle"
              onClick={() => setShowAdvanced((v) => !v)}
              type="button"
            >
              {showAdvanced ? '▾' : '▸'} Advanced settings
            </button>

            {showAdvanced && (
              <div className="pg__section pg__section--advanced">
                <div className="pg__slider-row">
                  <label className="pg__slider-label" htmlFor="pg-topk">
                    Top-k
                    <span className="pg__slider-val">{topK === 0 ? 'off' : topK}</span>
                  </label>
                  <input
                    id="pg-topk"
                    type="range" min={0} max={100} step={5}
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                    className="pg__range"
                    disabled={isLoading}
                  />
                </div>
                <p className="pg__advanced-note">
                  Top-k = 0 disables top-k filtering (pure temperature sampling).
                </p>
              </div>
            )}

            {/* Run / Reset buttons */}
            <div className="pg__actions">
              <button
                className={`pg__run-btn${isLoading ? ' pg__run-btn--loading' : ''}`}
                onClick={run}
                disabled={isLoading || !prompt.trim()}
              >
                {isLoading ? (
                  <><Spinner /> Generating…</>
                ) : (
                  'Run W-1.1 →'
                )}
              </button>
              {(output || errorMsg) && !isLoading && (
                <button className="pg__reset-btn" onClick={reset} type="button">
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Right: output panel */}
          <div className="pg__panel pg__panel--output" ref={outputRef}>

            <div className="pg__output-header">
              <span className="pg__section-label">Output</span>
              <div className="pg__output-header-right">
                <StatusDot status={status} />
                {output && <CopyButton text={output} />}
              </div>
            </div>

            <div className={`pg__output-body${isLoading ? ' pg__output-body--loading' : ''}`}>
              {isLoading && (
                <div className="pg__generating">
                  <Spinner size={20} />
                  <span>W-1.1 is thinking…</span>
                </div>
              )}

              {/* Too many requests */}
              {!isLoading && status === 'busy' && (
                <div className="pg__notice pg__notice--busy">
                  <span className="pg__notice-icon">🚦</span>
                  <div>
                    <strong>Too many requests</strong>
                    <p>{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Generic error */}
              {!isLoading && status === 'error' && (
                <div className="pg__notice pg__notice--error">
                  <span className="pg__notice-icon">⚠</span>
                  <div>
                    <strong>Something went wrong</strong>
                    <p>{errorMsg}</p>
                  </div>
                </div>
              )}

              {/* Output text */}
              {!isLoading && status === 'ok' && output && (
                <p className="pg__output-text">
                  <TypedOutput text={output} />
                </p>
              )}

              {/* Empty state */}
              {!isLoading && status === 'idle' && (
                <div className="pg__empty">
                  <p className="pg__empty-text">
                    Enter a prompt and press <kbd>Ctrl+Enter</kbd> or click Run.
                  </p>
                  <p className="pg__empty-note">
                    First run may take ~30–60 s while the model server wakes up.
                  </p>
                </div>
              )}
            </div>

            {/* Footer strip */}
            <div className="pg__output-footer">
              <span className="pg__model-tag">W-1.1-125M · instruct · v1.0.0</span>
              <a
                href={MODEL_REPO}
                target="_blank"
                rel="noreferrer"
                className="pg__gh-link"
              >
                GitHub <ExternalIcon />
              </a>
            </div>
          </div>
        </div>

        {/* ── About strip ── */}
        <section className="pg__about">
          <h2 className="pg__about-title">About W-1.1</h2>
          <div className="pg__about-grid">
            <div className="pg__about-card">
              <h3 className="pg__about-card-title">Architecture</h3>
              <p>Decoder-only causal Transformer — RoPE positional encoding, RMSNorm, SwiGLU activations, tied input/output embeddings. Built entirely from scratch in PyTorch.</p>
            </div>
            <div className="pg__about-card">
              <h3 className="pg__about-card-title">Training</h3>
              <p>Pretrained on a large web-text corpus, then instruction-tuned on 300K Q&A pairs (Project Instruct). Final pretraining run on an NVIDIA H100 80 GB GPU.</p>
            </div>
            <div className="pg__about-card">
              <h3 className="pg__about-card-title">Open weights</h3>
              <p>Weights are published as a GitHub Release asset under Apache-2.0. Download the safetensors file and run it locally with the provided <code>generate.py</code>.</p>
            </div>
            <div className="pg__about-card">
              <h3 className="pg__about-card-title">Limitations</h3>
              <p>125M parameters is a research scale. Expect grammatical output on familiar topics, but factual errors, repetition, and hallucinations are common. Not production-grade.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
