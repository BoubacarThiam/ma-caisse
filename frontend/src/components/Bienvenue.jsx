import { useMemo } from 'react'

function TexteScintillant({ children, className = '', duration = 2, spread = 2 }) {
  const largeurEffet = useMemo(() => children.length * spread, [children, spread])

  return (
    <span
      className={`texte-scintillant ${className}`}
      style={{
        '--spread': `${largeurEffet}px`,
        animationDuration: `${duration}s`,
      }}
    >
      {children}
    </span>
  )
}

export default function Bienvenue({ onContinuer }) {
  return (
    <div className="bienvenue-ecran">
      <TexteScintillant className="bienvenue-titre" duration={2.5} spread={3}>
        Bienvenue Aminata
      </TexteScintillant>
      <p className="bienvenue-sous-titre">Ma Caisse</p>
      <button className="bienvenue-btn" onClick={onContinuer}>
        Entrer →
      </button>
    </div>
  )
}
