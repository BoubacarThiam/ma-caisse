import { useEffect, useRef } from 'react'

class Particule {
  pos = { x: 0, y: 0 }
  vel = { x: 0, y: 0 }
  acc = { x: 0, y: 0 }
  target = { x: 0, y: 0 }

  closeEnoughTarget = 100
  maxSpeed = 1.0
  maxForce = 0.1
  particleSize = 10
  isKilled = false

  startColor = { r: 0, g: 0, b: 0 }
  targetColor = { r: 0, g: 0, b: 0 }
  colorWeight = 0
  colorBlendRate = 0.01

  move() {
    let proximityMult = 1
    const distance = Math.sqrt(Math.pow(this.pos.x - this.target.x, 2) + Math.pow(this.pos.y - this.target.y, 2))

    if (distance < this.closeEnoughTarget) {
      proximityMult = distance / this.closeEnoughTarget
    }

    const versLaCible = {
      x: this.target.x - this.pos.x,
      y: this.target.y - this.pos.y,
    }

    const magnitude = Math.sqrt(versLaCible.x * versLaCible.x + versLaCible.y * versLaCible.y)
    if (magnitude > 0) {
      versLaCible.x = (versLaCible.x / magnitude) * this.maxSpeed * proximityMult
      versLaCible.y = (versLaCible.y / magnitude) * this.maxSpeed * proximityMult
    }

    const steer = {
      x: versLaCible.x - this.vel.x,
      y: versLaCible.y - this.vel.y,
    }

    const steerMagnitude = Math.sqrt(steer.x * steer.x + steer.y * steer.y)
    if (steerMagnitude > 0) {
      steer.x = (steer.x / steerMagnitude) * this.maxForce
      steer.y = (steer.y / steerMagnitude) * this.maxForce
    }

    this.acc.x += steer.x
    this.acc.y += steer.y

    this.vel.x += this.acc.x
    this.vel.y += this.acc.y
    this.pos.x += this.vel.x
    this.pos.y += this.vel.y
    this.acc.x = 0
    this.acc.y = 0
  }

