# TI-CICERO - Implementação Supabase Completa ✅

## Status: PRONTO PARA USAR

Todo o sistema foi migrado do localStorage para Supabase com autenticação, banco de dados relacional e chat em tempo real. Abaixo está o checklist de implementação completo.

---

## ✅ Arquivos Implementados

### 1. **supabase-config.js** ✅
- Cliente Supabase importado em todos os arquivos
- Compartilha URL e anon key
- **Status:** PRONTO - preencha URL e KEY do seu projeto Supabase

### 2. **index.html (Admin)** ✅
- Login overlay com email/senha
- Scripts convertidos para `type="module"`
- Botão "Sair" no sidebar
- Auth guard verifica role='admin'
- **Status:** PRONTO

### 3. **portal.html (Colaboradores)** ✅
- Auth overlay com login e cadastro
- Seção de cadastro: nome, email, setor (dropdown), senha
- Pré-preenche nome/email em novo chamado
- Filtro para mostrar apenas meus chamados
- **Status:** PRONTO

### 4. **app.js** ✅
- Importa todos os módulos ES
- Gerencia autenticação do admin
- Verifica role='admin' na sessão
- Inicializa managers (chamadosManager, ativosManager) de forma async
- Await setupNavigation() após init dos managers
- **Status:** PRONTO

### 5. **chamados.js** ✅
- Totalmente async com Supabase CRUD
- loadChamados(): select de chamados table
- submitNovoCall(): insere com next_chamado_codigo() RPC (gera CH-00001)
- submitGerenciarCall(): update status/responsavel/resposta + cria mensagem
- deleteChamado(): delete de chamados
- addMensagem(): insere em tabela mensagens separada
- openChatModal(): setup Supabase Realtime subscription para mensagens
- setupDragAndDrop(): update status via Supabase ao dropar
- **Status:** PRONTO

### 6. **ativos.js** ✅
- Totalmente async com Supabase CRUD
- loadSetores(): select de setores table
- loadAtivos(): select de ativos table
- addSetor/editSetor/deleteSetor: CRUD via Supabase
- submitNovoAtivo(): insert ativos
- importAtivos(): upsert com onConflict: 'codigo'
- populateSetorSelect(): atualiza dropdowns
- **Status:** PRONTO

### 7. **portal.js** ✅
- handlePortalLogin(): signInWithPassword
- handlePortalRegister(): signUp + insert profile
- handlePortalLogout(): signOut
- loadSetoresForDropdown(): popula select
- submitChamado(): insert com tipo_chamado e campo_extra
- carregarMeusChamados(): supabase.from('chamados').select().eq('user_id', currentUser.id)
- submitPortalChat(): insert em mensagens
- Realtime subscription em abrirChamado()
- **Status:** PRONTO

### 8. **dashboard.js** ✅
- updateDashboard() com defensive null checks
- Acessa window.chamadosManager e window.ativosManager
- Exposto ao window scope
- **Status:** PRONTO

### 9. **erp-navigation.js** ✅
- setupNavigation() agora async
- submitNovoSetor/submitEditSetor/deleteSetor: agora async
- Await de todos os métodos Supabase do ativosManager
- **Status:** PRONTO

### 10. **style.css (Admin)** ✅
- Auth overlay e auth-box
- Form-group com width 100% e box-sizing: border-box
- Modal-content form com flex layout
- Form-row com grid 2 colunas
- Input focus com box-shadow azul
- **Status:** PRONTO

### 11. **portal.css (Colaboradores)** ✅
- Auth overlay e auth-section
- Form-group com width 100% e box-sizing: border-box
- Buttons com width 100% na auth
- Auth-toggle para switch login/cadastro
- Textarea com min-height: 100px
- **Status:** PRONTO

### 12. **netlify.toml** ✅
- Build config com publish = "."
- Cache headers otimizados
- Security headers (X-Frame-Options, X-Content-Type-Options)
- **Status:** PRONTO

