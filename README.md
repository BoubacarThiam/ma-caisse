# Ma Caisse

Application web mobile-first pour agentes de transfert d'argent (Wave, Orange Money, Free Money) au Sénégal.  
Calcule l'avoir réel en fin de journée et conserve l'historique complet dans Supabase (PostgreSQL).

---

## Structure du projet

```
ma-caisse/
├── supabase/
│   └── schema.sql       ← Schéma SQL à exécuter dans l'éditeur SQL de Supabase
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── .env.example      ← Modèle des variables d'environnement Supabase
    └── src/
        ├── App.jsx
        ├── index.css
        ├── components/
        │   ├── Caisse.jsx      ← Tableau combiné (comptes + carnet)
        │   └── Historique.jsx  ← Journal des jours passés
        └── utils/
            ├── supabaseClient.js ← Client Supabase
            ├── api.js            ← Appels vers Supabase
            ├── format.js         ← Formatage FCFA, dates
            └── offline.js        ← File d'attente hors-ligne
```

---

## Lancement en local

### 1. Prérequis
- [Node.js](https://nodejs.org/) ≥ 18
- Un projet [Supabase](https://supabase.com/) (gratuit)

### 2. Créer les tables Supabase

1. Ouvrez votre projet sur [supabase.com](https://supabase.com/dashboard).
2. Allez dans **SQL Editor → New query**.
3. Copiez-collez le contenu de `supabase/schema.sql` et cliquez sur **Run**.

Cela crée les tables `carnet`, `descentes`, `soldes_courants`, la fonction
`enregistrer_descente` (transaction atomique) et les policies RLS
nécessaires pour que l'app fonctionne sans authentification.

### 3. Configurer les identifiants

Dans **Project Settings → API**, récupérez l'URL du projet et la clé
**anon/public**. Créez `frontend/.env` à partir de `.env.example` :

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
```

### 4. Démarrer le frontend

```bash
cd frontend
npm install
npm run dev
```

Vite démarre sur **http://localhost:5173**.

---

## Déploiement

### 1. Construire le frontend

```bash
cd frontend
npm run build
# Les fichiers statiques sont dans frontend/dist/
```

### 2. Héberger les fichiers statiques

`frontend/dist/` peut être déployé sur n'importe quel hébergeur statique
(Vercel, Netlify, GitHub Pages, ou un simple `public_html/` FTP) — il n'y a
plus de backend PHP à déployer, tout passe par Supabase.

Pensez à renseigner les variables d'environnement `VITE_SUPABASE_URL` et
`VITE_SUPABASE_ANON_KEY` dans la configuration de build de l'hébergeur
(ou dans `frontend/.env` avant `npm run build` si déploiement manuel).

---

## Fonctionnement au quotidien

L'app tient sur un seul écran (**Caisse**) : un tableau combiné affiche les
4 comptes (Espèces, Wave, Orange Money, Free Money) et le carnet (emprunts /
sommes confiées), avec un solde cumulé ligne par ligne jusqu'à l'avoir réel.

- Toucher le crayon à côté d'un compte pour corriger son montant.
- **+ Emprunt** / **+ Confié** pour ajouter une entrée au carnet.
- **Réglé** à côté d'une entrée du carnet quand la personne a remboursé son
  emprunt (ou qu'on lui a rendu la somme confiée) — l'entrée est retirée.

Chaque modification est enregistrée immédiatement. Chaque jour où l'app est
rouverte, si les comptes n'ont pas encore été touchés aujourd'hui, l'état de
la veille est automatiquement archivé dans l'**Historique** avant de
continuer à travailler sur la nouvelle journée — aucune action manuelle de
clôture n'est nécessaire.

## Fonctionnement hors-ligne

Si le réseau est coupé au moment de la clôture automatique de la veille :
- L'archive du jour est sauvegardée dans `localStorage` (file d'attente).
- Un bandeau orange s'affiche en haut de l'écran.
- À la reconnexion (ou au prochain démarrage de l'app), la synchronisation est automatique.

---

## Calcul de l'avoir réel

```
AVOIR RÉEL = Espèces + Wave + Orange Money + Free Money
           + (On me doit = somme des créances)
           − (Je dois    = somme des dettes)
```

---

## Sécurité

L'app n'a pas d'authentification : la clé Supabase **anon** est utilisée
directement côté frontend, avec des policies RLS autorisant l'accès complet
(comme l'ancienne API PHP ouverte en CORS `*`). C'est adapté à un usage
personnel/familial, mais toute personne disposant du lien et de la clé peut
lire ou modifier les données. Pour un usage plus large, ajoutez
l'authentification Supabase et restreignez les policies RLS par utilisateur.

---

## Technologies utilisées

| Couche    | Technologie              |
|-----------|---------------------------|
| Frontend  | React 18 + Vite 5         |
| Backend   | Supabase (PostgreSQL + PostgREST) |
| Style     | CSS custom (pas de framework) |
