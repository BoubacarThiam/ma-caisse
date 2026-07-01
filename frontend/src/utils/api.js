// ============================================================
// Ma Caisse — Couche d'appels API
// Toutes les requêtes passent par cette fonction centrale
// pour une gestion uniforme des erreurs.
// ============================================================

// En développement Vite proxifie /backend vers XAMPP.
// En production, l'API est dans le même domaine que le frontend.
const BASE = import.meta.env.VITE_API_URL || '/backend/api'

async function appeler(chemin, options = {}) {
  const reponse = await fetch(`${BASE}${chemin}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!reponse.ok) {
    let message = `Erreur serveur (${reponse.status})`
    try {
      const corps = await reponse.json()
      if (corps.erreur) message = corps.erreur
    } catch {
      // Le corps n'est pas du JSON valide, on garde le message générique
    }
    throw new Error(message)
  }

  return reponse.json()
}

// --- Soldes courants ---

export const fetchSoldes = () =>
  appeler('/soldes.php')

export const mettreAJourSoldes = (soldes) =>
  appeler('/soldes.php', { method: 'PUT', body: JSON.stringify(soldes) })

export const reinitialiserSoldes = () =>
  mettreAJourSoldes({ especes: 0, wave: 0, orange_money: 0, free_money: 0 })

// --- Carnet ---

export const fetchCarnet = () =>
  appeler('/carnet.php')

export const ajouterEntreeCarnet = (entree) =>
  appeler('/carnet.php', { method: 'POST', body: JSON.stringify(entree) })

export const modifierEntreeCarnet = (entree) =>
  appeler('/carnet.php', { method: 'PUT', body: JSON.stringify(entree) })

export const supprimerEntreeCarnet = (id) =>
  appeler(`/carnet.php?id=${id}`, { method: 'DELETE' })

// --- Descentes ---

export const fetchDescentes = () =>
  appeler('/descentes.php')

export const fetchDescente = (id) =>
  appeler(`/descentes.php?id=${id}`)

export const enregistrerDescente = (descente) =>
  appeler('/descentes.php', { method: 'POST', body: JSON.stringify(descente) })
