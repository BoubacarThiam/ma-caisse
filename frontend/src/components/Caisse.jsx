import React, { useState, useRef, useEffect } from 'react'
import { formaterMontant } from '../utils/format.js'
import {
  mettreAJourSoldes, reinitialiserSoldes,
  ajouterEntreeCarnet, modifierEntreeCarnet, supprimerEntreeCarnet,
} from '../utils/api.js'

const POCHES = [
  { cle: 'especes',      label: 'Espèces',      icone: '💵' },
  { cle: 'wave',         label: 'Wave',         icone: '🔵' },
  { cle: 'orange_money', label: 'Orange Money', icone: '🟠' },
  { cle: 'free_money',   label: 'Free Money',   icone: '🟣' },
]

const VIDE_CARNET = { type: 'creance', nom: '', montant: '' }

const montantSansSuffixe = v => formaterMontant(v).replace(' FCFA', '')

export default function Caisse({
  soldes, carnet, avoirReel, dernierAvoir, onUpdate,
}) {
  const [editCompte,    setEditCompte]    = useState(null) // { cle, label, montant }
  const [erreurCompte,  setErreurCompte]  = useState(null)

  const [formCarnet,    setFormCarnet]    = useState(null) // { id?, type, nom, montant }
  const [erreurCarnet,  setErreurCarnet]  = useState(null)
  const nomRef = useRef(null)

  const [suppressionId, setSuppressionId] = useState(null)
  const [confirmReinit, setConfirmReinit] = useState(false)
  const [erreur,        setErreur]        = useState(null)
  const [enCours,       setEnCours]       = useState(false)

  const variation = dernierAvoir !== null ? avoirReel - Number(dernierAvoir) : null

  useEffect(() => {
    if (formCarnet) setTimeout(() => nomRef.current?.focus(), 80)
  }, [formCarnet?.id, formCarnet?.type])

  // --- Construction des lignes du tableau, avec solde cumulé ---
  const lignesComptes = []
  let solde = 0
  for (const p of POCHES) {
    solde += Number(soldes[p.cle]) || 0
    lignesComptes.push({
      cle: 'compte-' + p.cle,
      libelle: p.label, icone: p.icone,
      montant: Number(soldes[p.cle]) || 0, solde,
    })
  }
  const lignesCarnet = []
  for (const e of carnet.filter(e => e.type === 'creance')) {
    solde += Number(e.montant)
    lignesCarnet.push({ cle: 'c' + e.id, type: 'creance', suffixe: 'empr.', montant: Number(e.montant), solde, entree: e })
  }
  for (const e of carnet.filter(e => e.type === 'dette')) {
    solde -= Number(e.montant)
    lignesCarnet.push({ cle: 'd' + e.id, type: 'dette', suffixe: 'conf.', montant: Number(e.montant), solde, entree: e })
  }

  // --- Édition d'un compte ---
  async function sauvegarderCompte() {
    const montant = parseInt(editCompte.montant, 10)
    if (isNaN(montant) || montant < 0) { setErreurCompte('Entrez un montant valide.'); return }
    setEnCours(true)
    setErreurCompte(null)
    try {
      await mettreAJourSoldes({ ...soldes, [editCompte.cle]: montant })
      setEditCompte(null)
      await onUpdate()
    } catch (e) {
      setErreurCompte(e.message)
    } finally {
      setEnCours(false)
    }
  }

  // --- Ajout / modification carnet ---
  function ouvrirAjoutCarnet(type) {
    setFormCarnet({ ...VIDE_CARNET, type })
    setErreurCarnet(null)
  }
  function ouvrirModifCarnet(entree) {
    setFormCarnet({ ...entree, montant: String(entree.montant) })
    setErreurCarnet(null)
  }
  async function sauvegarderCarnet() {
    const montant = parseInt(formCarnet.montant, 10)
    if (!formCarnet.nom.trim())   { setErreurCarnet('Le nom de la personne est obligatoire.'); return }
    if (!montant || montant <= 0) { setErreurCarnet('Entrez un montant valide (nombre positif).'); return }
    if (montant > 100_000_000)    { setErreurCarnet('Montant trop élevé.'); return }
    setEnCours(true)
    setErreurCarnet(null)
    try {
      if (formCarnet.id) {
        await modifierEntreeCarnet({ id: formCarnet.id, nom: formCarnet.nom.trim(), montant })
      } else {
        await ajouterEntreeCarnet({ type: formCarnet.type, nom: formCarnet.nom.trim(), montant })
      }
      setFormCarnet(null)
      await onUpdate()
    } catch (e) {
      setErreurCarnet(e.message)
    } finally {
      setEnCours(false)
    }
  }

  // --- Règlement (remboursement / restitution) d'une entrée ---
  async function reglerEntree(id) {
    setEnCours(true)
    setErreur(null)
    try {
      await supprimerEntreeCarnet(id)
      setSuppressionId(null)
      await onUpdate()
    } catch (e) {
      setErreur(e.message)
    } finally {
      setEnCours(false)
    }
  }

  // --- Réinitialisation des comptes ---
  async function handleReinit() {
    setEnCours(true)
    setErreur(null)
    try {
      await reinitialiserSoldes()
      setConfirmReinit(false)
      await onUpdate()
    } catch (e) {
      setErreur(e.message)
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="ecran">

      {/* Message d'accueil */}
      <div className="accueil-perso">Bonjour Aminata 👋</div>

      {/* Avoir réel */}
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

      {/* Tableau combiné : comptes + carnet, avec solde cumulé */}
      <div className="tableau-conteneur">
        <table className="tableau tableau-ledger">
          <thead>
            <tr>
              <th>Libellé</th>
              <th className="al-droite">Montant</th>
              <th className="al-droite">Solde</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr className="sous-entete">
              <td colSpan={4}>Comptes</td>
            </tr>
            {lignesComptes.map(l => (
              <tr key={l.cle}>
                <td>{l.icone} {l.libelle}</td>
                <td className="montant">{formaterMontant(l.montant)}</td>
                <td className="montant solde">{montantSansSuffixe(l.solde)}</td>
                <td className="actions">
                  <button
                    className="btn-icone"
                    onClick={() => setEditCompte({
                      cle: l.cle.replace('compte-', ''),
                      label: l.libelle,
                      montant: String(l.montant),
                    })}
                    title="Modifier"
                  >✏️</button>
                </td>
              </tr>
            ))}

            <tr className="sous-entete">
              <td colSpan={4}>
                <div className="sous-entete-carnet">
                  <span>Carnet</span>
                  <div className="sous-entete-actions">
                    <button className="btn-ghost btn-ghost-sm" onClick={() => ouvrirAjoutCarnet('creance')}>+ Emprunt</button>
                    <button className="btn-ghost btn-ghost-sm" onClick={() => ouvrirAjoutCarnet('dette')}>+ Confié</button>
                  </div>
                </div>
              </td>
            </tr>

            {lignesCarnet.length === 0 ? (
              <tr><td colSpan={4} className="texte-vide">Aucune entrée dans le carnet.</td></tr>
            ) : (
              lignesCarnet.map(l => (
                <tr key={l.cle}>
                  <td>
                    {l.entree.nom}
                    <span className="sous-info">{l.suffixe}</span>
                  </td>
                  <td className={`montant ${l.type === 'creance' ? 'vert' : 'rouge'}`}>
                    {l.type === 'dette' ? '− ' : ''}{formaterMontant(l.montant)}
                  </td>
                  <td className="montant solde">{montantSansSuffixe(l.solde)}</td>
                  <td className="actions">
                    {suppressionId === l.entree.id ? (
                      <div className="confirm-suppr">
                        <span>Réglé ?</span>
                        <button className="btn-lien vert" onClick={() => reglerEntree(l.entree.id)} disabled={enCours}>Oui</button>
                        <button className="btn-lien" onClick={() => setSuppressionId(null)} disabled={enCours}>Non</button>
                      </div>
                    ) : (
                      <>
                        <button className="btn-icone" onClick={() => ouvrirModifCarnet(l.entree)} title="Modifier">✏️</button>
                        <button
                          className="btn-regle"
                          onClick={() => setSuppressionId(l.entree.id)}
                          title={l.type === 'creance' ? 'A remboursé son emprunt' : "Somme confiée rendue"}
                        >
                          Réglé
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}

            <tr className="ligne-total">
              <td>Total</td>
              <td className="montant" colSpan={2}>{montantSansSuffixe(avoirReel)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {erreur && <div className="msg-erreur">{erreur}</div>}

      {/* Réinitialisation protégée */}
      <div style={{ marginTop: 10 }}>
        {!confirmReinit ? (
          <button className="btn btn-danger" onClick={() => setConfirmReinit(true)} style={{ fontSize: 13 }}>
            Réinitialiser les comptes à zéro
          </button>
        ) : (
          <div className="carte" style={{ borderColor: 'rgba(239,68,68,0.35)', marginBottom: 0 }}>
            <p style={{ fontSize: 14, color: 'var(--texte-2)', marginBottom: 12, lineHeight: 1.6 }}>
              ⚠ Cette action remet les 4 comptes à zéro.<br />
              Le carnet et l'historique restent intacts.
            </p>
            <div className="ligne-boutons">
              <button className="btn btn-secondaire" onClick={() => setConfirmReinit(false)} disabled={enCours}>Annuler</button>
              <button className="btn btn-danger" onClick={handleReinit} disabled={enCours}>{enCours ? '…' : 'Confirmer'}</button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogue : modifier un compte */}
      {editCompte && (
        <div className="dialogue-fond" onClick={() => setEditCompte(null)}>
          <div className="dialogue-contenu" onClick={e => e.stopPropagation()}>
            <h3 className="dialogue-titre">{editCompte.label}</h3>
            <div className="champ-group">
              <label className="champ-label">Nouveau montant</label>
              <div className="input-wrapper">
                <input
                  className="champ-input"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={editCompte.montant}
                  onChange={e => setEditCompte(f => ({ ...f, montant: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && sauvegarderCompte()}
                  min="0"
                  autoFocus
                />
                <span className="input-suffix">FCFA</span>
              </div>
            </div>
            {erreurCompte && <div className="msg-erreur">{erreurCompte}</div>}
            <div className="ligne-boutons" style={{ marginTop: 4 }}>
              <button className="btn btn-secondaire" onClick={() => setEditCompte(null)} disabled={enCours}>Annuler</button>
              <button className="btn btn-vert" onClick={sauvegarderCompte} disabled={enCours}>{enCours ? '…' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogue : ajouter / modifier une entrée du carnet */}
      {formCarnet && (
        <div className="dialogue-fond" onClick={() => setFormCarnet(null)}>
          <div className="dialogue-contenu" onClick={e => e.stopPropagation()}>
            <h3 className="dialogue-titre">
              {formCarnet.id ? 'Modifier une entrée' : 'Ajouter une entrée'}
            </h3>

            {!formCarnet.id && (
              <div className="type-selector">
                <button
                  type="button"
                  className={`type-btn ${formCarnet.type === 'creance' ? 'actif-creance' : ''}`}
                  onClick={() => setFormCarnet(f => ({ ...f, type: 'creance' }))}
                >
                  📥 Emprunt (on me doit)
                </button>
                <button
                  type="button"
                  className={`type-btn ${formCarnet.type === 'dette' ? 'actif-dette' : ''}`}
                  onClick={() => setFormCarnet(f => ({ ...f, type: 'dette' }))}
                >
                  📤 Confié (je dois)
                </button>
              </div>
            )}

            <div className="champ-group">
              <label className="champ-label">Nom de la personne</label>
              <input
                ref={nomRef}
                className="champ-input-texte"
                type="text"
                placeholder="Ex : Fatou Diallo"
                value={formCarnet.nom}
                onChange={e => setFormCarnet(f => ({ ...f, nom: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && sauvegarderCarnet()}
                maxLength={100}
                autoComplete="off"
              />
            </div>

            <div className="champ-group">
              <label className="champ-label">Montant</label>
              <div className="input-wrapper">
                <input
                  className="champ-input"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={formCarnet.montant}
                  onChange={e => setFormCarnet(f => ({ ...f, montant: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && sauvegarderCarnet()}
                  min="1"
                  max="100000000"
                />
                <span className="input-suffix">FCFA</span>
              </div>
            </div>

            {erreurCarnet && <div className="msg-erreur">{erreurCarnet}</div>}

            <div className="ligne-boutons" style={{ marginTop: 4 }}>
              <button className="btn btn-secondaire" onClick={() => setFormCarnet(null)} disabled={enCours}>Annuler</button>
              <button
                className={`btn ${formCarnet.type === 'dette' ? 'btn-or' : 'btn-vert'}`}
                onClick={sauvegarderCarnet}
                disabled={enCours || !formCarnet.nom.trim() || !formCarnet.montant}
              >
                {enCours ? '…' : formCarnet.id ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
