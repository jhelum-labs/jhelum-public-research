import { useEffect, useRef } from 'react'

const vertexShaderSource = `
  attribute vec2 position;
  void main() { gl_Position = vec4(position, 0.0, 1.0); }
`

const fragmentShaderSource = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform vec3 u_baseColor;
  uniform float u_amplitude;

  const mat2 m = mat2(0.80, 0.60, -0.60, 0.80);
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float f = 0.0;
    f += 0.5000 * noise(p); p = m * p * 2.02;
    f += 0.2500 * noise(p); p = m * p * 2.03;
    f += 0.1250 * noise(p); p = m * p * 2.01;
    f += 0.0625 * noise(p);
    return f / 0.9375;
  }
  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 p = -1.0 + 2.0 * uv;
    p.x *= u_resolution.x / u_resolution.y;
    vec2 mouse = (u_mouse - 0.5) * 2.0;
    mouse.x *= u_resolution.x / u_resolution.y;
    vec2 diff = p - mouse;
    float dist = length(diff);
    if (dist > 0.0) p += (diff / dist) * exp(-dist * 3.0) * 0.1;

    float time = u_time * 0.5;
    vec2 q = vec2(fbm(p + time * 0.1), fbm(p + vec2(5.2, 1.3) + time * 0.15));
    vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + time * 0.2), fbm(p + 4.0 * q + vec2(8.3, 2.8) + time * 0.25));
    float f = fbm(p + r * 4.0 * u_amplitude);

    vec3 col = u_baseColor;
    float highlight = smoothstep(0.4, 0.6, f);
    float highlight2 = smoothstep(0.6, 0.8, f);
    float dark = smoothstep(0.1, 0.3, f);
    col = mix(col, vec3(0.0), 1.0 - dark);
    col = mix(col, vec3(0.8, 0.8, 0.9), highlight);
    col = mix(col, vec3(1.0), highlight2);
    float v = 16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y);
    col *= 0.5 + 0.5 * pow(max(0.0, v), 0.2);
    gl_FragColor = vec4(col, 1.0);
  }
`

export default function LiquidChrome({
  className = '',
  baseColor = [0.1, 0.1, 0.1],
  speed = 1,
  amplitude = 0.6,
  interactive = true,
}) {
  const canvasRef = useRef(null)
  const settingsRef = useRef({ baseColor, speed, amplitude, interactive })
  settingsRef.current = { baseColor, speed, amplitude, interactive }

  useEffect(() => {
    const canvas = canvasRef.current
    const gl = canvas?.getContext('webgl', { alpha: true })
    if (!gl) return undefined

    const compile = (type, source) => {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Liquid Chrome shader error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertex = compile(gl.VERTEX_SHADER, vertexShaderSource)
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vertex || !fragment) return undefined

    const program = gl.createProgram()
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return undefined
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(position)
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

    const resolution = gl.getUniformLocation(program, 'u_resolution')
    const time = gl.getUniformLocation(program, 'u_time')
    const mouseUniform = gl.getUniformLocation(program, 'u_mouse')
    const color = gl.getUniformLocation(program, 'u_baseColor')
    const detail = gl.getUniformLocation(program, 'u_amplitude')
    const mouse = [0.5, 0.5]
    const start = performance.now()
    let frame

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const scale = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(rect.width * scale))
      canvas.height = Math.max(1, Math.floor(rect.height * scale))
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(resolution, canvas.width, canvas.height)
    }

    const move = (event) => {
      if (!settingsRef.current.interactive) return
      const rect = canvas.getBoundingClientRect()
      mouse[0] = (event.clientX - rect.left) / rect.width
      mouse[1] = 1 - (event.clientY - rect.top) / rect.height
    }

    const render = (now) => {
      const settings = settingsRef.current
      gl.uniform1f(time, (now - start) * 0.001 * settings.speed)
      gl.uniform2f(mouseUniform, mouse[0], mouse[1])
      gl.uniform3f(color, ...settings.baseColor)
      gl.uniform1f(detail, settings.amplitude)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
      frame = requestAnimationFrame(render)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    canvas.addEventListener('pointermove', move)
    resize()
    frame = requestAnimationFrame(render)

    return () => {
      observer.disconnect()
      canvas.removeEventListener('pointermove', move)
      cancelAnimationFrame(frame)
      gl.deleteProgram(program)
      gl.deleteShader(vertex)
      gl.deleteShader(fragment)
      gl.deleteBuffer(buffer)
    }
  }, [])

  return <canvas ref={canvasRef} className={`liquid-chrome ${className}`.trim()} aria-hidden="true" />
}