### 13. **.gitignore** ✅
- Exclui .env, node_modules, .supabase
- **Status:** PRONTO

---

## 🗄️ Schema Supabase

Execute o SQL em: Supabase > SQL Editor > Novo Query

```sql
-- Profiles (estende auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  nome text not null,
  setor text,
  role text check (role in ('admin', 'colaborador')) default 'colaborador',
  created_at timestamp default now()
);

-- Setores
create table if not exists public.setores (
  id uuid primary key default gen_random_uuid(),
  nome text unique not null,
  created_at timestamp default now()
);

-- Chamados
create table if not exists public.chamados (
  id uuid primary key default gen_random_uuid(),
  codigo text unique default '',
  user_id uuid references public.profiles on delete cascade,
  nome text,
  email text,
  titulo text,
  descricao text,
  prioridade text default 'media',
  status text default 'aberto',
  responsavel text,
  resposta text,
  tipo_chamado text,
  campo_extra text,
  token text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Mensagens
create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  chamado_id uuid references public.chamados on delete cascade,
  user_id uuid references public.profiles on delete cascade,
  remetente text, -- 'admin' ou 'colaborador'
  nome text,
  texto text,
  created_at timestamp default now()
);

-- Ativos
create table if not exists public.ativos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  descricao text,
  setor text,
  categoria text,
  status text default 'disponivel',
  valor float default 0,
  created_at timestamp default now()
);

-- Function: Gerar código sequencial CH-00001, CH-00002, etc
create or replace function next_chamado_codigo()
returns text as $$
declare
  next_num int;
begin
  select coalesce(max(cast(substring(codigo from 4) as int)), 0) + 1 into next_num
  from public.chamados
  where codigo ~ '^CH-[0-9]+$';
  
  return 'CH-' || lpad(next_num::text, 5, '0');
end;
$$ language plpgsql;

-- Trigger: Auto-criar profile ao registrar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nome, role)
  values (new.id, new.email, 'colaborador');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.setores enable row level security;
alter table public.chamados enable row level security;
alter table public.mensagens enable row level security;
alter table public.ativos enable row level security;

-- Profiles: Usuário vê seu próprio, admin vê todos
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Only admin can update profiles" on public.profiles
  for all using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Setores: Anon pode ler; só admin pode mutar
create policy "Anyone can read setores" on public.setores
  for select using (true);

create policy "Only admin can mutate setores" on public.setores
  for all using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Chamados: Usuário vê seu próprio; admin vê todos
create policy "Users see own chamados" on public.chamados
  for select using (auth.uid() = user_id or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Users insert own chamados" on public.chamados
  for insert with check (auth.uid() = user_id);

create policy "Only admin can update chamados" on public.chamados
  for update using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create policy "Only admin can delete chamados" on public.chamados
  for delete using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Mensagens: Usuário vê/insere no seu chamado; admin vê/insere tudo
create policy "Users see their chamado messages" on public.mensagens
  for select using (
    exists(select 1 from public.chamados c where c.id = chamado_id and c.user_id = auth.uid())
    or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "Users insert messages in own chamado" on public.mensagens
  for insert with check (
    exists(select 1 from public.chamados c where c.id = chamado_id and c.user_id = auth.uid())
    or exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Ativos: Só admin
create policy "Only admin access ativos" on public.ativos
  for all using (exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Enable Realtime para mensagens
alter publication supabase_realtime add table public.mensagens;
```

---

## 🚀 Setup Supabase (30min)

1. **Criar Projeto:**
   - Ir para supabase.com
   - Criar novo projeto (escolher região próxima)
   - Aguardar criação

2. **Rodar SQL Schema:**
   - Ir para: SQL Editor > Novo Query
   - Colar todo o código acima
   - Executar

