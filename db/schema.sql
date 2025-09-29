-- Create schema for WhatsHub
create table if not exists public.conversas (
  id_conversa text primary key,
  nome_contato text not null,
  ultima_mensagem text,
  timestamp timestamptz not null default now(),
  status text not null default 'ativa' check (status in ('ativa','arquivada')),
  importante boolean not null default false
);

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  id_conversa_fk text not null references public.conversas(id_conversa) on delete cascade,
  remetente text not null check (remetente in ('contato','operador','sistema')),
  conteudo text not null,
  timestamp timestamptz not null default now()
);

create index if not exists idx_mensagens_conversa_ts on public.mensagens(id_conversa_fk, timestamp);
create index if not exists idx_conversas_ts on public.conversas(timestamp);

-- Enable Row Level Security but allow anon read/write for demo
alter table public.conversas enable row level security;
alter table public.mensagens enable row level security;

drop policy if exists "conversas_read" on public.conversas;
create policy "conversas_read" on public.conversas for select to anon using (true);

drop policy if exists "conversas_write" on public.conversas;
create policy "conversas_write" on public.conversas for insert to anon with check (true);

drop policy if exists "conversas_update" on public.conversas;
create policy "conversas_update" on public.conversas for update to anon using (true);

drop policy if exists "mensagens_read" on public.mensagens;
create policy "mensagens_read" on public.mensagens for select to anon using (true);

drop policy if exists "mensagens_write" on public.mensagens;
create policy "mensagens_write" on public.mensagens for insert to anon with check (true);

-- Extension for gen_random_uuid
create extension if not exists pgcrypto;