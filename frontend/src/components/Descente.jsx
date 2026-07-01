import React, { useState, useEffect } from 'react'
import { formaterMontant, formaterVariation, dateAujourdhui } from '../utils/format.js'

/* Champ de saisie avec suffixe FCFA intégré */
function InputFCFA({ icone, label, value, onChange }) {
  return (
    <div className="champ-group">
      <label className="champ-label">{icone && <span>{icone}</span>}{label}</label>
      <div className="input-wrapper">
        <input
          className="champ-input"
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={value}
          onChange={e => onChange(e.target.value)}
          min="0"
        />
        <span className="input-suffix">FCFA</span>
      </div>
      {parseInt(value, 10) > 0 && (
        <div style={{
          marginTop: 5, textAlign: 'right',
          fontSize: 11, color: 'var(--texte-3)',
          fontFamily: 'var(--font-mono)'
        }}>
          {formaterMontant(parseInt(value, 10))}
        </div>
      )}
    </div>
  )
}

export default function Descente({
  soldes, totalCreances, totalDettes, dernierAvoir, onConfirmer,
}) {
  const [especes,     setEspeces]     = useState(String(soldes.especes      || ''))
  const [wave,        setWave]        = useState(String(soldes.wave         || ''))
  const [orangeMoney, setOrangeMoney] = useState(String(soldes.orange_money || ''))
  const [freeMoney,   setFreeMoney]   = useState(String(soldes.free_money   || ''))
  const [gainAttendu, setGainAttendu] = useState('')
  const [date,        setDate]        = useState(dateAujourdhui())

  useEffect(() => {
    setEspeces(String(soldes.especes      || ''))
    setWave(String(soldes.wave            || ''))
    setOrangeMoney(String(soldes.orange_money || ''))
    setFreeMoney(String(soldes.free_money  || ''))
  }, [soldes])

  const v = s => parseInt(s, 10) || 0
  const avoirReel = v(especes) + v(wave) + v(orangeMoney) + v(freeMoney) + totalCreances - totalDettes
  const variation = dernierAvoir !== null ? avoirReel - Number(dernierAvoir) : null
  const ecart     = gainAttendu !== '' && variation !== null
                    ? variation - (parseInt(gainAttendu, 10) || 0)
                    : null

  function handleSoumettre() {
    onConfirmer({
      date,
      especes:      v(especes),
      wave:         v(wave),
      orange_money: v(orangeMoney),
      free_money:   v(freeMoney),
      on_me_doit:   totalCreances,
      je_dois:      totalDettes,
      avoir_reel:   avoirReel,
      gain_attendu: gainAttendu !== '' ? parseInt(gainAttendu, 10) || 0 : null,
      ecart,
    })
  }

  return (
    <div className="ecran">

      {/* Date */}
      <div className="champ-group">
        <label className="champ-label">Date de la descente</label>
        <div className="input-wrapper" style={{ borderRadius: 'var(--r-sm)' }}>
          <input
            className="champ-input"
            type="date"
            style={{ fontSize: 15 }}
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Soldes du soir */}
      <div className="section-titre">Soldes du soir</div>
      <InputFCFA icone="💵" label="Espèces"      value={especes}     onChange={setEspeces} />
      <InputFCFA icone="🔵" label="Wave"          value={wave}        onChange={setWave} />
      <InputFCFA icone="🟠" label="Orange Money"  value={orangeMoney} onChange={setOrangeMoney} />
      <InputFCFA icone="🟣" label="Free Money"    value={freeMoney}   onChange={setFreeMoney} />

      {/* Carnet automatique */}
      <div className="section-titre" style={{ marginTop: 6 }}>Carnet (automatique)</div>
      <div className="carte" style={{ padding: '10px 14px', marginBottom: 12 }}>
        <div className="info-ligne">
          <span className="info-cle">📥 On me doit</span>
          <span className="info-valeur vert">{formaterMontant(totalCreances)}</span>
        </div>
        <div className="info-ligne">
          <span className="info-cle">📤 Je dois</span>
          <span className="info-valeur rouge">− {formaterMontant(totalDettes)}</span>
        </div>
      </div>

      {/* Avoir réel calculé */}
      <div className="avoir-principal" style={{ marginBottom: 12 }}>
        <div className="avoir-label">Avoir réel calculé</div>
        <div className="avoir-montant">{formaterMontant(avoirReel)}</div>
        {variation !== null && (
          <div className={`avoir-variation ${variation >= 0 ? 'positif' : 'negatif'}`}>
            {variation >= 0 ? '▲' : '▼'}&nbsp;
            {formaterMontant(Math.abs(variation))} vs hier
          </div>
        )}
      </div>

      {/* Gain attendu */}
      <div className="champ-group" style={{ marginTop: 4 }}>
        <label className="champ-label">Gain attendu <span style={{ color: 'var(--texte-3)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optionnel)</span></label>
        <div className="input-wrapper">
          <input
            className="champ-input"
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={gainAttendu}
            onChange={e => setGainAttendu(e.target.value)}
          />
          <span className="input-suffix">FCFA</span>
        </div>
      </div>

      {/* Écart */}
      {ecart !== null && (
        <div className={`encart-ecart ${ecart === 0 ? 'ecart-ok' : 'ecart-nok'}`}>
          <span className="ecart-label">Écart</span>
          <span className="ecart-valeur">{formaterVariation(ecart)}</span>
          <span className="ecart-message">
            {ecart === 0
              ? '✓ Parfait, aucun écart !'
              : `⚠ Différence de ${formaterMontant(Math.abs(ecart))}`}
          </span>
        </div>
      )}

      <button
        className="btn btn-or"
        style={{ marginTop: 16 }}
        onClick={handleSoumettre}
      >
        Voir le récapitulatif →
      </button>

    </div>
  )
}
