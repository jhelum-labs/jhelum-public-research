import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './Playground.css'

const WEIGHTS_URL =
  'https://github.com/wasif-ali-ganie/origin-labs-w-1.1/releases/download/v1.0.0/w-1.1.safetensors'
const REPO_URL = 'https://github.com/jhelum-labs/w-1.1'
const WEIGHTS_SHA256 = '8b00898bcbbc77f9b6045d3c605bac5fffb90f7e8a60192b9232f1c33b6511f2'

const MODEL_SPECS = [
  { label: 'Parameters', value: '123.7M' },
  { label: 'Vocabulary', value: '32K BPE' },
  { label: 'Context', value: '2,048 tokens' },
  { label: 'Layers', value: '14' },
  { label: 'Heads', value: '12' },
  { label: 'Hidden dim', value: '768' },
  { label: 'Architecture', value: 'Decoder-only' },
  { label: 'License', value: 'Apache-2.0' },
]

const STEPS = [
  {
    title: 'Clone the repository',
    code: 'git clone https://github.com/jhelum-labs/w-1.1\ncd w-1.1',
  },
  {
    title: 'Set up environment',
    code: 'python -m venv .venv\n\n# Windows\n.venv\\Scripts\\activate\n\n# macOS / Linux\nsource .venv/bin/activate\n\npip install -r requirements.txt',
  },
  {
    title: 'Download the weights',
    desc: 'Download w-1.1.safetensors and place it inside the weights/ directory.',
    download: true,
  },
  {
    title: 'Run inference',
    code: 'python generate.py --prompt "What is photosynthesis?" --device auto',
  },
]

const OPTIONS = [
  { flag: '--temperature', default: '0.7', desc: 'Randomness. Lower = focused, higher = creative.' },
  { flag: '--max-new-tokens', default: '160', desc: 'Tokens to generate. Max recommended: 400.' },
  { flag: '--top-k', default: '40', desc: 'Top-k sampling. Set 0 to disable.' },
  { flag: '--device', default: 'auto', desc: 'Auto-detects CUDA, falls back to CPU.' },
]

const EXAMPLES = [
  'python generate.py --prompt "What is photosynthesis?"',
  'python generate.py --prompt "Write a poem about the night sky." --temperature 0.9 --max-new-tokens 200',
  'python generate.py --prompt "Explain machine learning simply." --top-k 50',
]

/* ── Scroll-reveal ── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'reveal--in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ── Icons ── */
const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)
const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const TerminalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
)
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const ExternalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

/* ── Code block — icon-only copy, no text ── */
function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="codeblock">
      <div className="codeblock__bar">
        <div className="codeblock__dots" aria-hidden="true">
          <span /><span /><span />
        </div>
        <div className="codeblock__bar-center">
          <TerminalIcon />
          <span className="codeblock__lang">bash</span>
        </div>
        <button
          className={`codeblock__copy ${copied ? 'codeblock__copy--done' : ''}`}
          onClick={copy}
          aria-label={copied ? 'Copied' : 'Copy'}
          title={copied ? 'Copied!' : 'Copy'}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
      <pre className="codeblock__pre"><code className="codeblock__code">{code}</code></pre>
    </div>
  )
}

/* ── Animated number counter ── */
function Counter({ target }) {
  const [count, setCount] = useState(0)
  const [ref, visible] = useReveal()
  useEffect(() => {
    if (!visible) return
    let start = 0
    const step = Math.ceil(target / 40)
    const t = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(t) }
      else setCount(start)
    }, 30)
    return () => clearInterval(t)
  }, [visible, target])
  return <span ref={ref}>{count}</span>
}

