import React, { useState } from 'react'
import { formaterMontant, formaterVariation, formaterDate, formaterHeure } from '../utils/format.js'

function LigneDetail({ label, valeur, classe = '' }) {
  return (
    <div className="info-ligne">
      <span className="info-cle">{label}</span>
      <span className={`info-valeur ${classe}`}>{valeur}</span>
    </div>
  )
}

export default function Historique({ descentes }) {
  const [detailId, setDetailId] = useState(null)

  if (descentes.length === 0) {
    return (
      <div className="ecran">
        <div className="etat-vide">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Aucune descente</p>
          <p style={{ fontSize: 13 }}>Faites votre première descente depuis l'onglet Descente.</p>
        </div>
      </div>
    )
  }

  const detailDescente = descentes.find(d => d.id === detailId)

  return (
    <div className="ecran">

      {/* Panneau de détail */}
      {detailDescente && (
        <div className="dialogue-fond" onClick={() => setDetailId(null)}>
          <div
            className="dialogue-contenu detail-descente"
            onClick={e => e.stopPropagation()}
          >
            <div className="detail-header">
              <h3 className="dialogue-titre" style={{ marginBottom: 0, fontSize: 16 }}>
                {formaterDate(detailDescente.date)}
              </h3>
              <button className="btn-fermer" onClick={() => setDetailId(null)}>✕</button>
            </div>

            <div className="avoir-mini">
              <span>Avoir réel</span>
              <strong>{formaterMontant(detailDescente.avoir_reel)}</strong>
            </div>

            <LigneDetail label="💵 Espèces"     valeur={formaterMontant(detailDescente.especes)} />
            <LigneDetail label="🔵 Wave"         valeur={formaterMontant(detailDescente.wave)} />
            <LigneDetail label="🟠 Orange Money" valeur={formaterMontant(detailDescente.orange_money)} />
            <LigneDetail label="🟣 Free Money"   valeur={formaterMontant(detailDescente.free_money)} />
            <LigneDetail label="📥 On me doit"   valeur={formaterMontant(detailDescente.on_me_doit)}  classe="vert" />
            <LigneDetail label="📤 Je dois"      valeur={'− ' + formaterMontant(detailDescente.je_dois)} classe="rouge" />

            {detailDescente.gain_attendu !== null && (
              <LigneDetail label="Gain attendu" valeur={formaterMontant(detailDescente.gain_attendu)} />
            )}
            {detailDescente.ecart !== null && (
              <LigneDetail
                label="Écart"
                valeur={formaterVariation(detailDescente.ecart)}
                classe={Number(detailDescente.ecart) === 0 ? 'vert' : 'rouge'}
              />
            )}

            <p className="detail-heure">
              Enregistré à {formaterHeure(detailDescente.date_enregistrement)}
            </p>
          </div>
        </div>
      )}

      {/* En-tête compteur */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12
      }}>
        <span className="section-titre" style={{ margin: 0 }}>
          {descentes.length} descente{descentes.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Liste */}
      {descentes.map((d, i) => {
        const precedent = descentes[i + 1]
        const variation = precedent ? Number(d.avoir_reel) - Number(precedent.avoir_reel) : null

        return (
          <div
            key={d.id}
            className="descente-item"
            onClick={() => setDetailId(d.id)}
          >
            <div className="descente-item-haut">
              <span className="descente-date">{formaterDate(d.date)}</span>
              <span className="descente-avoir">{formaterMontant(d.avoir_reel)}</span>
            </div>

            {variation !== null && (
              <div className={`descente-variation ${variation >= 0 ? 'positif' : 'negatif'}`}>
                {variation >= 0 ? '▲' : '▼'} {formaterMontant(Math.abs(variation))}
              </div>
            )}

            {Number(d.ecart) !== 0 && d.ecart !== null && (
              <div className="descente-ecart">
                Écart : <span className="rouge">{formaterVariation(d.ecart)}</span>
              </div>
            )}
          </div>
        )
      })}

    </div>
  )
}
