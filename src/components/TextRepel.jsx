import { useEffect, useRef } from 'react'
import './TextRepel.css'

export default function TextRepel({ text, className = '', radius = 150, strength = 34 }) {
  const containerRef = useRef(null)
  const lettersRef = useRef([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const reset = () => {
      lettersRef.current.forEach((letter) => {
        if (letter) letter.style.transform = ''
      })
    }

    const update = (event) => {
      const containerBounds = container.getBoundingClientRect()
      const cursorX = event.clientX - containerBounds.left
      const cursorY = event.clientY - containerBounds.top
      lettersRef.current.forEach((letter) => {
        if (!letter) return
        const bounds = letter.getBoundingClientRect()
        const x = bounds.left - containerBounds.left + bounds.width / 2
        const y = bounds.top - containerBounds.top + bounds.height / 2
        const dx = x - cursorX
        const dy = y - cursorY
        const distance = Math.hypot(dx, dy)
        if (distance >= radius || distance === 0) {
          letter.style.transform = ''
          return
        }
        const force = ((1 - distance / radius) ** 2) * strength
        const translateX = (dx / distance) * force
        const translateY = (dy / distance) * force
        letter.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) rotate(${translateX * 0.18}deg)`
      })
    }

    container.addEventListener('pointermove', update)
    container.addEventListener('pointerleave', reset)
    return () => {
      container.removeEventListener('pointermove', update)
      container.removeEventListener('pointerleave', reset)
    }
  }, [radius, strength])

  return (
    <span ref={containerRef} className={`text-repel ${className}`.trim()} aria-label={text}>
      {Array.from(text).map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          ref={(node) => { lettersRef.current[index] = node }}
          className={letter === ' ' ? 'text-repel__letter text-repel__letter--space' : 'text-repel__letter'}
          aria-hidden="true"
        >{letter}</span>
      ))}
    </span>
  )
}
