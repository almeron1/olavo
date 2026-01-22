
-- Habilita extensão para IDs aleatórios
create extension if not exists "uuid-ossp";

-- 1. Tabela de Perfis (Profiles) - Extensão da tabela auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  name text,
  role text default 'STUDENT', -- 'ADMIN', 'PROFESSOR', 'STUDENT'
  avatar text,
  status text default 'active',
  last_access timestamp with time zone,
  cpf text,
  rg text,
  birth_date date,
  phone text,
  address jsonb, -- Armazena o objeto de endereço completo
  guardian jsonb, -- Armazena dados do responsável
  specialty text, -- Para professores
  subjects text[], -- Para professores
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
  professor_id text,
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
  course_id uuid references public.courses on delete cascade,
  title text not null,
  "order" integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Aulas
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references public.modules on delete cascade,
  course_id uuid references public.courses on delete cascade,
  title text not null,
  description text,
  type text default 'RECORDED',
  status text default 'DRAFT',
  video_url text,
  duration text,
  materials jsonb default '[]', -- Lista de materiais
  "order" integer default 0,
  is_free boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tabela de Contratos
create table public.contracts (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id),
  student_name text,
  course_id uuid references public.courses(id),
  course_name text,
  content text,
  status text default 'PENDING',
  url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Trigger para criar perfil automaticamente ao criar usuário no Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, avatar)
  values (new.id, new.email, new.raw_user_meta_data->>'name', coalesce(new.raw_user_meta_data->>'role', 'STUDENT'), 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Políticas de Segurança (Simples para protótipo: Liberar tudo)
alter table public.profiles enable row level security;
create policy "Public profiles access" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admin access profiles" on public.profiles for all using (true); 

alter table public.courses enable row level security;
create policy "Enable all for everyone" on public.courses for all using (true);

alter table public.modules enable row level security;
create policy "Enable all for everyone" on public.modules for all using (true);

alter table public.lessons enable row level security;
create policy "Enable all for everyone" on public.lessons for all using (true);

alter table public.contracts enable row level security;
create policy "Enable all for everyone" on public.contracts for all using (true);
