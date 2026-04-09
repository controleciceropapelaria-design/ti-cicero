# 🖥️ TI-CICERO - Sistema de Gerenciamento de Ativos e Chamados

Sistema web completo para gerenciar e controlar ativos de TI, com sistema integrado de chamados para colaboradores e administradores.

## ✨ Funcionalidades Principais

### 📊 Dashboard
- **Visão Geral** — Cards com métricas principais
- **Total de Ativos** — Quantidade de equipamentos cadastrados
- **Ativos em Uso** — Equipamentos alocados nos setores
- **Disponíveis** — Equipamentos em estoque prontos para alocação
- **Chamados Abertos** — Solicitações aguardando atendimento
- **Gráficos** — Resumos por setor, categoria e status de chamados

### 🎫 Sistema de Chamados
**Para Colaboradores:**
- ✅ Abrir novos chamados
- ✅ Descrever problemas e solicitações
- ✅ Definir nível de prioridade (Baixa, Média, Alta, Crítica)
- ✅ Acompanhar status do chamado

**Para Admin/TI:**
- ✅ Visualizar todos os chamados
- ✅ Filtrar por status ou prioridade
- ✅ Gerenciar chamados (responder, atualizar status)
- ✅ Atribuir responsáveis
- ✅ Fechar chamados resolvidos

**Status dos Chamados:**
- 🔴 **Aberto** — Novo chamado recebido
- 🔵 **Em Andamento** — Sendo atendido
- 🟡 **Aguardando Suporte** — Aguarda resposta do usuário
- 🟢 **Fechado** — Problema resolvido

### 📦 Controle de Ativos
- **Cadastro de Equipamentos** — Computadores, monitores, periféricos, rede, etc.
- **Organização por Setor** — Visualize quem tem o quê
- **Status do Ativo** — Disponível, Em Uso, Manutenção, Descarte
- **Rastreamento de Valor** — Controle financeiro do equipamento
- **Importação de CSV/Excel** — Carregue múltiplos ativos de uma vez

**Categorias Suportadas:**
- 💻 Computador (Desktop, Notebook, etc.)
- 🖥️ Monitor
- 🖱️ Periférico (Mouse, Teclado, Headset, etc.)
- 🖨️ Rede/Impressora (Switch, Roteador, AP, Impressora, etc.)
- ⚡ Fonte e Energia (Nobreak, Estabilizador, etc.)

### 📈 Gerenciamento de Estoque
- **Visualização de Disponíveis** — Quais equipamentos podem ser alocados
- **Alocação Rápida** — Atribua equipamento a um setor
- **Filtros** — Busque por tipo de equipamento
- **Cards Informativos** — Informações completas de cada item

### 🏢 Gerenciamento de Setores
- **Resumo por Setor** — Visualize quantos ativos cada setor tem
- **Equipamentos em Uso** — Rastreie o que está alocado
- **Disponibilidade** — Veja quanto tem em estoque

**Setores Pré-configurados:**
- Administrativo
- Financeiro
- Logística
- Operacional
- TI
- Vendas
- Finalização

## 🚀 Como Usar

### 1. Abrir o Sistema

```
file:///c:/Users/aryan/OneDrive/Área de Trabalho/TI-CICERO/index.html
```

### 2. Dashboard
- Primeira página ao entrar
- Mostra resumo geral do sistema
- Clique em qualquer menu para acessar funcionalidade específica

### 3. Abrir um Chamado (Colaborador)

1. Clique em **"🎫 Chamados"** no menu lateral
2. Clique em **"+ Abrir Chamado"**
3. Preencha:
   - Nome
   - Email
   - Título do chamado
   - Descrição detalhada
   - Prioridade
4. Clique **"Abrir Chamado"**

**Seu chamado receberá um ID** (ex: CH-00001) para referência.

### 4. Gerenciar Chamados (Admin)

