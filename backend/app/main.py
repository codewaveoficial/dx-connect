import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import auth, redes, empresas, setores, atendentes, funcionarios_rede, status_ticket, tickets, dashboard, audit, tipo_negocio
from app.database import Base, engine, get_db
from app import models  # carrega todos os models para create_all
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    _ = models  # garante que as tabelas estão no metadata
    Base.metadata.create_all(bind=engine)
    try:
        from app.seed import run_seed
        run_seed()
    except Exception:
        pass  # DB pode ainda não estar acessível no primeiro start
    # Garante que colunas adicionadas ao modelo Empresa existem na tabela (DB criado com schema antigo)
    try:
        from sqlalchemy import text
        colunas_empresas = [
            "tipo_negocio_id INTEGER REFERENCES tipos_negocio(id)",
            "cnpj_cpf VARCHAR(18)",
            "razao_social VARCHAR(255)",
            "nome_fantasia VARCHAR(255)",
            "inscricao_estadual VARCHAR(20)",
            "endereco VARCHAR(255)",
            "numero VARCHAR(20)",
            "complemento VARCHAR(100)",
            "bairro VARCHAR(100)",
            "cidade VARCHAR(100)",
            "estado VARCHAR(2)",
            "cep VARCHAR(10)",
            "email VARCHAR(255)",
            "telefone VARCHAR(20)",
        ]
        with engine.begin() as conn:
            for col in colunas_empresas:
                try:
                    conn.execute(text(f"ALTER TABLE empresas ADD COLUMN IF NOT EXISTS {col}"))
                except Exception:
                    pass
    except Exception:
        pass
    yield


logger = logging.getLogger(__name__)


app = FastAPI(
    title="DX Connect API",
    description="API do sistema de tickets e suporte",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Captura exceções não tratadas, loga o traceback e retorna 500 com mensagem amigável."""
    logger.exception("Exceção não tratada: %s %s - %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Não foi possível concluir a ação. Tente novamente ou contate o suporte."},
    )

app.include_router(auth.router)
app.include_router(redes.router)
app.include_router(empresas.router)
app.include_router(setores.router)
app.include_router(atendentes.router)
app.include_router(funcionarios_rede.router)
app.include_router(status_ticket.router)
app.include_router(tickets.router)
app.include_router(dashboard.router)
app.include_router(audit.router)
app.include_router(tipo_negocio.router)


@app.get("/health")
def health():
    return {"status": "ok"}
