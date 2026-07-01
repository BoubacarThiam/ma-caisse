import React, { useState } from 'react'
import { formaterMontant, formaterVariation, formaterDate } from '../utils/format.js'
import { enregistrerDescente } from '../utils/api.js'
import { mettreEnAttente } from '../utils/offline.js'

function LigneInfo({ label, valeur, classe = '' }) {
  return (
    <div className="info-ligne">
      <span className="info-cle">{label}</span>
      <span className={`info-valeur ${classe}`}>{valeur}</span>
    </div>
  )
}

export default function Confirmation({ descente, dernierAvoir, onValider, onAnnuler }) {
  const [enCours,   setEnCours]   = useState(false)
  const [erreur,    setErreur]    = useState(null)
  const [horsLigne, setHorsLigne] = useState(false)

  const variation = dernierAvoir !== null ? descente.avoir_reel - Number(dernierAvoir) : null

  async function valider() {
    setEnCours(true)
    setErreur(null)
    try {
      await enregistrerDescente(descente)
      await onValider()
    } catch (e) {
      const isReseau = !navigator.onLine
        || e.message.toLowerCase().includes('fetch')
        || e.message.includes('Failed')
        || e.message.includes('network')
      if (isReseau) {
        mettreEnAttente(descente)
        setHorsLigne(true)
        setTimeout(() => onValider(true), 1800)
      } else {
        setErreur(e.message)
      }
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="confirmation-ecran">

      <div className="confirmation-header">
        <button className="btn-retour" onClick={onAnnuler} disabled={enCours}>
          ← Modifier
        </button>
        <h2 className="confirmation-titre">Récapitulatif</h2>
        <div style={{ width: 80 }} />
      </div>

      <div className="confirmation-date">{formaterDate(descente.date)}</div>

      {/* Avoir réel — très gros */}
      <div className="avoir-principal" style={{ marginBottom: 16 }}>
        <div className="avoir-label">Avoir réel</div>
        <div className="avoir-montant grand">{formaterMontant(descente.avoir_reel)}</div>
        {variation !== null && (
          <div className={`avoir-variation ${variation >= 0 ? 'positif' : 'negatif'}`}>
            {variation >= 0 ? '▲' : '▼'}&nbsp;{formaterMontant(Math.abs(variation))} vs hier
          </div>
        )}
      </div>

      {/* Détail des poches */}
      <div className="section-titre">Détail</div>
      <div className="carte">
        <LigneInfo label="💵 Espèces"     valeur={formaterMontant(descente.especes)} />
        <LigneInfo label="🔵 Wave"         valeur={formaterMontant(descente.wave)} />
        <LigneInfo label="🟠 Orange Money" valeur={formaterMontant(descente.orange_money)} />
        <LigneInfo label="🟣 Free Money"   valeur={formaterMontant(descente.free_money)} />
        <LigneInfo label="📥 On me doit"   valeur={formaterMontant(descente.on_me_doit)}  classe="vert" />
        <LigneInfo label="📤 Je dois"      valeur={'− ' + formaterMontant(descente.je_dois)} classe="rouge" />
      </div>

      {/* Analyse gain/écart */}
      {descente.gain_attendu !== null && (
        <>
          <div className="section-titre">Analyse</div>
          <div className="carte">
            {variation !== null && (
              <LigneInfo
                label="Variation du jour"
                valeur={formaterVariation(variation)}
                classe={variation >= 0 ? 'vert' : 'rouge'}
              />
            )}
            <LigneInfo label="Gain attendu" valeur={formaterMontant(descente.gain_attendu)} />
            {descente.ecart !== null && (
              <LigneInfo
                label="Écart"
                valeur={formaterVariation(descente.ecart)}
                classe={Number(descente.ecart) === 0 ? 'vert' : 'rouge'}
              />
            )}
          </div>
        </>
      )}

      {erreur && <div className="msg-erreur">⚠ {erreur}</div>}
      {horsLigne && (
        <div className="msg-hors-ligne">
          📶 Sauvegardé hors-ligne. Synchronisation automatique au retour du réseau.
        </div>
      )}

      <button
        className="btn btn-vert"
        onClick={valider}
        disabled={enCours || horsLigne}
        style={{ marginTop: 8 }}
      >
        {enCours ? 'Enregistrement…' : '✓ Valider la descente'}
      </button>

      <button
        className="btn btn-secondaire"
        onClick={onAnnuler}
        disabled={enCours}
        style={{ marginTop: 10 }}
      >
        ← Retour pour modifier
      </button>

    </div>
  )
}
