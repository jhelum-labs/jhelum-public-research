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
  { label: 'Context window', value: '2,048 tokens' },
  { label: 'Layers', value: '14' },
  { label: 'Attention heads', value: '12' },
  { label: 'Hidden dim', value: '768' },
  { label: 'Architecture', value: 'Decoder-only' },
  { label: 'License', value: 'Apache-2.0' },
]

const STEPS = [
  { title: 'Clone the repository', code: 'git clone https://github.com/jhelum-labs/w-1.1\ncd w-1.1' },
  { title: 'Set up environment', code: 'python -m venv .venv\n# Windows\n.venv\\Scripts\\activate\n# macOS / Linux\nsource .venv/bin/activate\n\npip install -r requirements.txt' },
  { title: 'Download the weights', desc: 'Download w-1.1.safetensors and place it inside the weights/ directory.', download: true },
  { title: 'Run inference', code: 'python generate.py --prompt "What is photosynthesis?" --device auto' },
]

const OPTIONS = [
  { flag: '--temperature', default: '0.7', desc: 'Randomness of output. Lower = focused, higher = creative.' },
  { flag: '--max-new-tokens', default: '160', desc: 'Number of tokens to generate. Max recommended: 400.' },
  { flag: '--top-k', default: '40', desc: 'Limit sampling to top-k tokens. Set 0 to disable.' },
  { flag: '--device', default: 'auto', desc: 'Auto-detects CUDA. Falls back to CPU automatically.' },
]

