// ============================================================
// Gestion de la file d'attente hors-ligne
// Si le réseau est coupé lors d'une descente, on stocke
// temporairement dans localStorage et on synchronise dès le retour.
// ============================================================

const CLE_FILE = 'ma_caisse_file_attente'

// Ajoute une descente en attente
export function mettreEnAttente(descente) {
  const file = lireFile()
  file.push({ ...descente, _horodatage: Date.now() })
  localStorage.setItem(CLE_FILE, JSON.stringify(file))
}

// Retourne toutes les descentes en attente
export function lireFile() {
  try {
    return JSON.parse(localStorage.getItem(CLE_FILE) || '[]')
  } catch {
    return []
  }
}

// Vide la file (après synchronisation réussie)
export function videFile() {
  localStorage.removeItem(CLE_FILE)
}

// Nombre d'éléments en attente
export function tailleFile() {
  return lireFile().length
}

// Tente d'envoyer au serveur toutes les descentes en attente.
// Retourne le nombre de descentes synchronisées avec succès.
export async function synchroniser(fnEnregistrerDescente) {
  const file = lireFile()
  if (file.length === 0) return 0

  let succes = 0
  const restante = []

  for (const item of file) {
    try {
      const { _horodatage, ...descente } = item
      await fnEnregistrerDescente(descente)
      succes++
    } catch {
      restante.push(item)
    }
  }

  localStorage.setItem(CLE_FILE, JSON.stringify(restante))
  return succes
}
