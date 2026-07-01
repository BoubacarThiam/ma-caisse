<?php
// ============================================================
// Ma Caisse — API Soldes courants
// GET /api/soldes.php → retourne la ligne unique de soldes_courants
// PUT /api/soldes.php → met à jour les soldes (réinitialisation, etc.)
// ============================================================

require_once '../cors.php';
require_once '../config.php';

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // --- Lecture ---
    case 'GET':
        $stmt = $pdo->query('SELECT * FROM soldes_courants WHERE id = 1');
        $row  = $stmt->fetch();
        // Garantit une réponse même si la ligne n'existe pas encore
        repondre($row ?: [
            'id' => 1, 'especes' => 0, 'wave' => 0,
            'orange_money' => 0, 'free_money' => 0
        ]);

    // --- Mise à jour manuelle (réinitialisation) ---
    case 'PUT':
        $corps = lireCorps();
        $especes      = (int)($corps['especes']      ?? 0);
        $wave         = (int)($corps['wave']          ?? 0);
        $orange_money = (int)($corps['orange_money']  ?? 0);
        $free_money   = (int)($corps['free_money']    ?? 0);

        $stmt = $pdo->prepare('
            UPDATE soldes_courants
               SET especes = ?, wave = ?, orange_money = ?, free_money = ?
             WHERE id = 1
        ');
        $stmt->execute([$especes, $wave, $orange_money, $free_money]);
        repondre(['message' => 'Soldes mis à jour.']);

    default:
        erreur("Méthode non autorisée.", 405);
}