export default function Playground() {
  return (
    <div className="pg">

      {/* Sticky download bar */}
      <div className="pg__sticky">
        <div className="container pg__sticky-inner">
          <span className="pg__sticky-label">W-1.1 · 123M params · Apache-2.0</span>
          <a href={WEIGHTS_URL} className="pg__sticky-btn" download>
            <DownloadIcon /> Download weights
          </a>
        </div>
      </div>

      <div className="container pg__body">
        <Link to="/" className="pg__back pg__back--anim">← Research</Link>

        {/* ══════════════ HERO ══════════════ */}
        <section className="pg__hero">
          {/* Animated background blobs */}
          <div className="pg__blob pg__blob--1" aria-hidden="true" />
          <div className="pg__blob pg__blob--2" aria-hidden="true" />
          <div className="pg__blob pg__blob--3" aria-hidden="true" />

          <div className="pg__hero-content">
            <div className="pg__badges pg__hero-anim" style={{ animationDelay: '0ms' }}>
              <span className="pg__badge pg__badge--open">Open Weights</span>
              <span className="pg__badge pg__badge--beta">Beta</span>
            </div>

            <h1 className="pg__title pg__hero-anim" style={{ animationDelay: '100ms' }}>
              W-1.1
            </h1>
            <p className="pg__subtitle pg__hero-anim" style={{ animationDelay: '180ms' }}>
              by Jhelum Labs
            </p>
            <p className="pg__desc pg__hero-anim" style={{ animationDelay: '260ms' }}>
              A 123M-parameter decoder-only language model trained entirely from scratch.
              Open weights — download and run locally in under 5 minutes.
            </p>

            <div className="pg__hero-btns pg__hero-anim" style={{ animationDelay: '340ms' }}>
              <a href={WEIGHTS_URL} className="pg__btn-primary" download>
                <DownloadIcon /> Download · 493 MB
              </a>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="pg__btn-ghost">
                GitHub <ExternalIcon />
              </a>
            </div>

            <p className="pg__warning pg__hero-anim" style={{ animationDelay: '420ms' }}>
              ⚠ Experimental research model. Outputs may be inaccurate or repetitive.
            </p>

            {/* Animated stats row */}
            <div className="pg__stats pg__hero-anim" style={{ animationDelay: '500ms' }}>
              <div className="pg__stat">
                <span className="pg__stat-num"><Counter target={123} />M</span>
                <span className="pg__stat-label">Parameters</span>
              </div>
              <div className="pg__stat-div" />
              <div className="pg__stat">
                <span className="pg__stat-num"><Counter target={32} />K</span>
                <span className="pg__stat-label">Vocabulary</span>
              </div>
              <div className="pg__stat-div" />
              <div className="pg__stat">
                <span className="pg__stat-num"><Counter target={14} /></span>
                <span className="pg__stat-label">Layers</span>
              </div>
            </div>
          </div>

          {/* Spec card */}
          <div className="pg__spec pg__spec--anim">
            <p className="pg__spec-eyebrow">Model specs</p>
            <ul className="pg__spec-list">
              {MODEL_SPECS.map(({ label, value }, i) => (
                <li
                  key={label}
                  className="pg__spec-row pg__spec-row--anim"
                  style={{ animationDelay: `${320 + i * 55}ms` }}
                >
                  <span className="pg__spec-label">{label}</span>
                  <span className="pg__spec-value">{value}</span>
                </li>
              ))}
            </ul>
            <div className="pg__spec-sha">
              <span className="pg__spec-sha-key">SHA-256</span>
              <code className="pg__spec-sha-val">{WEIGHTS_SHA256.slice(0, 20)}…</code>
            </div>
          </div>
        </section>

        {/* ══════════════ QUICK START ══════════════ */}
        <section className="pg__section">
          <Reveal>
            <h2 className="pg__section-title">Quick start</h2>
          </Reveal>
          <div className="pg__steps">
            {STEPS.map((step, i) => (
              <Reveal key={i} delay={i * 70}>
                <div className="pg__step">
                  <div className="pg__step-left">
                    <div className="pg__step-num">{i + 1}</div>
                    {i < STEPS.length - 1 && <div className="pg__step-connector" />}
                  </div>
                  <div className="pg__step-body">
                    <h3 className="pg__step-title">{step.title}</h3>
                    {step.desc && <p className="pg__step-desc">{step.desc}</p>}
                    {step.download && (
                      <a href={WEIGHTS_URL} className="pg__btn-primary pg__btn-sm" download>
                        <DownloadIcon /> w-1.1.safetensors
                      </a>
                    )}
                    {step.code && <CodeBlock code={step.code} />}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══════════════ OPTIONS ══════════════ */}
        <section className="pg__section">
          <Reveal>
            <h2 className="pg__section-title">Generation options</h2>
          </Reveal>
          <Reveal delay={50}>
            <div className="pg__opts">
              <div className="pg__opts-head">
                <span>Flag</span><span>Default</span><span>Description</span>
              </div>
              {OPTIONS.map(({ flag, default: def, desc }, i) => (
                <div key={flag} className="pg__opts-row" style={{ animationDelay: `${i * 55}ms` }}>
                  <code className="pg__opt-flag">{flag}</code>
                  <code className="pg__opt-default">{def}</code>
                  <span className="pg__opt-desc">{desc}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ══════════════ EXAMPLES ══════════════ */}
        <section className="pg__section">
          <Reveal>
            <h2 className="pg__section-title">Example commands</h2>
          </Reveal>
          <div className="pg__examples">
            {EXAMPLES.map((cmd, i) => (
              <Reveal key={i} delay={i * 70}>
                <CodeBlock code={cmd} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══════════════ ABOUT ══════════════ */}
        <section className="pg__about">
          <Reveal>
            <h2 className="pg__section-title">About W-1.1</h2>
          </Reveal>
          <div className="pg__about-grid">
            {[
              { title: 'Architecture', body: 'Decoder-only causal Transformer with RoPE, RMSNorm, SwiGLU and tied embeddings. Built entirely from scratch in PyTorch.' },
              { title: 'Training', body: 'Pretrained on web text then instruction-tuned on 300K Q&A pairs. Final run on an NVIDIA H100 80 GB GPU.' },
              { title: 'Open weights', body: 'Apache-2.0 weights on GitHub Releases. Download and run locally with the provided generate.py — no API key needed.' },
              { title: 'Limitations', body: '123M is a research scale. Expect grammatical output but factual errors, repetition and hallucinations are common.' },
            ].map(({ title, body }, i) => (
              <Reveal key={title} delay={i * 70}>
                <div className="pg__about-card">
                  <h3 className="pg__about-card-title">{title}</h3>
                  <p>{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
