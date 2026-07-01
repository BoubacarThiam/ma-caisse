import React, { useState, useEffect, useCallback } from 'react'
import Dashboard    from './components/Dashboard.jsx'
import Carnet       from './components/Carnet.jsx'
import Descente     from './components/Descente.jsx'
import Confirmation from './components/Confirmation.jsx'
import Historique   from './components/Historique.jsx'
import { fetchSoldes, fetchCarnet, fetchDescentes, enregistrerDescente } from './utils/api.js'
import { synchroniser, tailleFile } from './utils/offline.js'

// Icônes pour la barre de navigation
const ONGLETS = [
  { id: 'dashboard',  label: 'Accueil',    icone: '🏠' },
  { id: 'carnet',     label: 'Carnet',     icone: '📋' },
  { id: 'descente',   label: 'Descente',   icone: '💰' },
  { id: 'historique', label: 'Historique', icone: '📊' },
]

export default function App() {
  const [onglet,         setOnglet]         = useState('dashboard')
  const [soldes,         setSoldes]         = useState({ especes: 0, wave: 0, orange_money: 0, free_money: 0 })
  const [carnet,         setCarnet]         = useState([])
  const [descentes,      setDescentes]      = useState([])
  const [chargement,     setChargement]     = useState(true)
  const [erreur,         setErreur]         = useState(null)
  const [confirmation,   setConfirmation]   = useState(null) // descente en attente de validation
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
    } catch (e) {
      setErreur('Impossible de contacter le serveur. Vérifiez votre connexion.')
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

  // Chargement initial
  useEffect(() => {
    chargerDonnees()
  }, [chargerDonnees])

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

  // Écran de confirmation (plein écran, remplace l'onglet courant)
  if (confirmation) {
    return (
      <div className="app">
        <Confirmation
          descente={confirmation}
          dernierAvoir={dernierAvoir}
          onValider={async (horsLigne = false) => {
            setConfirmation(null)
            setOnglet('historique')
            if (!horsLigne) {
              await chargerDonnees()
            } else {
              setFileEnAttente(tailleFile())
            }
          }}
          onAnnuler={() => setConfirmation(null)}
        />
      </div>
    )
  }

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
            {onglet === 'dashboard' && (
              <Dashboard
                soldes={soldes}
                avoirReel={avoirReel}
                totalCreances={totalCreances}
                totalDettes={totalDettes}
                dernierAvoir={dernierAvoir}
                onFaireDescente={() => setOnglet('descente')}
                onReinitialiser={chargerDonnees}
              />
            )}

            {onglet === 'carnet' && (
              <Carnet
                carnet={carnet}
                onUpdate={() => chargerDonnees(true)}
              />
            )}

            {onglet === 'descente' && (
              <Descente
                soldes={soldes}
                totalCreances={totalCreances}
                totalDettes={totalDettes}
                dernierAvoir={dernierAvoir}
                onConfirmer={setConfirmation}
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
