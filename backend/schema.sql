-- ============================================================
-- Ma Caisse — Schéma MySQL
-- Exécuter une seule fois pour créer la base et les tables
-- ============================================================

CREATE DATABASE IF NOT EXISTS ma_caisse
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ma_caisse;

-- ----------------------------------------------------------
-- Table : carnet
-- Créances (on me doit) et dettes (je dois / argent confié)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS carnet (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  type            ENUM('creance', 'dette') NOT NULL COMMENT 'creance = on me doit ; dette = je dois',
  nom             VARCHAR(100) NOT NULL,
  montant         DECIMAL(15,0) NOT NULL DEFAULT 0,
  date_creation   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table : descentes
-- Historique de chaque fin de journée
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS descentes (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  date                  DATE NOT NULL,
  especes               DECIMAL(15,0) NOT NULL DEFAULT 0,
  wave                  DECIMAL(15,0) NOT NULL DEFAULT 0,
  orange_money          DECIMAL(15,0) NOT NULL DEFAULT 0,
  free_money            DECIMAL(15,0) NOT NULL DEFAULT 0,
  on_me_doit            DECIMAL(15,0) NOT NULL DEFAULT 0,
  je_dois               DECIMAL(15,0) NOT NULL DEFAULT 0,
  avoir_reel            DECIMAL(15,0) NOT NULL DEFAULT 0,
  gain_attendu          DECIMAL(15,0) DEFAULT NULL,
  ecart                 DECIMAL(15,0) DEFAULT NULL,
  date_enregistrement   DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table : soldes_courants
-- Une seule ligne (id=1) mémorisant les derniers soldes
-- pour pré-remplir la prochaine descente
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS soldes_courants (
  id            INT PRIMARY KEY DEFAULT 1,
  especes       DECIMAL(15,0) NOT NULL DEFAULT 0,
  wave          DECIMAL(15,0) NOT NULL DEFAULT 0,
  orange_money  DECIMAL(15,0) NOT NULL DEFAULT 0,
  free_money    DECIMAL(15,0) NOT NULL DEFAULT 0,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ligne initiale unique dans soldes_courants
INSERT INTO soldes_courants (id, especes, wave, orange_money, free_money)
VALUES (1, 0, 0, 0, 0)
ON DUPLICATE KEY UPDATE id = 1;
