/**
 * SplitFlap — airport departure board flip animation
 * Inspired by componentry.dev/docs/components/split-flap-display
 * Content was rephrased for compliance with licensing restrictions.
 */
import { useEffect, useRef, useState } from 'react'

const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-+'

function useInView(ref) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setSeen(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [ref])
  return seen
}

function Cell({ target, delay = 0, flipSpeed = 40, accentColor = '#22c55e' }) {
  const [face, setFace] = useState(' ')
  const [flipping, setFlipping] = useState(false)
  const t = target.toUpperCase()

  useEffect(() => {
    let timer
    timer = setTimeout(() => {
      let idx = CHARS.indexOf(face) === -1 ? 0 : CHARS.indexOf(face)
      const targetIdx = CHARS.indexOf(t) === -1 ? 0 : CHARS.indexOf(t)

      const step = () => {
        setFlipping(true)
        setTimeout(() => {
          idx = (idx + 1) % CHARS.length
          setFace(CHARS[idx])
          setFlipping(false)
          if (CHARS[idx] !== t) {
            // not there yet — keep flipping
            setTimeout(step, flipSpeed)
          }
        }, flipSpeed / 2)
      }

      if (CHARS[idx] !== t) step()
    }, delay)

    return () => clearTimeout(timer)
  }, [t, delay, flipSpeed]) // eslint-disable-line

  return (
    <div className="sf-cell" aria-hidden="true">
      <div className="sf-cell-inner" style={{ '--accent': accentColor }}>
        <div className={`sf-face ${flipping ? 'sf-face--flip' : ''}`}>
          {face}
        </div>
        <div className="sf-line" />
      </div>
    </div>
  )
}

export default function SplitFlap({
  text = '',
  accentColor = '#22c55e',
  staggerDelay = 35,
  flipSpeed = 40,
  className = '',
}) {
  const ref = useRef(null)
  const seen = useInView(ref)
  const chars = text.toUpperCase().split('')

  return (
    <div ref={ref} className={`sf-wrap ${className}`} aria-label={text}>
      {chars.map((ch, i) => (
        <Cell
          key={i}
          target={seen ? ch : ' '}
          delay={i * staggerDelay}
          flipSpeed={flipSpeed}
          accentColor={accentColor}
        />
      ))}
    </div>
  )
}
