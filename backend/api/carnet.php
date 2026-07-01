<?php
// ============================================================
// Ma Caisse — API Carnet (créances et dettes)
// GET    /api/carnet.php          → liste toutes les entrées
// GET    /api/carnet.php?type=... → filtre par type
// POST   /api/carnet.php          → ajoute une entrée
// PUT    /api/carnet.php          → modifie une entrée (id requis dans le corps)
// DELETE /api/carnet.php?id=...   → supprime une entrée
// ============================================================

require_once '../cors.php';
require_once '../config.php';

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // --- Lecture ---
    case 'GET':
        $type = isset($_GET['type']) ? trim($_GET['type']) : null;

        if ($type !== null) {
            if (!in_array($type, ['creance', 'dette'])) {
                erreur("Type invalide. Valeurs acceptées : 'creance', 'dette'.");
            }
            $stmt = $pdo->prepare(
                'SELECT * FROM carnet WHERE type = ? ORDER BY date_creation DESC'
            );
            $stmt->execute([$type]);
        } else {
            $stmt = $pdo->query(
                "SELECT * FROM carnet ORDER BY type, date_creation DESC"
            );
        }
        repondre($stmt->fetchAll());

    // --- Création ---
    case 'POST':
        $corps = lireCorps();
        $type    = trim($corps['type']    ?? '');
        $nom     = trim($corps['nom']     ?? '');
        $montant = (int)($corps['montant'] ?? 0);

        if (!in_array($type, ['creance', 'dette'])) erreur("Type invalide.");
        if ($nom === '')    erreur("Le nom est obligatoire.");
        if ($montant <= 0)  erreur("Le montant doit être positif.");

        $stmt = $pdo->prepare(
            'INSERT INTO carnet (type, nom, montant) VALUES (?, ?, ?)'
        );
        $stmt->execute([$type, $nom, $montant]);
        repondre(['id' => (int)$pdo->lastInsertId(), 'message' => 'Entrée ajoutée.'], 201);

    // --- Modification ---
    case 'PUT':
        $corps = lireCorps();
        $id      = (int)($corps['id']      ?? 0);
        $nom     = trim($corps['nom']      ?? '');
        $montant = (int)($corps['montant'] ?? 0);

        if ($id <= 0)       erreur("ID invalide.");
        if ($nom === '')    erreur("Le nom est obligatoire.");
        if ($montant <= 0)  erreur("Le montant doit être positif.");

        $stmt = $pdo->prepare(
            'UPDATE carnet SET nom = ?, montant = ? WHERE id = ?'
        );
        $stmt->execute([$nom, $montant, $id]);

        if ($stmt->rowCount() === 0) erreur("Entrée introuvable.", 404);
        repondre(['message' => 'Entrée modifiée.']);

    // --- Suppression ---
    case 'DELETE':
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) erreur("ID invalide.");

        $stmt = $pdo->prepare('DELETE FROM carnet WHERE id = ?');
        $stmt->execute([$id]);

        if ($stmt->rowCount() === 0) erreur("Entrée introuvable.", 404);
        repondre(['message' => 'Entrée supprimée.']);

    default:
        erreur("Méthode non autorisée.", 405);
}
