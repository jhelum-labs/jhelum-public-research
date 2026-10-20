import { useEffect, useRef } from 'react'
import './ScrollVelocity.css'

function VelocityLine({ text, direction = 1 }) {
  const trackRef = useRef(null)
  const positionRef = useRef(0)
  const lastScrollRef = useRef(0)
  const velocityRef = useRef(0)

  useEffect(() => {
    let frame
    let lastTime = performance.now()
    const onScroll = () => {
      velocityRef.current = window.scrollY - lastScrollRef.current
      lastScrollRef.current = window.scrollY
    }
    lastScrollRef.current = window.scrollY
    window.addEventListener('scroll', onScroll, { passive: true })
    const animate = (time) => {
      const delta = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time
      velocityRef.current *= 0.92
      positionRef.current += direction * (32 + Math.abs(velocityRef.current) * 8) * delta
      if (Math.abs(positionRef.current) > 240) positionRef.current %= 240
      if (trackRef.current) trackRef.current.style.transform = `translate3d(${positionRef.current}px, 0, 0)`
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', onScroll) }
  }, [direction])

  return <div className="velocity-line"><div ref={trackRef} className="velocity-line__track">{Array.from({ length: 8 }, (_, i) => <span key={i}>{text}</span>)}</div></div>
}

export default function ScrollVelocity({ text }) {
  return <section className="velocity" aria-label={text.trim()}><VelocityLine text={text} /><VelocityLine text={text} direction={-1} /></section>
}
