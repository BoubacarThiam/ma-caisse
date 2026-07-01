<?php
// ============================================================
// Ma Caisse — En-têtes CORS + JSON communs à toutes les routes
// ============================================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Répondre immédiatement aux requêtes préliminaires CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Lit et décode le corps JSON de la requête entrante.
 */
function lireCorps(): array {
    $corps = file_get_contents('php://input');
    return json_decode($corps, true) ?? [];
}

/**
 * Envoie une réponse JSON avec le code HTTP indiqué.
 */
function repondre(mixed $donnees, int $code = 200): never {
    http_response_code($code);
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Envoie une erreur JSON standardisée.
 */
function erreur(string $message, int $code = 400): never {
    repondre(['erreur' => $message], $code);
}
