// Formate un montant en FCFA avec espace comme séparateur de milliers
// Exemple : 85000 → "85 000 FCFA"
export function formaterMontant(valeur) {
  const n = Number(valeur) || 0
  return n.toLocaleString('fr-FR') + ' FCFA'
}

// Formate une variation avec signe + ou -
// Exemple : 5000 → "+5 000 FCFA" / -2000 → "-2 000 FCFA"
export function formaterVariation(valeur) {
  const n = Number(valeur) || 0
  const signe = n >= 0 ? '+' : ''
  return signe + n.toLocaleString('fr-FR') + ' FCFA'
}

// Formate une date ISO (AAAA-MM-JJ) en français long
// Exemple : "2024-01-15" → "lundi 15 janvier 2024"
export function formaterDate(dateStr) {
  if (!dateStr) return '—'
  // On ajoute T12:00:00 pour éviter le décalage UTC qui change le jour
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

// Format court : "15/01/2024"
export function formaterDateCourte(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('fr-FR')
}

// Retourne la date d'aujourd'hui au format AAAA-MM-JJ (pour les champs <input type="date">)
export function dateAujourdhui() {
  return new Date().toISOString().split('T')[0]
}

// Formate l'heure d'un datetime MySQL "2024-01-15 18:30:00" → "18h30"
export function formaterHeure(datetimeStr) {
  if (!datetimeStr) return ''
  const d = new Date(datetimeStr.replace(' ', 'T'))
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')
}
