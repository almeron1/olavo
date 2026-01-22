
-- LIMPEZA TOTAL (Cuidado: Apaga dados existentes para garantir a nova estrutura)
DROP TABLE IF EXISTS public.contracts;
DROP TABLE IF EXISTS public.lessons;
DROP TABLE IF EXISTS public.modules;
DROP TABLE IF EXISTS public.courses;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.users;

-- Habilita extensão para UUIDs
create extension if not exists "uuid-ossp";

-- 1. Tabela de Usuários Personalizada (Substitui Auth e Profiles)
create table public.users (
  id uuid default uuid_generate_v4() primary key,
  email text unique not null,
  password text not null, -- Em produção, isso deveria ser hash. Prototipo: texto plano.
  name text,
  role text default 'STUDENT', -- 'ADMIN', 'PROFESSOR', 'STUDENT'
  avatar text,
  status text default 'active',
  last_access timestamp with time zone,
  
  -- Dados Estendidos (Aluno/Professor)
  cpf text,
  rg text,
  birth_date date,
  phone text,
  address jsonb default '{}',
  guardian jsonb default '{}',
  specialty text, 
  subjects text[],
  enrolled_courses text[] default '{}',
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Cursos
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  thumbnail text,
  status text default 'DRAFT',
  professor_id text, -- ID do usuário professor
  price numeric default 0,
  show_in_store boolean default false,
  program text,
  category text,
  subject text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabela de Módulos
create table public.modules (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Aulas
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references public.modules(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  description text,
  type text default 'RECORDED',
  status text default 'DRAFT',
  video_url text,
  duration text,
  materials jsonb default '[]',
  "order" integer default 0,
  is_free boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabela de Contratos
create table public.contracts (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.users(id) on delete set null,
  student_name text,
  course_id uuid references public.courses(id) on delete set null,
  course_name text,
  content text,
  status text default 'PENDING',
  url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- POLÍTICAS RLS (Row Level Security)
-- Como estamos ignorando o Auth do Supabase e controlando via App,
-- vamos deixar público para leitura/escrita via API Key por enquanto.
alter table public.users enable row level security;
create policy "Allow all access" on public.users for all using (true);

alter table public.courses enable row level security;
create policy "Allow all access" on public.courses for all using (true);

alter table public.modules enable row level security;
create policy "Allow all access" on public.modules for all using (true);

alter table public.lessons enable row level security;
create policy "Allow all access" on public.lessons for all using (true);

alter table public.contracts enable row level security;
create policy "Allow all access" on public.contracts for all using (true);

-- INSERIR USUÁRIO ADMIN PADRÃO
INSERT INTO public.users (email, password, name, role, avatar, status)
VALUES (
  'admin@olavo.com',
  '123456',
  'Administrador Olavo',
  'ADMIN',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  'active'
);
