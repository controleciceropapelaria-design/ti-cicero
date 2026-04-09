# Setup TI-CICERO com Supabase + Netlify

## Passo 1: Criar Projeto Supabase (5 min)

1. Acesse https://app.supabase.com
2. Clique "New Project"
3. Preencha:
   - **Name:** ti-cicero
   - **Database Password:** (salve, vai precisar)
   - **Region:** Escolha a mais próxima
4. Aguarde ~2 min até o projeto estar pronto

## Passo 2: Rodar SQL Schema (5 min)

1. No painel do Supabase, vá para **SQL Editor** (lado esquerdo)
2. Clique **"New Query"**
3. Copie TODO o conteúdo de `supabase-schema.sql`
4. Cole na query e clique **"Run"**
5. Aguarde até que todas as 30+ linhas executem sem erro

## Passo 3: Habilitar Realtime (2 min)

1. Em **Database > Replication** (lado esquerdo)
2. Em "Supabase realtime" (aba), clique no ícone de ativar (play)
3. Na lista de tabelas, marque `mensagens`
4. Click "Update" ou "Save"

## Passo 4: Configurar Auth Site URL (5 min)

1. Vá para **Authentication > URL Configuration** (lado esquerdo)
2. Em "Site URL", coloque: `http://localhost:5500` (para local testing)
3. Clique "Save"
4. Depois de fazer deploy no Netlify, volte e adicione também a URL do Netlify

## Passo 5: Copiar Credenciais (2 min)

1. Vá para **Project Settings > API** (rodapé esquerdo)
2. Copie:
   - **Project URL:** (algo como `https://seu-projeto-ref.supabase.co`)
   - **Anon public:** (a chave pública)
3. Abra `supabase-config.js` e substitua as linhas:
   ```js
   const SUPABASE_URL = 'https://seu-projeto-ref.supabase.co';  // COLE AQUI
   const SUPABASE_ANON_KEY = 'sua-anon-key-aqui';  // COLE AQUI
   ```
4. Salve

## Passo 6: Tornar-se Admin (2 min - IMPORTANTE!)

1. **Local testing:**
   - Abra `index.html` no Live Server
   - Clique em "Entrar" no overlay
   - Use um email/senha para se cadastrar (ex: seu-email@domain.com / senha123)
   - Após fazer login e ir direto para a tela de "Acesso negado"

2. **No Supabase, faça você admin:**
   - Vá para **SQL Editor > New Query**
   - Cole:
     ```sql
     UPDATE public.profiles
     SET role = 'admin'
     WHERE email = 'seu-email@domain.com';
     ```
   - Clique "Run"

3. **Recarregue** a página do `index.html`
   - Agora você terá acesso total ao Kanban

## Passo 7: Testar Localmente

1. **Admin (você):**
   - Abra `http://localhost:5500/index.html`
   - Clique "Entrar" → faça login
   - Vê o Kanban completo

2. **Colaborador (teste):**
   - Abra `http://localhost:5500/portal.html` (outra aba/janela/navegador)
   - Clique "Cadastrar"
   - Preencha: nome, email, senha, setor
   - Abra um chamado
   - Volte para a aba do admin (`index.html`)
   - O chamado aparecerá no Kanban em "Aberto" em tempo real
   
3. **Chat em tempo real:**
   - Admin clica "Chat" no chamado
   - Envia uma mensagem
   - Colaborador vê aparecer sem recarregar a página
   - Colaborador responde
   - Admin vê em tempo real

## Passo 8: Deploy no Netlify

1. **Crie um repositório Git:**
   ```bash
   cd "c:\Users\aryan\OneDrive\Área de Trabalho\TI-CICERO"
   git init
   git add .
   git commit -m "Initial commit: TI-CICERO with Supabase"
   ```

2. **Push para GitHub:**
   - Crie um novo repositório em github.com (sem README/gitignore)
   - Copie o comando:
     ```bash
     git remote add origin https://github.com/seu-usuario/ti-cicero.git
     git push -u origin main
     ```

3. **Deploy no Netlify:**
   - Acesse https://app.netlify.com
   - Clique "Add new site" → "Import an existing project"
   - Selecione GitHub e o repositório `ti-cicero`
   - **Build Settings:**
     - Build command: (deixe vazio)
     - Publish directory: `.` (ponto)
   - Clique "Deploy site"
   - Aguarde ~1 min

4. **Atualizar Supabase URL no Netlify:**
   - Copie a URL que o Netlify gerou (ex: `https://ti-cicero-seu-suffix.netlify.app`)
   - Volte para Supabase → **Authentication > URL Configuration**
   - Em "Additional redirect URLs", adicione a URL do Netlify
   - Click "Save"

## Tudo Pronto! ✅

Seu sistema agora está:
- ✅ Com autenticação segura (Supabase Auth)
- ✅ Sincronizando em tempo real (Supabase Realtime)
- ✅ Hospedado em HTTPS (Netlify)
- ✅ Escalável (banco de dados PostgreSQL no Supabase)

## Credenciais Importantes

> ⚠️ Nunca compartilhe a "Service Role Key" (chave privada)
> A "Anon public key" é segura; ela está em `supabase-config.js` de propósito

Guarde em local seguro:
- URL do projeto Supabase
- Database password (se precisar acessar via psql)
- URL do repositório GitHub
- URL do site no Netlify

## Suporte

Se tiver problemas, verifique:
1. `supabase-config.js` tem as credenciais corretas?
2. SQL schema rodou sem erros?
3. Realtime está habilitado na tabela `mensagens`?
4. Site URL no Supabase está correto?
