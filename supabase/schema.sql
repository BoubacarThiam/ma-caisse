-- ============================================================
-- Ma Caisse — Schéma Supabase (PostgreSQL)
-- À exécuter une seule fois dans l'éditeur SQL de Supabase
-- (Dashboard → SQL Editor → New query → coller → Run)
-- ============================================================

-- ----------------------------------------------------------
-- Table : carnet
-- Créances (on me doit) et dettes (je dois / argent confié)
-- ----------------------------------------------------------
create table if not exists carnet (
  id            bigint generated always as identity primary key,
  type          text not null check (type in ('creance', 'dette')),
  nom           varchar(100) not null,
  montant       numeric(15,0) not null default 0,
  date_creation timestamptz not null default now()
);

-- ----------------------------------------------------------
-- Table : descentes
-- Historique de chaque fin de journée
-- ----------------------------------------------------------
create table if not exists descentes (
  id                  bigint generated always as identity primary key,
  date                date not null,
  especes             numeric(15,0) not null default 0,
  wave                numeric(15,0) not null default 0,
  orange_money        numeric(15,0) not null default 0,
  free_money          numeric(15,0) not null default 0,
  on_me_doit          numeric(15,0) not null default 0,
  je_dois             numeric(15,0) not null default 0,
  avoir_reel          numeric(15,0) not null default 0,
  gain_attendu        numeric(15,0),
  ecart               numeric(15,0),
  date_enregistrement timestamptz not null default now()
);

-- ----------------------------------------------------------
-- Table : soldes_courants
-- Une seule ligne (id=1) mémorisant les derniers soldes
-- pour pré-remplir la prochaine descente
-- ----------------------------------------------------------
create table if not exists soldes_courants (
  id            smallint primary key default 1,
  especes       numeric(15,0) not null default 0,
  wave          numeric(15,0) not null default 0,
  orange_money  numeric(15,0) not null default 0,
  free_money    numeric(15,0) not null default 0,
  updated_at    timestamptz not null default now(),
  constraint soldes_courants_singleton check (id = 1)
);

insert into soldes_courants (id) values (1)
on conflict (id) do nothing;

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_soldes_courants_updated_at on soldes_courants;
create trigger trg_soldes_courants_updated_at
before update on soldes_courants
for each row execute function set_updated_at();

-- ----------------------------------------------------------
-- Fonction : enregistrer_descente
-- Insère la descente ET met à jour soldes_courants dans une
-- seule transaction (équivalent de la transaction PHP d'origine)
-- ----------------------------------------------------------
create or replace function enregistrer_descente(
  p_date date,
  p_especes numeric,
  p_wave numeric,
  p_orange_money numeric,
  p_free_money numeric,
  p_on_me_doit numeric,
  p_je_dois numeric,
  p_avoir_reel numeric,
  p_gain_attendu numeric default null,
  p_ecart numeric default null
) returns descentes
language plpgsql as $$
declare
  nouvelle descentes;
begin
  insert into descentes
    (date, especes, wave, orange_money, free_money,
     on_me_doit, je_dois, avoir_reel, gain_attendu, ecart)
  values
    (p_date, p_especes, p_wave, p_orange_money, p_free_money,
     p_on_me_doit, p_je_dois, p_avoir_reel, p_gain_attendu, p_ecart)
  returning * into nouvelle;

  update soldes_courants
     set especes = p_especes, wave = p_wave,
         orange_money = p_orange_money, free_money = p_free_money
   where id = 1;

  return nouvelle;
end;
$$;

-- ----------------------------------------------------------
-- Row Level Security
-- L'app n'a pas d'authentification (usage personnel, clé anon
-- utilisée directement côté frontend) : on autorise explicitement
-- l'accès complet au rôle anon, comme le faisait l'ancienne API
-- PHP ouverte (CORS: *). Aucun secret ni donnée tierce n'est exposé.
-- ----------------------------------------------------------
alter table carnet enable row level security;
alter table descentes enable row level security;
alter table soldes_courants enable row level security;

drop policy if exists "anon full access" on carnet;
create policy "anon full access" on carnet for all to anon using (true) with check (true);

drop policy if exists "anon full access" on descentes;
create policy "anon full access" on descentes for all to anon using (true) with check (true);

drop policy if exists "anon full access" on soldes_courants;
create policy "anon full access" on soldes_courants for all to anon using (true) with check (true);

grant usage on schema public to anon;
grant all on carnet, descentes, soldes_courants to anon;
grant usage, select on all sequences in schema public to anon;
grant execute on function enregistrer_descente to anon;
