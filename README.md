# Ma Caisse

Application web mobile-first pour agentes de transfert d'argent (Wave, Orange Money, Free Money) au Sénégal.  
Calcule l'avoir réel en fin de journée et conserve l'historique complet dans MySQL.

---

## Structure du projet

```
ma-caisse/
├── backend/
│   ├── config.php          ← Identifiants MySQL (à modifier)
│   ├── cors.php            ← En-têtes CORS + helpers
│   ├── schema.sql          ← Création de la base de données
│   └── api/
│       ├── carnet.php      ← CRUD créances / dettes
│       ├── descentes.php   ← Historique des descentes
│       └── soldes.php      ← Soldes courants
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── App.jsx
        ├── index.css
        ├── components/
        │   ├── Dashboard.jsx
        │   ├── Carnet.jsx
        │   ├── Descente.jsx
        │   ├── Confirmation.jsx
        │   └── Historique.jsx
        └── utils/
            ├── api.js       ← Appels fetch vers le backend
            ├── format.js    ← Formatage FCFA, dates
            └── offline.js   ← File d'attente hors-ligne
```

---

## Lancement en local (XAMPP)

### 1. Prérequis
- [XAMPP](https://www.apachefriends.org/) installé (Apache + MySQL)
- [Node.js](https://nodejs.org/) ≥ 18

### 2. Placer le projet dans XAMPP

```bash
# Copier le dossier ma-caisse/ dans le répertoire web de XAMPP
# Windows : C:\xampp\htdocs\ma-caisse\
# Linux   : /opt/lampp/htdocs/ma-caisse/
# macOS   : /Applications/XAMPP/htdocs/ma-caisse/
```

### 3. Créer la base de données

1. Démarrez Apache et MySQL dans le panneau XAMPP.
2. Ouvrez **phpMyAdmin** : http://localhost/phpmyadmin
3. Cliquez sur **Importer** → sélectionnez `backend/schema.sql` → Exécuter.

   *Ou bien copiez-collez le contenu de `schema.sql` dans l'onglet SQL.*

### 4. Configurer la connexion MySQL

Ouvrez `backend/config.php` et adaptez si nécessaire :

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'ma_caisse');
define('DB_USER', 'root');   // Votre utilisateur MySQL
define('DB_PASS', '');       // Votre mot de passe MySQL
```

### 5. Démarrer le frontend Vite

```bash
cd ma-caisse/frontend
npm install
npm run dev
```

Vite démarre sur **http://localhost:5173** et proxifie automatiquement  
`/backend/*` vers XAMPP (`http://localhost/ma-caisse/backend/*`).

> **Important :** le proxy dans `vite.config.js` suppose que le projet est  
> dans `htdocs/ma-caisse/`. Si vous l'avez placé ailleurs, ajustez la valeur  
> `target` dans `vite.config.js`.

### 6. Tester l'API directement (optionnel)

```
http://localhost/ma-caisse/backend/api/soldes.php
http://localhost/ma-caisse/backend/api/carnet.php
http://localhost/ma-caisse/backend/api/descentes.php
```

---

## Déploiement sur hébergement mutualisé

### 1. Construire le frontend

```bash
cd frontend
npm run build
# Les fichiers statiques sont dans frontend/dist/
```

### 2. Uploader les fichiers via FTP

Structure recommandée sur le serveur (par exemple `public_html/`) :

```
public_html/
├── index.html          ← copié depuis frontend/dist/index.html
├── assets/             ← copié depuis frontend/dist/assets/
└── backend/
    ├── config.php
    ├── cors.php
    └── api/
        ├── carnet.php
        ├── descentes.php
        └── soldes.php
```

1. Copiez **tout le contenu** de `frontend/dist/` à la racine de `public_html/`.
2. Copiez le dossier `backend/` dans `public_html/backend/`.

### 3. Créer la base MySQL chez l'hébergeur

- Dans **cPanel → MySQL Databases** : créez une base (ex. `monlogin_ma_caisse`)  
  et un utilisateur avec tous les droits.
- Dans **phpMyAdmin** : importez `backend/schema.sql`.

### 4. Mettre à jour config.php

```php
define('DB_HOST', 'localhost');     // Toujours localhost chez la plupart des hébergeurs
define('DB_NAME', 'monlogin_ma_caisse');
define('DB_USER', 'monlogin_user');
define('DB_PASS', 'monMotDePasse');
```

### 5. Vérifier les permissions

Les fichiers PHP doivent être lisibles par le serveur web (chmod 644).  
Aucune écriture de fichier n'est requise par l'application.

### 6. Optionnel — HTTPS et CORS

Si le frontend est sur un domaine différent du backend (rare en mutualisé),  
modifiez l'en-tête dans `backend/cors.php` :

```php
header('Access-Control-Allow-Origin: https://votre-domaine.com');
```

Et dans `frontend/.env` (créez ce fichier à partir de `.env.example`) :

```
VITE_API_URL=https://votre-domaine.com/backend/api
```

Puis relancez `npm run build`.

---

## Fonctionnement hors-ligne

Si le réseau est coupé au moment de valider une descente :
- La descente est sauvegardée dans `localStorage` (file d'attente).
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

## Technologies utilisées

| Couche    | Technologie        |
|-----------|--------------------|
| Frontend  | React 18 + Vite 5  |
| Backend   | PHP 8+ avec PDO    |
| Base de données | MySQL 5.7+  |
| Style     | CSS custom (pas de framework) |
