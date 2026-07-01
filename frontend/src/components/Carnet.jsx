import React, { useState, useRef, useEffect } from 'react'
import {
  ajouterEntreeCarnet,
  modifierEntreeCarnet,
  supprimerEntreeCarnet,
} from '../utils/api.js'
import { formaterMontant, formaterDateCourte } from '../utils/format.js'

const VIDE = { type: 'creance', nom: '', montant: '' }

export default function Carnet({ carnet, onUpdate }) {
  const [formulaire,    setFormulaire]    = useState(null)
  const [enCours,       setEnCours]       = useState(false)
  const [erreur,        setErreur]        = useState(null)
  const [suppressionId, setSuppressionId] = useState(null)
  const nomRef = useRef(null)

  const creances     = carnet.filter(e => e.type === 'creance')
  const dettes       = carnet.filter(e => e.type === 'dette')
  const totalCreances = creances.reduce((s, e) => s + Number(e.montant), 0)
  const totalDettes   = dettes.reduce((s, e)   => s + Number(e.montant), 0)

  // Focus auto sur le champ nom quand le formulaire s'ouvre
  useEffect(() => {
    if (formulaire) setTimeout(() => nomRef.current?.focus(), 80)
  }, [formulaire?.id, formulaire?.type])

  function ouvrirAjout(type) {
    setFormulaire({ ...VIDE, type })
    setErreur(null)
  }

  function ouvrirModif(entree) {
    setFormulaire({ ...entree, montant: String(entree.montant) })
    setErreur(null)
  }

  function fermer() {
    setFormulaire(null)
    setErreur(null)
  }

  function changerType(type) {
    setFormulaire(f => ({ ...f, type }))
    setErreur(null)
  }

  async function sauvegarder() {
    const montant = parseInt(formulaire.montant, 10)
    if (!formulaire.nom.trim())      { setErreur('Le nom de la personne est obligatoire.'); return }
    if (!montant || montant <= 0)    { setErreur('Entrez un montant valide (nombre positif).'); return }
    if (montant > 100_000_000)       { setErreur('Montant trop élevé.'); return }

    setEnCours(true)
    setErreur(null)
    try {
      if (formulaire.id) {
        await modifierEntreeCarnet({ id: formulaire.id, nom: formulaire.nom.trim(), montant })
      } else {
        await ajouterEntreeCarnet({ type: formulaire.type, nom: formulaire.nom.trim(), montant })
      }
      fermer()
      await onUpdate()
    } catch (e) {
      setErreur(e.message)
    } finally {
      setEnCours(false)
    }
  }

  async function supprimer(id) {
    setEnCours(true)
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

  return (
    <div className="ecran">

      {/* ── Section créances ── */}
      <SectionCarnet
        titre="📥 On me doit"
        couleur="vert"
        entrees={creances}
        total={totalCreances}
        onAjouter={() => ouvrirAjout('creance')}
        onModifier={ouvrirModif}
        suppressionId={suppressionId}
        onDemanderSuppression={setSuppressionId}
        onConfirmerSuppression={supprimer}
        enCours={enCours}
      />

      {/* ── Section dettes ── */}
      <SectionCarnet
        titre="📤 Je dois (confié)"
        couleur="rouge"
        entrees={dettes}
        total={totalDettes}
        onAjouter={() => ouvrirAjout('dette')}
        onModifier={ouvrirModif}
        suppressionId={suppressionId}
        onDemanderSuppression={setSuppressionId}
        onConfirmerSuppression={supprimer}
        enCours={enCours}
      />

      {/* ── Formulaire bottom sheet ── */}
      {formulaire && (
        <div className="dialogue-fond" onClick={fermer}>
          <div className="dialogue-contenu" onClick={e => e.stopPropagation()}>

            <h3 className="dialogue-titre">
              {formulaire.id ? 'Modifier une entrée' : 'Ajouter une entrée'}
            </h3>

            {/* Sélecteur de type — masqué en mode modification */}
            {!formulaire.id && (
              <div className="type-selector">
                <button
                  type="button"
                  className={`type-btn ${formulaire.type === 'creance' ? 'actif-creance' : ''}`}
                  onClick={() => changerType('creance')}
                >
                  📥 On me doit
                </button>
                <button
                  type="button"
                  className={`type-btn ${formulaire.type === 'dette' ? 'actif-dette' : ''}`}
                  onClick={() => changerType('dette')}
                >
                  📤 Je dois
                </button>
              </div>
            )}

            {/* Nom */}
            <div className="champ-group">
              <label className="champ-label">Nom de la personne</label>
              <input
                ref={nomRef}
                className="champ-input-texte"
                type="text"
                placeholder="Ex : Fatou Diallo"
                value={formulaire.nom}
                onChange={e => setFormulaire(f => ({ ...f, nom: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && sauvegarder()}
                maxLength={100}
                autoComplete="off"
              />
            </div>

            {/* Montant avec suffixe FCFA */}
            <div className="champ-group">
              <label className="champ-label">Montant emprunté</label>
              <div className="input-wrapper">
                <input
                  className="champ-input"
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  value={formulaire.montant}
                  onChange={e => setFormulaire(f => ({ ...f, montant: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && sauvegarder()}
                  min="1"
                  max="100000000"
                />
                <span className="input-suffix">FCFA</span>
              </div>
              {/* Aperçu formaté si montant saisi */}
              {parseInt(formulaire.montant, 10) > 0 && (
                <div style={{
                  marginTop: 6, textAlign: 'right',
                  fontSize: 12, color: 'var(--texte-3)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  = {formaterMontant(parseInt(formulaire.montant, 10))}
                </div>
              )}
            </div>

            {erreur && <div className="msg-erreur">{erreur}</div>}

            <div className="ligne-boutons" style={{ marginTop: 4 }}>
              <button className="btn btn-secondaire" onClick={fermer} disabled={enCours}>
                Annuler
              </button>
              <button
                className={`btn ${formulaire.type === 'dette' ? 'btn-or' : 'btn-vert'}`}
                onClick={sauvegarder}
                disabled={enCours || !formulaire.nom.trim() || !formulaire.montant}
              >
                {enCours ? '…' : formulaire.id ? 'Modifier' : 'Ajouter'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

/* ── Sous-composant section ── */
function SectionCarnet({
  titre, couleur, entrees, total,
  onAjouter, onModifier,
  suppressionId, onDemanderSuppression, onConfirmerSuppression,
  enCours,
}) {
  return (
    <div className="carte" style={{ marginBottom: 14 }}>
      <div className="section-en-tete">
        <span className="section-titre" style={{ margin: 0, flex: 'none' }}>{titre}</span>
        <button
          className="btn-ghost"
          onClick={onAjouter}
          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>＋</span> Ajouter
        </button>
      </div>

      {entrees.length === 0 ? (
        <p className="texte-vide">Aucune entrée — appuyez sur Ajouter.</p>
      ) : (
        <div className="tableau-conteneur" style={{ marginBottom: 0 }}>
          <table className="tableau">
            <thead>
              <tr>
                <th>Nom</th>
                <th className="al-droite">Montant</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entrees.map(e => (
                <tr key={e.id}>
                  <td>
                    {e.nom}
                    <span className="sous-info">
                      {formaterDateCourte(e.date_creation?.split(' ')[0])}
                    </span>
                  </td>

                  <td className={`montant ${couleur}`}>
                    {formaterMontant(e.montant)}
                  </td>

                  <td className="actions">
                    {suppressionId === e.id ? (
                      <div className="confirm-suppr">
                        <span>Suppr ?</span>
                        <button
                          className="btn-lien rouge"
                          onClick={() => onConfirmerSuppression(e.id)}
                          disabled={enCours}
                        >Oui</button>
                        <button
                          className="btn-lien"
                          onClick={() => onDemanderSuppression(null)}
                        >Non</button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="btn-icone"
                          onClick={() => onModifier(e)}
                          title="Modifier"
                        >✏️</button>
                        <button
                          className="btn-icone"
                          onClick={() => onDemanderSuppression(e.id)}
                          title="Supprimer"
                        >🗑️</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="total-section">
        <span>TOTAL</span>
        <span className={`total-montant ${couleur}`}>{formaterMontant(total)}</span>
      </div>
    </div>
  )
}
