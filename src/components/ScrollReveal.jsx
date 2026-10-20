/**
 * ScrollReveal — stagger-reveal children as they enter the viewport.
 * Pure CSS IntersectionObserver — no Framer Motion needed.
 */
import { useEffect, useRef } from 'react'

export default function ScrollReveal({ children, stagger = 80, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const items = Array.from(el.children)

    items.forEach((child, i) => {
      child.style.opacity = '0'
      child.style.transform = 'translateY(22px)'
      child.style.transition = `opacity 0.55s ease ${i * stagger}ms, transform 0.55s ease ${i * stagger}ms`
    })

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )

    items.forEach((child) => obs.observe(child))
    return () => obs.disconnect()
  }, [stagger])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
