// ============================================================
// Ma Caisse — Couche d'appels API
// Toutes les requêtes passent par Supabase (Postgres + PostgREST).
// ============================================================

import { supabase } from './supabaseClient.js'

function verifier(erreur) {
  if (erreur) throw new Error(erreur.message)
}

// --- Soldes courants ---

export async function fetchSoldes() {
  const { data, error } = await supabase
    .from('soldes_courants')
    .select('especes, wave, orange_money, free_money, updated_at')
    .eq('id', 1)
    .maybeSingle()
  verifier(error)
  return data ?? {
    especes: 0, wave: 0, orange_money: 0, free_money: 0,
    updated_at: new Date().toISOString(),
  }
}

export async function mettreAJourSoldes(soldes) {
  const { error } = await supabase
    .from('soldes_courants')
    .update({
      especes:      Number(soldes.especes)      || 0,
      wave:         Number(soldes.wave)          || 0,
      orange_money: Number(soldes.orange_money)  || 0,
      free_money:   Number(soldes.free_money)    || 0,
    })
    .eq('id', 1)
  verifier(error)
  return { message: 'Soldes mis à jour.' }
}

export const reinitialiserSoldes = () =>
  mettreAJourSoldes({ especes: 0, wave: 0, orange_money: 0, free_money: 0 })

// --- Carnet ---

export async function fetchCarnet() {
  const { data, error } = await supabase
    .from('carnet')
    .select('*')
    .order('type', { ascending: true })
    .order('date_creation', { ascending: false })
  verifier(error)
  return data
}

export async function ajouterEntreeCarnet({ type, nom, montant }) {
  if (!['creance', 'dette'].includes(type)) throw new Error('Type invalide.')
  const nomPropre = (nom ?? '').trim()
  if (nomPropre === '') throw new Error('Le nom est obligatoire.')
  if (!montant || montant <= 0) throw new Error('Le montant doit être positif.')

  const { data, error } = await supabase
    .from('carnet')
    .insert({ type, nom: nomPropre, montant })
    .select('id')
    .single()
  verifier(error)
  return { id: data.id, message: 'Entrée ajoutée.' }
}

export async function modifierEntreeCarnet({ id, nom, montant }) {
  if (!id) throw new Error('ID invalide.')
  const nomPropre = (nom ?? '').trim()
  if (nomPropre === '') throw new Error('Le nom est obligatoire.')
  if (!montant || montant <= 0) throw new Error('Le montant doit être positif.')

  const { data, error } = await supabase
    .from('carnet')
    .update({ nom: nomPropre, montant })
    .eq('id', id)
    .select('id')
  verifier(error)
  if (!data.length) throw new Error('Entrée introuvable.')
  return { message: 'Entrée modifiée.' }
}

export async function supprimerEntreeCarnet(id) {
  if (!id) throw new Error('ID invalide.')
  const { data, error } = await supabase
    .from('carnet')
    .delete()
    .eq('id', id)
    .select('id')
  verifier(error)
  if (!data.length) throw new Error('Entrée introuvable.')
  return { message: 'Entrée supprimée.' }
}

// --- Descentes ---

export async function fetchDescentes() {
  const { data, error } = await supabase
    .from('descentes')
    .select('*')
    .order('date', { ascending: false })
    .order('date_enregistrement', { ascending: false })
  verifier(error)
  return data
}

export async function fetchDescente(id) {
  const { data, error } = await supabase
    .from('descentes')
    .select('*')
    .eq('id', id)
    .single()
  verifier(error)
  return data
}

// Insertion de la descente + mise à jour des soldes courants dans une
// seule transaction côté base (fonction Postgres `enregistrer_descente`),
// pour ne jamais désynchroniser l'historique et les soldes.
export async function enregistrerDescente(descente) {
  const champs = ['date', 'especes', 'wave', 'orange_money', 'free_money',
                  'on_me_doit', 'je_dois', 'avoir_reel']
  for (const c of champs) {
    if (!(c in descente)) throw new Error(`Champ manquant : ${c}`)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(descente.date)) {
    throw new Error("Format de date invalide (attendu : AAAA-MM-JJ).")
  }

  const { data, error } = await supabase.rpc('enregistrer_descente', {
    p_date:         descente.date,
    p_especes:      descente.especes,
    p_wave:         descente.wave,
    p_orange_money: descente.orange_money,
    p_free_money:   descente.free_money,
    p_on_me_doit:   descente.on_me_doit,
    p_je_dois:      descente.je_dois,
    p_avoir_reel:   descente.avoir_reel,
    p_gain_attendu: descente.gain_attendu ?? null,
    p_ecart:        descente.ecart ?? null,
  })
  verifier(error)
  return { id: data.id, message: 'Descente enregistrée.' }
}
