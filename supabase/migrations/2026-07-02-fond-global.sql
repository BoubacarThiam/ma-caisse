-- Ajoute le "Fond global" (capital de départ) aux soldes courants.
-- À exécuter une seule fois dans le SQL Editor de Supabase.
alter table soldes_courants
  add column if not exists fond_global numeric(15,0) not null default 6597000;
