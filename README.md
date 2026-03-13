## DX Connect

Ferramenta interna de controle de tickets voltada para redes de postos/empresas, com visão separada por **rede**, **empresa** e **funcionários da rede**, preparada para integração futura com API de WhatsApp.

### Tecnologias

- **Backend**: FastAPI (Python), SQLAlchemy, JWT
- **Banco de dados**: PostgreSQL (via Docker Compose)
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Infra de desenvolvimento**:
  - Backend e banco sobem em containers Docker
  - Frontend roda em modo dev (Vite) consumindo o backend via proxy (`/api`)

### Principais funcionalidades

- **Autenticação e autorização**
  - Login de atendentes com JWT
  - Perfis: **admin** e **atendente**
  - Primeiro usuário admin criado automaticamente pelo seed:
    - E-mail: `admin@email.com`
    - Senha: `admin123`

- **Clientes**
  - **Redes**: cadastro de redes com visão detalhada
  - **Empresas**: vinculadas a uma rede
  - **Funcionários da rede**:
    - **Sócio**: vinculado à rede
    - **Supervisor**: vinculado a várias empresas
    - **Colaborador**: vinculado a uma empresa

- **Configurações**
  - **Setores**: ex.: suporte, financeiro etc.
  - **Atendentes**: usuários internos, com relacionamento N:N com setores
  - **Status de ticket**: totalmente configuráveis e com seed inicial (Aberto, Em atendimento, etc.)

- **Tickets**
  - Abertura de ticket vinculando empresa, setor, status e atendente
  - Histórico de alterações de status
  - Dashboard com:
    - Total de tickets
    - Tickets abertos hoje
    - Quantidade por status
    - Últimos tickets

### Estrutura do projeto

```text
dx-connect/
  backend/
    app/
      api/           # Rotas FastAPI
      models/        # Models SQLAlchemy
      schemas/       # Schemas Pydantic
      core/          # Auth, segurança, config
      seed.py        # Seed inicial (status + usuário admin)
  frontend/
    src/
      pages/         # Telas (Dashboard, Tickets, Redes, etc.)
      components/    # Layout, Sidebar, componentes de UI
      api/           # Cliente HTTP tipado
  docker-compose.yml # PostgreSQL + backend
```

### Como rodar em desenvolvimento

Pré‑requisitos:

- Docker e Docker Compose
- Node 18+ e npm

1. **Subir backend + banco**:

```bash
cd backend/..
docker compose up -d
```

O backend ficará acessível em `http://localhost:8000`.

2. **Rodar o frontend em modo dev**:

```bash
cd frontend
npm install
npm run dev
```

O frontend ficará acessível em `http://localhost:5173`.

3. **Login inicial**

- Acesse `http://localhost:5173/login`
- Use:
  - E-mail: `admin@email.com`
  - Senha: `admin123`

### Scripts úteis

No **backend** (a partir da pasta `backend`):

- Aplicar seed manualmente:

```bash
python -m app.seed
```

No **frontend** (a partir da pasta `frontend`):

- Rodar em desenvolvimento:

```bash
npm run dev
```

- Build de produção:

```bash
npm run build
```

### Licença

Este projeto está licenciado sob os termos da licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.

# DX Connect

Sistema de controle de tickets interno, com suporte a rede de empresas, setores e funcionários (sócio, supervisor, colaborador).

## Estrutura

- **backend/** – API FastAPI (Python)
- **frontend/** – React + Vite + Tailwind (rodar fora do Docker em desenvolvimento)

## Desenvolvimento

### Pré-requisitos

- Docker Desktop (PostgreSQL + API em containers)
- Node.js (frontend local com hot reload)

### 1. Subir banco e API

```bash
docker compose up -d
```

- PostgreSQL: `localhost:5432` (usuário: `dxconnect`, senha: `dxconnect_secret`, DB: `dxconnect`)
- API: http://localhost:8000  
- Docs: http://localhost:8000/docs

No primeiro start, a API cria as tabelas e o seed: status de ticket e usuário admin.

**Login padrão (após seed):**
- E-mail: `admin@dxconnect.local`
- Senha: `admin123`

### 2. Frontend (local, com hot reload)

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173  
- As requisições para `/api/*` são proxy para `http://localhost:8000`.

### 3. Ordem sugerida de uso

1. Fazer login com o admin.
2. Cadastrar **Redes** e **Empresas** (uma empresa pertence a uma rede).
3. Cadastrar **Setores** (ex.: Suporte, Financeiro).
4. Cadastrar **Atendentes** (vincule setores aos atendentes; admin não precisa de setor).
5. Cadastrar **Funcionários da rede** (sócio, supervisor, colaborador), se quiser.
6. Abrir e gerenciar **Tickets** (lista, filtros, detalhe, alterar status e atendente).

## Produção

- Build do frontend: `cd frontend && npm run build`
- Servir o `dist/` com nginx ou similar e apontar a API para a URL do backend (variável `VITE_API_URL` no build).
