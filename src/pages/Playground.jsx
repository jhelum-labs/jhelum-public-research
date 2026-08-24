import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Playground.css'

const WEIGHTS_URL =
  'https://github.com/wasif-ali-ganie/origin-labs-w-1.1/releases/download/v1.0.0/w-1.1.safetensors'
const REPO_URL = 'https://github.com/jhelum-labs/w-1.1'
const WEIGHTS_SHA256 = '8B00898BCBBC77F9B6045D3C605BAC5FFFB90F7E8A60192B9232F1C33B6511F2'

const MODEL_SPECS = [
  { label: 'Parameters', value: '123.7M' },
  { label: 'Vocabulary', value: '32K BPE' },
  { label: 'Context', value: '2,048 tokens' },
  { label: 'Layers', value: '14' },
  { label: 'Heads', value: '12' },
  { label: 'Hidden dim', value: '768' },
  { label: 'Architecture', value: 'Decoder-only' },
  { label: 'Format', value: 'safetensors' },
]

const STEPS = [
  {
    num: '01',
    title: 'Clone the repository',
    code: 'git clone https://github.com/jhelum-labs/w-1.1\ncd w-1.1',
  },
  {
    num: '02',
    title: 'Create a virtual environment',
    code: 'python -m venv .venv\n# Windows:\n.venv\\Scripts\\activate\n# Linux / macOS:\nsource .venv/bin/activate',
  },
  {
    num: '03',
    title: 'Install dependencies',
    code: 'pip install -r requirements.txt',
  },
  {
    num: '04',
    title: 'Download the weights',
    desc: 'Download w-1.1.safetensors and place it in the weights/ folder inside the repo.',
    download: true,
  },
  {
    num: '05',
    title: 'Run the model',
    code: 'python generate.py --prompt "What is photosynthesis?" --device auto',
  },
]

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
      aria-label="Copy code"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

const ExternalIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

export default function Playground() {
  return (
    <div className="pg">
      <div className="container pg__inner">

        <Link to="/" className="pg__back">← Research</Link>

        {/* Hero */}
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
              W-1.1 is Jhelum Labs' first language model — 123M parameters, trained
              from scratch. The weights are fully open. Download them and run the
              model on your own machine in minutes.
            </p>
            <p className="pg__warning">
              <span className="pg__warning-icon">⚠</span>
              Experimental research model. Outputs may be inaccurate or repetitive.
              Not for production use.
            </p>
          </div>

          {/* Spec card */}
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
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="pg__spec-link">
              GitHub repo <ExternalIcon />
            </a>
          </div>
        </header>

        {/* Download CTA */}
        <div className="pg__download-banner">
          <div className="pg__download-info">
            <span className="pg__download-name">w-1.1.safetensors</span>
            <span className="pg__download-meta">~493 MB · Apache-2.0</span>
            <span className="pg__download-sha">SHA-256: {WEIGHTS_SHA256.toLowerCase().slice(0, 16)}…</span>
          </div>
          <a href={WEIGHTS_URL} className="pg__download-btn" download>
            <DownloadIcon />
            Download weights
          </a>
        </div>

        {/* Steps */}
        <section className="pg__steps">
          <h2 className="pg__steps-title">Run locally in 5 steps</h2>
          <div className="pg__steps-list">
            {STEPS.map((step) => (
              <div key={step.num} className="pg__step">
                <div className="pg__step-num">{step.num}</div>
                <div className="pg__step-body">
                  <h3 className="pg__step-title">{step.title}</h3>
                  {step.desc && <p className="pg__step-desc">{step.desc}</p>}
                  {step.download && (
                    <a href={WEIGHTS_URL} className="pg__step-dl" download>
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
            ))}
          </div>
        </section>

        {/* Options */}
        <section className="pg__options">
          <h2 className="pg__options-title">Generation options</h2>
          <div className="pg__options-grid">
            <div className="pg__option-card">
              <h3>Temperature</h3>
              <p>Controls randomness. Lower = more focused, higher = more creative. Default: <code>0.7</code></p>
              <code className="pg__option-cmd">--temperature 0.7</code>
            </div>
            <div className="pg__option-card">
              <h3>Max tokens</h3>
              <p>How many tokens to generate. Default: <code>160</code>, max recommended: <code>400</code></p>
              <code className="pg__option-cmd">--max-new-tokens 200</code>
            </div>
            <div className="pg__option-card">
              <h3>Top-k sampling</h3>
              <p>Limits sampling to the top k most likely tokens. Default: <code>40</code>. Set to <code>0</code> to disable.</p>
              <code className="pg__option-cmd">--top-k 40</code>
            </div>
            <div className="pg__option-card">
              <h3>Device</h3>
              <p>Auto-detects CUDA GPU. Falls back to CPU. Force CPU with <code>--device cpu</code></p>
              <code className="pg__option-cmd">--device auto</code>
            </div>
          </div>
        </section>

        {/* Example outputs */}
        <section className="pg__examples-section">
          <h2 className="pg__options-title">Example prompts</h2>
          <div className="pg__example-list">
            {[
              'python generate.py --prompt "What is photosynthesis?"',
              'python generate.py --prompt "Write a short poem about the night sky." --temperature 0.9 --max-new-tokens 200',
              'python generate.py --prompt "Explain machine learning in simple terms." --top-k 50',
            ].map((cmd) => (
              <div key={cmd} className="pg__code-block pg__code-block--example">
                <pre className="pg__code"><code>{cmd}</code></pre>
                <CopyButton text={cmd} />
              </div>
            ))}
          </div>
        </section>

        {/* About */}
        <section className="pg__about">
          <h2 className="pg__about-title">About W-1.1</h2>
          <div className="pg__about-grid">
            <div className="pg__about-card">
              <h3 className="pg__about-card-title">Architecture</h3>
              <p>Decoder-only causal Transformer with RoPE positional encoding,
                RMSNorm, SwiGLU activations and tied input/output embeddings.
                Built entirely from scratch in PyTorch.</p>
            </div>
            <div className="pg__about-card">
              <h3 className="pg__about-card-title">Training</h3>
              <p>Pretrained on a large web-text corpus then instruction-tuned
                on 300K Q&amp;A pairs (Project Instruct). Final run on an
                NVIDIA H100 80 GB GPU.</p>
            </div>
            <div className="pg__about-card">
              <h3 className="pg__about-card-title">Open weights</h3>
              <p>Weights are published as a GitHub Release asset under
                Apache-2.0. Download the safetensors file and run it locally
                with the provided <code>generate.py</code>.</p>
            </div>
            <div className="pg__about-card">
              <h3 className="pg__about-card-title">Limitations</h3>
              <p>125M parameters is a research scale. Expect grammatical output
                on familiar topics but factual errors, repetition and
                hallucinations are common.</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
