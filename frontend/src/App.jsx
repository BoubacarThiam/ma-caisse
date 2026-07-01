import React, { useState, useEffect, useCallback } from 'react'
import Caisse     from './components/Caisse.jsx'
import Historique from './components/Historique.jsx'
import { fetchSoldes, fetchCarnet, fetchDescentes, enregistrerDescente } from './utils/api.js'
import { synchroniser, tailleFile, mettreEnAttente } from './utils/offline.js'
import { dateAujourdhui } from './utils/format.js'

// Icônes pour la barre de navigation
const ONGLETS = [
  { id: 'caisse',     label: 'Caisse',     icone: '🏠' },
  { id: 'historique', label: 'Historique', icone: '📊' },
]

export default function App() {
  const [onglet,         setOnglet]         = useState('caisse')
  const [soldes,         setSoldes]         = useState({ especes: 0, wave: 0, orange_money: 0, free_money: 0 })
  const [carnet,         setCarnet]         = useState([])
  const [descentes,      setDescentes]      = useState([])
  const [chargement,     setChargement]     = useState(true)
  const [erreur,         setErreur]         = useState(null)
  const [fileEnAttente,  setFileEnAttente]  = useState(tailleFile())
  const [syncMessage,    setSyncMessage]    = useState(null)

  // Chargement de toutes les données depuis l'API
  const chargerDonnees = useCallback(async (silencieux = false) => {
    if (!silencieux) setChargement(true)
    setErreur(null)
    try {
      const [s, c, d] = await Promise.all([fetchSoldes(), fetchCarnet(), fetchDescentes()])
      setSoldes(s)
      setCarnet(c)
      setDescentes(d)
      return { s, c, d }
    } catch (e) {
      setErreur('Impossible de contacter le serveur. Vérifiez votre connexion.')
      return null
    } finally {
      if (!silencieux) setChargement(false)
    }
  }, [])

  // Synchronisation de la file d'attente hors-ligne
  const syncFileAttente = useCallback(async () => {
    const n = tailleFile()
    if (n === 0) return
    try {
      const synces = await synchroniser(enregistrerDescente)
      if (synces > 0) {
        setSyncMessage(`✓ ${synces} descente${synces > 1 ? 's' : ''} synchronisée${synces > 1 ? 's' : ''} !`)
        setTimeout(() => setSyncMessage(null), 4000)
        setFileEnAttente(tailleFile())
        await chargerDonnees(true)
      }
    } catch {
      // Silencieux : on réessaiera au prochain focus
    }
  }, [chargerDonnees])

  // Chargement initial, puis clôture automatique de la veille si nécessaire
  useEffect(() => {
    (async () => {
      const donnees = await chargerDonnees()
      if (donnees) await cloturerVeilleSiNecessaire(donnees)
    })()
  }, [chargerDonnees])

  // Si les soldes n'ont pas été touchés aujourd'hui, on archive leur état
  // (= celui de la veille) dans l'historique avant de continuer à travailler
  // sur la journée en cours. Ainsi, chaque jour devient une nouvelle ligne
  // d'historique, sans action manuelle de la part de l'utilisatrice.
  async function cloturerVeilleSiNecessaire({ s, c, d }) {
    if (!s.updated_at) return
    const dateVeille   = s.updated_at.slice(0, 10)
    const aujourdhui   = dateAujourdhui()
    if (dateVeille >= aujourdhui) return
    if (d.some(descente => descente.date === dateVeille)) return

    const totalCreances = c.filter(e => e.type === 'creance').reduce((sum, e) => sum + Number(e.montant), 0)
    const totalDettes   = c.filter(e => e.type === 'dette').reduce((sum, e)   => sum + Number(e.montant), 0)
    const avoirReel     = Number(s.especes) + Number(s.wave) + Number(s.orange_money) + Number(s.free_money)
                          + totalCreances - totalDettes

    const snapshot = {
      date: dateVeille,
      especes: Number(s.especes), wave: Number(s.wave),
      orange_money: Number(s.orange_money), free_money: Number(s.free_money),
      on_me_doit: totalCreances, je_dois: totalDettes,
      avoir_reel: avoirReel,
    }

    try {
      await enregistrerDescente(snapshot)
      await chargerDonnees(true)
    } catch {
      mettreEnAttente(snapshot)
      setFileEnAttente(tailleFile())
    }
  }

  // Tenter la synchronisation quand la connexion revient
  useEffect(() => {
    const handleOnline = () => syncFileAttente()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [syncFileAttente])

  // Tenter la synchronisation au retour de focus
  useEffect(() => {
    const handleFocus = () => syncFileAttente()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [syncFileAttente])

  // Valeurs calculées partagées entre composants
  const totalCreances = carnet.filter(e => e.type === 'creance').reduce((s, e) => s + Number(e.montant), 0)
  const totalDettes   = carnet.filter(e => e.type === 'dette').reduce((s, e)   => s + Number(e.montant), 0)
  const avoirReel     = Number(soldes.especes) + Number(soldes.wave) +
                        Number(soldes.orange_money) + Number(soldes.free_money) +
                        totalCreances - totalDettes
  const dernierAvoir  = descentes.length > 0 ? descentes[0].avoir_reel : null

  return (
    <div className="app">

      {/* En-tête */}
      <header className="app-header">
        <div className="app-header-titres">
          <h1 className="app-titre">Ma Caisse</h1>
          <span className="app-sous-titre">Aminata Thiam</span>
        </div>
        {fileEnAttente > 0 && (
          <span className="badge-offline" title={`${fileEnAttente} descente(s) en attente de synchronisation`}>
            📶 {fileEnAttente}
          </span>
        )}
      </header>

      {/* Bannière d'erreur réseau */}
      {erreur && (
        <div className="erreur-banniere">
          <span>⚠ {erreur}</span>
          <button onClick={() => chargerDonnees()}>Réessayer</button>
        </div>
      )}

      {/* Message de synchronisation réussie */}
      {syncMessage && (
        <div className="sync-message">{syncMessage}</div>
      )}

      {/* File d'attente hors-ligne */}
      {fileEnAttente > 0 && (
        <div className="offline-banniere">
          📴 {fileEnAttente} descente{fileEnAttente > 1 ? 's' : ''} en attente — synchronisation au retour du réseau
        </div>
      )}

      {/* Contenu principal */}
      <main className="app-main">
        {chargement ? (
          <div className="chargement">
            <div className="spinner"></div>
            <span>Chargement…</span>
          </div>
        ) : (
          <>
            {onglet === 'caisse' && (
              <Caisse
                soldes={soldes}
                carnet={carnet}
                avoirReel={avoirReel}
                dernierAvoir={dernierAvoir}
                onUpdate={() => chargerDonnees(true)}
              />
            )}

            {onglet === 'historique' && (
              <Historique descentes={descentes} />
            )}
          </>
        )}
      </main>

      {/* Barre de navigation en bas */}
      <nav className="tab-bar">
        {ONGLETS.map(o => (
          <button
            key={o.id}
            className={`tab-btn ${onglet === o.id ? 'active' : ''}`}
            onClick={() => setOnglet(o.id)}
          >
            <span className="tab-icone">{o.icone}</span>
            <span className="tab-label">{o.label}</span>
          </button>
        ))}
      </nav>

    </div>
  )
}
