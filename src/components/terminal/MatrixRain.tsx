import { useEffect, useRef } from 'react'

/** Canvas "digital rain" that sits behind the terminal text. Toggled by the `matrix` command. */
export function MatrixRain() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const glyphs = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>{}[]=/\\|'
    const fontSize = 14
    let cols = 0
    let drops: number[] = []
    let raf = 0
    let last = 0

    const resize = () => {
      const r = canvas.parentElement?.getBoundingClientRect()
      if (!r) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = r.width * dpr
      canvas.height = r.height * dpr
      canvas.style.width = `${r.width}px`
      canvas.style.height = `${r.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(r.width / fontSize)
      drops = Array.from({ length: cols }, () => Math.random() * -50)
      ctx.fillStyle = 'rgba(0,0,0,1)'
      ctx.fillRect(0, 0, r.width, r.height)
    }

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      if (t - last < 55) return
      last = t
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
      ctx.fillRect(0, 0, w, h)
      ctx.font = `${fontSize}px ui-monospace, Menlo, monospace`
      for (let i = 0; i < cols; i++) {
        const ch = glyphs[Math.floor(Math.random() * glyphs.length)]
        const y = drops[i] * fontSize
        ctx.fillStyle = 'rgba(0, 255, 65, 0.9)'
        ctx.fillText(ch, i * fontSize, y)
        if (y > h && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
    }

    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-40" />
}
