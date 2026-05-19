
-- Enum de roles
create type public.app_role as enum ('admin', 'consultor');

-- Tabela de perfis dos consultores
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  creci text,
  telefone text,
  cidade text default 'Belo Horizonte',
  uf text default 'MG',
  logo_url text,
  cor_primaria text,
  cor_secundaria text,
  assinatura_rodape text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Tabela de roles (separada para evitar privilege escalation)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer function (evita recursão em RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- RLS: profiles
create policy "Consultores veem o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

create policy "Consultores atualizam o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Consultores inserem o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- RLS: user_roles
create policy "Usuário vê os próprios roles"
  on public.user_roles for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "Admins gerenciam roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at em profiles
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Trigger: criar profile + role 'consultor' automaticamente no signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name', '')
  );
  insert into public.user_roles (user_id, role)
  values (new.id, 'consultor');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
