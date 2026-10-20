/**
 * SilkAurora — WebGL aurora hero background
 * Inspired by componentry.dev/docs/components/silk-aurora
 * Content was rephrased for compliance with licensing restrictions.
 */
import { useEffect, useRef } from 'react'

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
uniform vec2  u_res;
uniform float u_t;
uniform vec2  u_mouse;
uniform vec3  u_base;
uniform vec3  u_accent;
uniform float u_intensity;
uniform float u_grain;
uniform float u_vignette;

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1,0));
  float c = hash21(i + vec2(0,1));
  float d = hash21(i + vec2(1,1));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  mat2 rot = mat2(cos(0.5), -sin(0.5), sin(0.5), cos(0.5));
  for (int i = 0; i < 5; i++) {
    v += a * noise(p); p = rot * p * 2.02; a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p  = uv * 2.0 - 1.0;
  p.x *= u_res.x / u_res.y;

  /* subtle mouse ripple */
  vec2 m = (u_mouse - 0.5) * 2.0;
  m.x *= u_res.x / u_res.y;
  float md = length(p - m);
  p += normalize(p - m) * exp(-md * 2.5) * 0.08;

  float t = u_t * 0.18;

  /* layered fbm aurora */
  vec2 q = vec2(fbm(p + t * 0.9), fbm(p + vec2(5.2, 1.3) + t));
  vec2 r = vec2(fbm(p + 3.5*q + vec2(1.7,9.2) + t*1.15),
                fbm(p + 3.5*q + vec2(8.3,2.8) + t*0.9));
  float f = fbm(p + 3.8*r * u_intensity);

  vec3 col = u_base;
  col = mix(col, u_accent * 0.6, smoothstep(0.25, 0.55, f));
  col = mix(col, u_accent,       smoothstep(0.55, 0.75, f));
  /* pearlescent sheen */
  col = mix(col, vec3(0.96, 0.92, 0.85), smoothstep(0.72, 0.88, f) * 0.55);
  col = mix(col, vec3(1.0),              smoothstep(0.88, 1.0,  f) * 0.3);

  /* vignette */
  float vig = 1.0 - smoothstep(0.3, 1.3, length(p) * u_vignette);
  col *= vig;

  /* grain */
  float g = (hash21(uv * u_res + u_t * 13.7) - 0.5) * u_grain * 0.06;
  col += g;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

function compileShader(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error('[SilkAurora] shader error:', gl.getShaderInfoLog(sh))
    gl.deleteShader(sh)
    return null
  }
  return sh
}

export default function SilkAurora({
  className = '',
  baseColor   = [0.03, 0.03, 0.06],
  accentColor = [0.1,  0.45, 0.5 ],
  speed       = 1,
  intensity   = 1,
  grain       = 0.85,
  vignette    = 1,
  interactive = true,
}) {
  const canvasRef = useRef(null)
  const liveRef   = useRef({ baseColor, accentColor, speed, intensity, grain, vignette, interactive })
  liveRef.current = { baseColor, accentColor, speed, intensity, grain, vignette, interactive }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { alpha: true, antialias: false })
    if (!gl) return

    const vert = compileShader(gl, gl.VERTEX_SHADER,   VERT)
    const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG)
    if (!vert || !frag) return

    const prog = gl.createProgram()
    gl.attachShader(prog, vert)
    gl.attachShader(prog, frag)
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const uRes      = gl.getUniformLocation(prog, 'u_res')
    const uT        = gl.getUniformLocation(prog, 'u_t')
    const uMouse    = gl.getUniformLocation(prog, 'u_mouse')
    const uBase     = gl.getUniformLocation(prog, 'u_base')
    const uAccent   = gl.getUniformLocation(prog, 'u_accent')
    const uIntens   = gl.getUniformLocation(prog, 'u_intensity')
    const uGrain    = gl.getUniformLocation(prog, 'u_grain')
    const uVignette = gl.getUniformLocation(prog, 'u_vignette')

    const mouse = [0.5, 0.5]
    const start = performance.now()
    let raf

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width  = Math.max(1, width  * dpr) | 0
      canvas.height = Math.max(1, height * dpr) | 0
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(uRes, canvas.width, canvas.height)
    }

    const onMove = (e) => {
      if (!liveRef.current.interactive) return
      const r = canvas.getBoundingClientRect()
      mouse[0] = (e.clientX - r.left) / r.width
      mouse[1] = 1 - (e.clientY - r.top) / r.height
    }

    const render = (now) => {
      const { baseColor: bc, accentColor: ac, speed: sp, intensity: it, grain: gr, vignette: vi } = liveRef.current
      gl.uniform1f(uT,        (now - start) * 0.001 * sp)
      gl.uniform2f(uMouse,    mouse[0], mouse[1])
      gl.uniform3f(uBase,     bc[0], bc[1], bc[2])
      gl.uniform3f(uAccent,   ac[0], ac[1], ac[2])
      gl.uniform1f(uIntens,   it)
      gl.uniform1f(uGrain,    gr)
      gl.uniform1f(uVignette, vi)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      raf = requestAnimationFrame(render)
    }

    const obs = new ResizeObserver(resize)
    obs.observe(canvas)
    window.addEventListener('pointermove', onMove, { passive: true })
    resize()
    raf = requestAnimationFrame(render)

    return () => {
      obs.disconnect()
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
      gl.deleteProgram(prog)
      gl.deleteShader(vert)
      gl.deleteShader(frag)
      gl.deleteBuffer(buf)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`silk-aurora ${className}`.trim()}
      aria-hidden="true"
    />
  )
}