  draw(ctx, drawAsPoints) {
    if (this.colorWeight < 1.0) {
      this.colorWeight = Math.min(this.colorWeight + this.colorBlendRate, 1.0)
    }

    const currentColor = {
      r: Math.round(this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight),
      g: Math.round(this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight),
      b: Math.round(this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight),
    }

    ctx.fillStyle = `rgb(${currentColor.r}, ${currentColor.g}, ${currentColor.b})`
    if (drawAsPoints) {
      ctx.fillRect(this.pos.x, this.pos.y, 2, 2)
    } else {
      ctx.beginPath()
      ctx.arc(this.pos.x, this.pos.y, this.particleSize / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  kill(width, height) {
    if (!this.isKilled) {
      const randomPos = genererPositionAleatoire(width / 2, height / 2, (width + height) / 2)
      this.target.x = randomPos.x
      this.target.y = randomPos.y

      this.startColor = {
        r: this.startColor.r + (this.targetColor.r - this.startColor.r) * this.colorWeight,
        g: this.startColor.g + (this.targetColor.g - this.startColor.g) * this.colorWeight,
        b: this.startColor.b + (this.targetColor.b - this.startColor.b) * this.colorWeight,
      }
      this.targetColor = { r: 0, g: 0, b: 0 }
      this.colorWeight = 0

      this.isKilled = true
    }
  }
}

function genererPositionAleatoire(x, y, mag) {
  const randomX = Math.random() * 1000
  const randomY = Math.random() * 500

  const direction = {
    x: randomX - x,
    y: randomY - y,
  }

  const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y)
  if (magnitude > 0) {
    direction.x = (direction.x / magnitude) * mag
    direction.y = (direction.y / magnitude) * mag
  }

  return { x: x + direction.x, y: y + direction.y }
}

const MOTS_DEFAUT = ['BIENVENUE', 'AMINATA', 'MA CAISSE']

export default function BienvenueParticules({ words = MOTS_DEFAUT, onContinuer }) {
  const canvasRef = useRef(null)
  const animationRef = useRef()
  const particlesRef = useRef([])
  const frameCountRef = useRef(0)
  const wordIndexRef = useRef(0)

  const pixelSteps = 6
  const drawAsPoints = true

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function redimensionner() {
      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight
    }
    redimensionner()

    function motSuivant(mot) {
      const offscreen = document.createElement('canvas')
      offscreen.width = canvas.width
      offscreen.height = canvas.height
      const offscreenCtx = offscreen.getContext('2d')

      offscreenCtx.fillStyle = 'white'
      const taillePolice = Math.max(28, Math.min(90, canvas.width / (mot.length * 0.62)))
      offscreenCtx.font = `bold ${taillePolice}px "Chakra Petch", Arial`
      offscreenCtx.textAlign = 'center'
      offscreenCtx.textBaseline = 'middle'
      offscreenCtx.fillText(mot, canvas.width / 2, canvas.height / 2)

      const imageData = offscreenCtx.getImageData(0, 0, canvas.width, canvas.height)
      const pixels = imageData.data

      const nouvelleCouleur = {
        r: Math.random() * 100 + 100,
        g: Math.random() * 155 + 100,
        b: Math.random() * 100 + 80,
      }

      const particles = particlesRef.current
      let particleIndex = 0

      const indexCoords = []
      for (let i = 0; i < pixels.length; i += pixelSteps * 4) {
        indexCoords.push(i)
      }
      for (let i = indexCoords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[indexCoords[i], indexCoords[j]] = [indexCoords[j], indexCoords[i]]
      }

      for (const coordIndex of indexCoords) {
        const alpha = pixels[coordIndex + 3]
        if (alpha > 0) {
          const x = (coordIndex / 4) % canvas.width
          const y = Math.floor(coordIndex / 4 / canvas.width)

          let particle
          if (particleIndex < particles.length) {
            particle = particles[particleIndex]
            particle.isKilled = false
            particleIndex++
          } else {
            particle = new Particule()
            const randomPos = genererPositionAleatoire(canvas.width / 2, canvas.height / 2, (canvas.width + canvas.height) / 2)
            particle.pos.x = randomPos.x
            particle.pos.y = randomPos.y
            particle.maxSpeed = Math.random() * 6 + 4
            particle.maxForce = particle.maxSpeed * 0.05
            particle.particleSize = Math.random() * 6 + 6
            particle.colorBlendRate = Math.random() * 0.0275 + 0.0025
            particles.push(particle)
          }

          particle.startColor = {
            r: particle.startColor.r + (particle.targetColor.r - particle.startColor.r) * particle.colorWeight,
            g: particle.startColor.g + (particle.targetColor.g - particle.startColor.g) * particle.colorWeight,
            b: particle.startColor.b + (particle.targetColor.b - particle.startColor.b) * particle.colorWeight,
          }
          particle.targetColor = nouvelleCouleur
          particle.colorWeight = 0
          particle.target.x = x
          particle.target.y = y
        }
      }

      for (let i = particleIndex; i < particles.length; i++) {
        particles[i].kill(canvas.width, canvas.height)
      }
    }

    function animer() {
      const particles = particlesRef.current

      ctx.fillStyle = 'rgba(10, 13, 20, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i]
        particle.move()
        particle.draw(ctx, drawAsPoints)

        if (particle.isKilled) {
          if (particle.pos.x < 0 || particle.pos.x > canvas.width || particle.pos.y < 0 || particle.pos.y > canvas.height) {
            particles.splice(i, 1)
          }
        }
      }

      frameCountRef.current++
      if (frameCountRef.current % 240 === 0) {
        wordIndexRef.current = (wordIndexRef.current + 1) % words.length
        motSuivant(words[wordIndexRef.current])
      }

      animationRef.current = requestAnimationFrame(animer)
    }

    motSuivant(words[0])
    animer()

    window.addEventListener('resize', redimensionner)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', redimensionner)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bienvenue-ecran">
      <canvas ref={canvasRef} className="bienvenue-canvas" />
      <div className="bienvenue-overlay">
        <p className="bienvenue-sous-titre">Ma Caisse</p>
        <button className="bienvenue-btn" onClick={onContinuer}>
          Entrer →
        </button>
      </div>
    </div>
  )
}
