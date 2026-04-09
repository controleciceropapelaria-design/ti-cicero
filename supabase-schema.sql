-- ============================================
-- TI-CICERO Supabase Schema
-- Copiar tudo e rodar no Supabase SQL Editor
-- ============================================

-- -----------------------------------------------
-- PROFILES (estende auth.users, armazena role)
-- -----------------------------------------------
CREATE TABLE public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome        TEXT NOT NULL,
    email       TEXT NOT NULL,
    setor       TEXT,
    role        TEXT NOT NULL DEFAULT 'colaborador'
                CHECK (role IN ('admin', 'colaborador')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-insert profile ao criar user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, nome, email, setor, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'setor',
        COALESCE(NEW.raw_user_meta_data->>'role', 'colaborador')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------
-- SETORES
-- -----------------------------------------------
CREATE TABLE public.setores (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome        TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed: setores padrão
INSERT INTO public.setores (nome) VALUES
    ('Administrativo'),
    ('Financeiro'),
    ('Logística'),
    ('Operacional'),
    ('TI'),
    ('Vendas'),
    ('Finalização');

-- -----------------------------------------------
-- CHAMADOS
-- -----------------------------------------------
CREATE TABLE public.chamados (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo          TEXT NOT NULL UNIQUE,
    user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nome            TEXT NOT NULL,
    email           TEXT NOT NULL,
    titulo          TEXT NOT NULL,
    descricao       TEXT NOT NULL,
    prioridade      TEXT NOT NULL DEFAULT 'media'
                    CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
    status          TEXT NOT NULL DEFAULT 'aberto'
                    CHECK (status IN ('aberto', 'em_andamento', 'aguardando', 'fechado')),
    responsavel     TEXT,
    resposta        TEXT,
    tipo_chamado    TEXT
                    CHECK (tipo_chamado IN ('e_millennium', 'infra_ti', 'integracao_terceiros', '')),
    campo_extra     TEXT,
    token           TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER chamados_updated_at
    BEFORE UPDATE ON public.chamados
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sequência para gerar códigos CH-00001, CH-00002, etc
CREATE SEQUENCE chamado_seq START 1;

CREATE OR REPLACE FUNCTION public.next_chamado_codigo()
RETURNS TEXT
LANGUAGE sql AS $$
    SELECT 'CH-' || LPAD(nextval('chamado_seq')::text, 5, '0');
$$;

-- -----------------------------------------------
-- MENSAGENS (antes era array dentro chamados)
-- -----------------------------------------------
CREATE TABLE public.mensagens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chamado_id  UUID NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    remetente   TEXT NOT NULL CHECK (remetente IN ('admin', 'colaborador')),
    nome        TEXT NOT NULL,
    texto       TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mensagens_chamado_id ON public.mensagens(chamado_id);

-- -----------------------------------------------
-- ATIVOS
-- -----------------------------------------------
CREATE TABLE public.ativos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo          TEXT NOT NULL UNIQUE,
    descricao       TEXT NOT NULL,
    setor           TEXT NOT NULL,
    categoria       TEXT NOT NULL
                    CHECK (categoria IN ('computador', 'notebook', 'monitor', 'periferico', 'rede_impressora', 'fonte_energia')),
    status          TEXT NOT NULL DEFAULT 'disponivel'
                    CHECK (status IN ('disponivel', 'em_uso', 'manutencao', 'descarte')),
    valor           NUMERIC(10, 2) NOT NULL DEFAULT 0,
    specs           JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER ativos_updated_at
    BEFORE UPDATE ON public.ativos
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setores   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamados  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ativos    ENABLE ROW LEVEL SECURITY;

-- Helper: é admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- -----------------------------------------------
-- RLS: PROFILES
-- -----------------------------------------------
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_self" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "profiles_update_admin" ON public.profiles
    FOR UPDATE USING (public.is_admin());

-- -----------------------------------------------
-- RLS: SETORES
-- -----------------------------------------------
CREATE POLICY "setores_select" ON public.setores
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "setores_insert" ON public.setores
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "setores_update" ON public.setores
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "setores_delete" ON public.setores
    FOR DELETE USING (public.is_admin());

-- -----------------------------------------------
-- RLS: CHAMADOS
-- -----------------------------------------------
CREATE POLICY "chamados_select" ON public.chamados
    FOR SELECT USING (
        public.is_admin() OR user_id = auth.uid()
    );

CREATE POLICY "chamados_insert" ON public.chamados
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "chamados_update" ON public.chamados
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "chamados_delete" ON public.chamados
    FOR DELETE USING (public.is_admin());

-- -----------------------------------------------
-- RLS: MENSAGENS
-- -----------------------------------------------
CREATE POLICY "mensagens_select" ON public.mensagens
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.chamados
            WHERE chamados.id = mensagens.chamado_id
              AND chamados.user_id = auth.uid()
        )
    );

CREATE POLICY "mensagens_insert" ON public.mensagens
    FOR INSERT WITH CHECK (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.chamados
            WHERE chamados.id = mensagens.chamado_id
              AND chamados.user_id = auth.uid()
        )
    );

-- -----------------------------------------------
-- RLS: ATIVOS
-- -----------------------------------------------
CREATE POLICY "ativos_select" ON public.ativos
    FOR SELECT USING (public.is_admin());

CREATE POLICY "ativos_insert" ON public.ativos
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "ativos_update" ON public.ativos
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "ativos_delete" ON public.ativos
    FOR DELETE USING (public.is_admin());

-- ============================================
-- MIGRAÇÃO: Rodar se a tabela ativos já existir
-- ============================================
-- ALTER TABLE public.ativos ADD COLUMN IF NOT EXISTS specs JSONB;
-- ALTER TABLE public.ativos DROP CONSTRAINT IF EXISTS ativos_categoria_check;
-- ALTER TABLE public.ativos ADD CONSTRAINT ativos_categoria_check
--     CHECK (categoria IN ('computador', 'notebook', 'monitor', 'periferico', 'rede_impressora', 'fonte_energia'));

-- ============================================
-- REALTIME
-- ============================================
-- Rodar depois de criar o projeto (pode ser feito na UI também):
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens;

-- ============================================
-- APÓS PRIMEIRO LOGIN, RODAR:
-- ============================================
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'seu-email@dominio.com';
