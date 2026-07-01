<?php
// ============================================================
// Ma Caisse — API Descentes (historique fin de journée)
// GET  /api/descentes.php        → liste toutes les descentes
// GET  /api/descentes.php?id=... → détail d'une descente
// POST /api/descentes.php        → enregistre une descente +
//                                   met à jour soldes_courants
// ============================================================

require_once '../cors.php';
require_once '../config.php';

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // --- Lecture ---
    case 'GET':
        $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

        if ($id > 0) {
            $stmt = $pdo->prepare('SELECT * FROM descentes WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch();
            if (!$row) erreur("Descente introuvable.", 404);
            repondre($row);
        }

        // Liste complète, la plus récente en premier
        $stmt = $pdo->query(
            'SELECT * FROM descentes ORDER BY date DESC, date_enregistrement DESC'
        );
        repondre($stmt->fetchAll());

    // --- Enregistrement ---
    case 'POST':
        $corps = lireCorps();

        // Validation des champs obligatoires
        $champs = ['date', 'especes', 'wave', 'orange_money', 'free_money',
                   'on_me_doit', 'je_dois', 'avoir_reel'];
        foreach ($champs as $c) {
            if (!array_key_exists($c, $corps)) {
                erreur("Champ manquant : $c");
            }
        }

        $date         = trim($corps['date']);
        $especes      = (int)$corps['especes'];
        $wave         = (int)$corps['wave'];
        $orange_money = (int)$corps['orange_money'];
        $free_money   = (int)$corps['free_money'];
        $on_me_doit   = (int)$corps['on_me_doit'];
        $je_dois      = (int)$corps['je_dois'];
        $avoir_reel   = (int)$corps['avoir_reel'];
        $gain_attendu = isset($corps['gain_attendu']) && $corps['gain_attendu'] !== ''
                        ? (int)$corps['gain_attendu'] : null;
        $ecart        = isset($corps['ecart']) && $corps['ecart'] !== ''
                        ? (int)$corps['ecart'] : null;

        // Validation de la date
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            erreur("Format de date invalide (attendu : AAAA-MM-JJ).");
        }

        $pdo->beginTransaction();
        try {
            // Insertion dans l'historique
            $stmt = $pdo->prepare('
                INSERT INTO descentes
                  (date, especes, wave, orange_money, free_money,
                   on_me_doit, je_dois, avoir_reel, gain_attendu, ecart)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');
            $stmt->execute([
                $date, $especes, $wave, $orange_money, $free_money,
                $on_me_doit, $je_dois, $avoir_reel, $gain_attendu, $ecart
            ]);
            $nouvelId = (int)$pdo->lastInsertId();

            // Mise à jour des soldes courants
            $stmt2 = $pdo->prepare('
                UPDATE soldes_courants
                   SET especes = ?, wave = ?, orange_money = ?, free_money = ?
                 WHERE id = 1
            ');
            $stmt2->execute([$especes, $wave, $orange_money, $free_money]);

            $pdo->commit();
            repondre(['id' => $nouvelId, 'message' => 'Descente enregistrée.'], 201);

        } catch (Exception $e) {
            $pdo->rollBack();
            erreur("Erreur lors de l'enregistrement : " . $e->getMessage(), 500);
        }

    default:
        erreur("Méthode non autorisée.", 405);
}