/* ── Scroll-reveal hook ── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

function Reveal({ children, className = '', delay = 0 }) {
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

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="pg-copy"
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      {copied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
    </button>
  )
}

const CopyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)
const ExternalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

export default function Playground() {
  return (
    <div className="pg">

      {/* Sticky bar */}
      <div className="pg__sticky-bar">
        <div className="container pg__sticky-inner">
          <span className="pg__sticky-label">W-1.1 · 123M params · Apache-2.0</span>
          <a href={WEIGHTS_URL} className="pg__sticky-btn" download>
            <DownloadIcon /> Download weights
          </a>
        </div>
      </div>

      <div className="container pg__body">

        <Link to="/" className="pg__back pg__back--anim">← Research</Link>

        {/* ── Hero ── */}
        <section className="pg__hero">
          <div className="pg__hero-glow" aria-hidden="true" />

          <div className="pg__hero-content">
            <div className="pg__badge-row pg__hero-anim" style={{ animationDelay: '0ms' }}>
              <span className="pg__badge pg__badge--open">Open Weights</span>
              <span className="pg__badge pg__badge--beta">Beta</span>
            </div>
            <h1 className="pg__title pg__hero-anim" style={{ animationDelay: '80ms' }}>W-1.1</h1>
            <p className="pg__subtitle pg__hero-anim" style={{ animationDelay: '160ms' }}>by Jhelum Labs</p>
            <p className="pg__desc pg__hero-anim" style={{ animationDelay: '240ms' }}>
              A 123M-parameter decoder-only language model trained from scratch.
              Fully open weights — download and run locally in minutes.
            </p>
            <div className="pg__hero-actions pg__hero-anim" style={{ animationDelay: '320ms' }}>
              <a href={WEIGHTS_URL} className="pg__btn-primary" download>
                <DownloadIcon /> Download weights · 493 MB
              </a>
              <a href={REPO_URL} target="_blank" rel="noreferrer" className="pg__btn-ghost">
                GitHub <ExternalIcon />
              </a>
            </div>
            <p className="pg__warning pg__hero-anim" style={{ animationDelay: '400ms' }}>
              ⚠ Experimental research model. Outputs may be inaccurate or repetitive. Not for production use.
            </p>
          </div>

          {/* Spec card */}
          <div className="pg__spec-card pg__spec-card--anim">
            <p className="pg__spec-eyebrow">Model specs</p>
            <ul className="pg__spec-list">
              {MODEL_SPECS.map(({ label, value }, i) => (
                <li
                  key={label}
                  className="pg__spec-item pg__spec-item--anim"
                  style={{ animationDelay: `${300 + i * 60}ms` }}
                >
                  <span className="pg__spec-label">{label}</span>
                  <span className="pg__spec-value">{value}</span>
                </li>
              ))}
            </ul>
            <div className="pg__spec-sha">
              <span className="pg__spec-sha-label">SHA-256</span>
              <code className="pg__spec-sha-val">{WEIGHTS_SHA256.slice(0, 20)}…</code>
            </div>
          </div>
        </section>

        {/* ── Quick start ── */}
        <section className="pg__section">
          <Reveal><h2 className="pg__section-title">Quick start</h2></Reveal>
          <div className="pg__steps">
            {STEPS.map((step, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="pg__step">
                  <div className="pg__step-left">
                    <div className="pg__step-dot pg__step-dot--anim" style={{ animationDelay: `${i * 100}ms` }}>{i + 1}</div>
                    {i < STEPS.length - 1 && <div className="pg__step-line" />}
                  </div>
                  <div className="pg__step-body">
                    <h3 className="pg__step-title">{step.title}</h3>
                    {step.desc && <p className="pg__step-desc">{step.desc}</p>}
                    {step.download && (
                      <a href={WEIGHTS_URL} className="pg__btn-primary pg__btn-sm" download>
                        <DownloadIcon /> Download w-1.1.safetensors
                      </a>
                    )}
                    {step.code && (
                      <div className="pg__code-block">
                        <pre className="pg__code"><code>{step.code}</code></pre>
                        <CopyButton text={step.code} />
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Generation options ── */}
        <section className="pg__section">
          <Reveal><h2 className="pg__section-title">Generation options</h2></Reveal>
          <Reveal delay={60}>
            <div className="pg__options-table">
              <div className="pg__options-head">
                <span>Flag</span><span>Default</span><span>Description</span>
              </div>
              {OPTIONS.map(({ flag, default: def, desc }, i) => (
                <div key={flag} className="pg__options-row pg__options-row--anim" style={{ animationDelay: `${i * 60}ms` }}>
                  <code className="pg__opt-flag">{flag}</code>
                  <code className="pg__opt-default">{def}</code>
                  <span className="pg__opt-desc">{desc}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── Example commands ── */}
        <section className="pg__section">
          <Reveal><h2 className="pg__section-title">Example commands</h2></Reveal>
          <div className="pg__example-list">
            {[
              'python generate.py --prompt "What is photosynthesis?"',
              'python generate.py --prompt "Write a short poem about the night sky." --temperature 0.9 --max-new-tokens 200',
              'python generate.py --prompt "Explain machine learning in simple terms." --top-k 50',
            ].map((cmd, i) => (
              <Reveal key={cmd} delay={i * 80}>
                <div className="pg__code-block">
                  <pre className="pg__code"><code>{cmd}</code></pre>
                  <CopyButton text={cmd} />
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── About ── */}
        <section className="pg__about">
          <Reveal><h2 className="pg__section-title">About W-1.1</h2></Reveal>
          <div className="pg__about-grid">
            {[
              { title: 'Architecture', body: 'Decoder-only causal Transformer with RoPE positional encoding, RMSNorm, SwiGLU activations and tied input/output embeddings. Built entirely from scratch in PyTorch.' },
              { title: 'Training', body: 'Pretrained on a large web-text corpus then instruction-tuned on 300K Q&A pairs (Project Instruct). Final run on an NVIDIA H100 80 GB GPU.' },
              { title: 'Open weights', body: 'Weights published as a GitHub Release asset under Apache-2.0. Download the safetensors file and run it locally with the provided generate.py.' },
              { title: 'Limitations', body: '123M parameters is a research scale. Expect grammatical output on familiar topics but factual errors, repetition and hallucinations are common.' },
            ].map(({ title, body }, i) => (
              <Reveal key={title} delay={i * 80}>
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