1. Acesse **"🎫 Chamados"**
2. **Filtrar por Status** ou buscar por ID
3. Clique em **"👁️ Ver"** no chamado desejado
4. Atualize:
   - Status (Aberto → Em Andamento → Fechado)
   - Responsável
   - Resposta/Comentário
5. Clique **"Atualizar Chamado"**

### 5. Cadastrar Ativos

#### Manualmente:
1. Vá para **"📦 Ativos"**
2. Clique **"+ Novo Ativo"**
3. Preencha os dados
4. Clique **"Salvar Ativo"**

#### Via Importação de CSV/Excel:
1. Prepare seu arquivo com as colunas:
   ```
   SETOR,CODIGO,ITEM,CATEGORIA
   Administrativo,TI-PC-001,Desktop Dell,COMPUTADOR
   ```
2. Clique **"📥 Importar CSV"**
3. Selecione o arquivo
4. Sistema importará automaticamente

### 6. Consultar Estoque

1. Acesse **"📈 Estoque"**
2. Visualize equipamentos disponíveis
3. Clique **"Alocar"** para atribuir a um setor

### 7. Visualizar Setores

1. Acesse **"🏢 Setores"**
2. Veja resumo de cada setor:
   - Total de equipamentos
   - Equipamentos em uso
   - Disponíveis em estoque

## 🎨 Cores e Badges

### Status de Chamados
- 🔴 **Aberto** — Vermelho
- 🔵 **Em Andamento** — Azul
- 🟡 **Aguardando** — Amarelo
- 🟢 **Fechado** — Verde

### Prioridade de Chamados
- 🟢 **Baixa** — Verde
- 🟡 **Média** — Amarelo
- 🔴 **Alta** — Vermelho
- 🟣 **Crítica** — Roxo

### Status de Ativos
- 🟢 **Disponível** — Verde (em estoque)
- 🔵 **Em Uso** — Azul (alocado)
- 🟡 **Manutenção** — Amarelo (fora de operação)
- ⚫ **Descarte** — Cinza (inativo)

## 💾 Dados

- **Armazenamento**: LocalStorage do navegador
- **Persistência**: Dados salvos automaticamente
- **Sincronização**: Não requer servidor
- **Backup**: Exporte dados em JSON

## 🌟 Recursos Avançados

### Filtros Inteligentes
- Busca por texto em qualquer tabela
- Filtros por status, categoria, setor
- Ordenação automática

### Responsividade
- Desktop (1400px+)
- Tablet (768px - 1024px)
- Mobile (<768px)

### Tema Escuro Profissional
- Design Shadcn
- Fácil na vista
- Otimizado para trabalho prolongado

## 📋 Casos de Uso

### Cenário 1: Colaborador precisa de novo computador
1. Abre chamado: "Preciso de novo computador para o projeto X"
2. TI recebe chamado
3. TI vai para Estoque, vê computadores disponíveis
4. TI aloca um computador ao setor do colaborador
5. TI fecha o chamado com resposta: "Computador alocado"

### Cenário 2: Inventário de equipamentos
1. Admin importa lista de todos os equipamentos via CSV
2. Dashboard mostra total de ativos
3. Setores mostra distribuição
4. Estoque mostra o que pode ser alocado

### Cenário 3: Manutenção de equipamento
1. Admin marca equipamento como "Manutenção"
2. Sistema remove da contagem de disponíveis
3. Quando concluído, marca como "Disponível" novamente

## 🔐 Segurança

- Dados armazenados localmente (no navegador do usuário)
- Sem transmissão para servidores externos
- Sem login necessário (simples)
- Recomendado para redes internas

## 🚀 Próximos Passos

- [ ] Adicionar autenticação de usuários
- [ ] Integrar com BD (MySQL/MongoDB)
- [ ] API REST para integração com outros sistemas
- [ ] Notificações por email para chamados
- [ ] Relatórios em PDF
- [ ] Histórico de alterações de ativos

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato com o setor de TI.

---

**Versão**: 2.0  
**Última atualização**: 01/04/2026  
**Desenvolvido para**: Gerenciamento de Ativos e Chamados de TI
