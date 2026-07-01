<?php
// ============================================================
// Ma Caisse — Configuration de la base de données
// Modifier ces valeurs selon votre environnement
// ============================================================

define('DB_HOST',    'localhost');
define('DB_NAME',    'ma_caisse');
define('DB_USER',    'root');       // Changer en production
define('DB_PASS',    '');           // Changer en production
define('DB_CHARSET', 'utf8mb4');

/**
 * Retourne une instance PDO connectée à MySQL.
 * En cas d'échec, envoie une réponse JSON d'erreur et arrête l'exécution.
 */
function getDB(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    try {
        $dsn = sprintf(
            'mysql:host=%s;dbname=%s;charset=%s',
            DB_HOST, DB_NAME, DB_CHARSET
        );
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(503);
        echo json_encode(['erreur' => 'Connexion à la base impossible. Vérifiez config.php.']);
        exit;
    }
}
