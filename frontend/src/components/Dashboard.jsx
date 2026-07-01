import React, { useState } from 'react'
import { formaterMontant } from '../utils/format.js'
import { reinitialiserSoldes } from '../utils/api.js'

const POCHES = [
  { cle: 'especes',      label: 'Espèces',      icone: '💵', classe: 'especes' },
  { cle: 'wave',         label: 'Wave',         icone: '🔵', classe: 'wave' },
  { cle: 'orange_money', label: 'Orange Money', icone: '🟠', classe: 'orange' },
  { cle: 'free_money',   label: 'Free Money',   icone: '🟣', classe: 'free' },
]

export default function Dashboard({
  soldes, avoirReel, totalCreances, totalDettes,
  dernierAvoir, onFaireDescente, onReinitialiser,
}) {
  const [confirmReinit, setConfirmReinit] = useState(false)
  const [enCours,       setEnCours]       = useState(false)
  const [errReinit,     setErrReinit]     = useState(null)

  const variation = dernierAvoir !== null ? avoirReel - Number(dernierAvoir) : null

  async function handleReinit() {
    setEnCours(true)
    setErrReinit(null)
    try {
      await reinitialiserSoldes()
      setConfirmReinit(false)
      onReinitialiser()
    } catch (e) {
      setErrReinit(e.message)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="ecran">

      {/* ── Avoir réel ── */}
      <div className="avoir-principal">
        <div className="avoir-label">Avoir réel</div>
        <div className="avoir-montant">{formaterMontant(avoirReel)}</div>
        {variation !== null && (
          <div className={`avoir-variation ${variation >= 0 ? 'positif' : 'negatif'}`}>
            {variation >= 0 ? '▲' : '▼'}&nbsp;
            {formaterMontant(Math.abs(variation))} vs hier
          </div>
        )}
      </div>

      {/* ── 4 poches monétaires ── */}
      <div className="section-titre">Comptes</div>
      <div className="grille-poches">
        {POCHES.map(p => (
          <div key={p.cle} className={`poche ${p.classe}`}>
            <div className="poche-icone">{p.icone}</div>
            <div className="poche-nom">{p.label}</div>
            <div className="poche-montant">{formaterMontant(soldes[p.cle])}</div>
          </div>
        ))}
      </div>

      {/* ── Créances / dettes ── */}
      <div className="section-titre">Carnet</div>
      <div className="carte" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div className="info-ligne">
          <span className="info-cle">📥 On me doit</span>
          <span className="info-valeur vert">{formaterMontant(totalCreances)}</span>
        </div>
        <div className="info-ligne">
          <span className="info-cle">📤 Je dois</span>
          <span className="info-valeur rouge">− {formaterMontant(totalDettes)}</span>
        </div>
      </div>

      {/* ── CTA ── */}
      <button className="btn btn-vert" onClick={onFaireDescente}>
        ↓ Faire la descente
      </button>

      {/* ── Réinitialisation protégée ── */}
      <div style={{ marginTop: 10 }}>
        {!confirmReinit ? (
          <button
            className="btn btn-danger"
            onClick={() => setConfirmReinit(true)}
            style={{ fontSize: 13 }}
          >
            Réinitialiser les soldes à zéro
          </button>
        ) : (
          <div className="carte" style={{ borderColor: 'rgba(239,68,68,0.35)', marginBottom: 0 }}>
            <p style={{ fontSize: 14, color: 'var(--texte-2)', marginBottom: 12, lineHeight: 1.6 }}>
              ⚠ Cette action remet les 4 poches à zéro.<br />
              Le carnet et l'historique restent intacts.
            </p>
            {errReinit && <div className="msg-erreur">{errReinit}</div>}
            <div className="ligne-boutons">
              <button
                className="btn btn-secondaire"
                onClick={() => setConfirmReinit(false)}
                disabled={enCours}
              >Annuler</button>
              <button
                className="btn btn-danger"
                onClick={handleReinit}
                disabled={enCours}
              >{enCours ? '…' : 'Confirmer'}</button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
