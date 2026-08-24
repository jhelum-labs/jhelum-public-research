import { useState } from 'react'
import './Playground.css'

const API_URL = 'https://jhelum-labs-w-1-1-playground.hf.space/generate'

const EXAMPLES = [
  'What is photosynthesis?',
  'Explain the concept of gravity in simple terms.',
  'Write a short poem about the night sky.',
  'What is machine learning?',
]

export default function Playground() {
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokens, setTokens] = useState(160)
  const [temperature, setTemperature] = useState(0.7)

  const run = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setOutput('')
    setError('')
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), max_new_tokens: tokens, temperature }),
      })
      if (!res.ok) throw new Error(`Server error (${res.status})`)
      const data = await res.json()
      setOutput(data.output)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run()
  }

  return (
    <div className="playground">
      <div className="container playground__inner">

        <header className="playground__header">
          <div className="playground__badge">Beta</div>
          <h1 className="playground__title">Try W-1.1</h1>
          <p className="playground__sub">
            W-1.1 is Jhelum Labs' first 125M-parameter language model — trained from scratch.
            Type a prompt and see what it generates.
          </p>
          <p className="playground__disclaimer">
            ⚠ Experimental research model. May produce inaccurate or repetitive output.
            Not for production use.
          </p>
        </header>

        <div className="playground__layout">
          <div className="playground__left">

            <div className="playground__examples">
              <p className="playground__examples-label">Try an example</p>
              <div className="playground__examples-list">
                {EXAMPLES.map((ex) => (
                  <button key={ex} className="example-chip" onClick={() => setPrompt(ex)}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <div className="playground__field">
              <label className="playground__label" htmlFor="prompt">Your prompt</label>
              <textarea
                id="prompt"
                className="playground__textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ask W-1.1 anything… (Ctrl+Enter to run)"
                rows={6}
              />
            </div>

            <div className="playground__controls">
              <div className="playground__control">
                <label className="playground__label">
                  Max tokens <span className="playground__val">{tokens}</span>
                </label>
                <input type="range" min={20} max={400} step={10} value={tokens}
                  onChange={(e) => setTokens(Number(e.target.value))} className="playground__range" />
              </div>
              <div className="playground__control">
                <label className="playground__label">
                  Temperature <span className="playground__val">{temperature}</span>
                </label>
                <input type="range" min={0} max={1.5} step={0.05} value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))} className="playground__range" />
              </div>
            </div>

            <button
              className={`playground__run${loading ? ' playground__run--loading' : ''}`}
              onClick={run}
              disabled={loading || !prompt.trim()}
            >
              {loading ? <><Spinner /> Generating…</> : 'Run W-1.1 →'}
            </button>
          </div>

          <div className="playground__right">
            <div className="playground__output-header">
              <span className="playground__label">Output</span>
              {output && (
                <button className="playground__copy" onClick={() => navigator.clipboard.writeText(output)}>
                  Copy
                </button>
              )}
            </div>
            <div className={`playground__output${loading ? ' playground__output--loading' : ''}`}>
              {loading && (
                <div className="playground__generating">
                  <Spinner />
                  <span>W-1.1 is thinking…</span>
                </div>
              )}
              {!loading && error && <p className="playground__error">{error}</p>}
              {!loading && !error && output && <p className="playground__text">{output}</p>}
              {!loading && !error && !output && (
                <p className="playground__placeholder">Output will appear here…</p>
              )}
            </div>

            <div className="playground__model-info">
              <span>W-1.1 · 123M params · 32K vocab · 2048 ctx</span>
              <a href="https://github.com/jhelum-labs/w-1.1/releases/tag/v1.0.0"
                target="_blank" rel="noreferrer" className="playground__model-link">
                v1.0.0 weights ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