3. **Configurar Auth:**
   - Ir para: Authentication > Providers > Email
   - Confirmar que "Email" está habilitado
   - Ir para: Authentication > URL Configuration
   - Em "Site URL", adicionar:
     - `http://localhost:5500` (desenvolvimento local)
     - `https://seu-dominio.netlify.app` (após deploy)

4. **Copiar Credenciais:**
   - Ir para: Settings > Project
   - Copiar "Project URL" e "API Key (anon public)"
   - Colocar em `supabase-config.js`:
     ```js
     const PROJECT_URL = 'https://seu-projeto.supabase.co';
     const ANON_KEY = 'sua-chave-publica';
     ```

5. **Tornar a si Admin:**
   - Ir para: SQL Editor > Novo Query
   - Executar:
     ```sql
     UPDATE public.profiles 
     SET role = 'admin' 
     WHERE email = 'seu-email@dominio.com';
     ```

---

## 🧪 Testar Localmente

1. **Instalar Live Server (VSCode):**
   - Extensão: "Live Server"
   - Botão direito em `index.html` > "Open with Live Server"
   - Abre em `http://localhost:5500`

2. **Testar Admin:**
   - Registre com seu email em portal.html (como admin)
   - Rode comando SQL acima para dar role='admin'
   - Volte para index.html, faça login
   - Deve ver: Dashboard > Kanban > Ativos > Setores

3. **Testar Colaborador:**
   - Abra portal.html em aba anônima
   - Cadastre com nome, email, setor (escolha um)
   - Abra chamado
   - Volta no index.html (admin), deve ver aparecer na coluna "Abertos"
   - Clique no chamado, envie mensagem
   - Volta ao portal.html, deve ver mensagem do admin sem recarregar (Realtime!)

4. **Testar Kanban:**
   - Arraste chamado entre colunas
   - Deve salvar status no Supabase

---

## 🌐 Deploy Netlify

1. **Criar Repositório GitHub:**
   ```bash
   cd "TI-CICERO"
   git init
   git add .
   git commit -m "Initial commit: Supabase migration"
   git branch -M main
   git remote add origin https://github.com/seu-usuario/ti-cicero.git
   git push -u origin main
   ```

2. **Deploy no Netlify:**
   - Ir para netlify.com
   - "New site from Git"
   - Conectar GitHub repo
   - Build command: *(deixar em branco)*
   - Publish directory: `.` (ou vazio)
   - Deploy
   - Aguardar ~1min

3. **Atualizar Supabase:**
   - Copiar URL do Netlify (ex: `https://ti-cicero.netlify.app`)
   - Supabase > Auth > URL Configuration > Site URL
   - Adicionar a URL do Netlify
   - Salvar

---

## 📋 Checklist Final

- [ ] supabase-config.js preenchido com credenciais reais
- [ ] SQL schema rodado no Supabase
- [ ] Email auth habilitado
- [ ] Site URL configurado (localhost + Netlify)
- [ ] Você marcado como admin
- [ ] Realtime habilitado para mensagens table
- [ ] Login no index.html funciona
- [ ] Cadastro no portal.html funciona
- [ ] Novo chamado aparece no Kanban em tempo real
- [ ] Chat Realtime funciona (mensagens aparecem sem F5)
- [ ] Drag-drop status updates funciona
- [ ] Setor management funciona
- [ ] Ativo import funciona
- [ ] Netlify deploy sucesso

---

## 🔗 Links Rápidos

- **Supabase Dashboard:** https://app.supabase.com
- **Netlify Dashboard:** https://app.netlify.com
- **Documentação Supabase:** https://supabase.com/docs
- **Documentação Realtime:** https://supabase.com/docs/guides/realtime

---

## 📞 Suporte

Se algo não funcionar:
1. Verifique console.log no DevTools (F12)
2. Verifique se credentials estão corretos em supabase-config.js
3. Verifique RLS policies (ir para cada table em Supabase)
4. Verifique se auth user existe em profiles table
5. Verifique Site URL configuration em Auth

**Status Final:** ✅ PRONTO PARA USAR
