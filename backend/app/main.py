import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import auth, redes, empresas, setores, atendentes, funcionarios_rede, status_ticket, tickets, dashboard, audit, tipo_negocio
from app.database import Base, engine
from app import models  # carrega todos os models para create_all
from app.config import settings


def _configure_logging() -> None:
    level = getattr(logging, settings.LOG_LEVEL, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )
    for name in ("uvicorn", "uvicorn.access", "uvicorn.error"):
        logging.getLogger(name).setLevel(level)


_configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    _ = models  # garante que as tabelas estão no metadata
    Base.metadata.create_all(bind=engine)
    try:
        from app.seed import run_seed
        run_seed()
    except Exception as e:
        logger.warning("Seed inicial não concluído (tente reiniciar o backend ou rodar python -m app.seed): %s", e)
    # Tickets antigos: primeira linha do tempo a partir de descrição legada
    try:
        from app.models.ticket import Ticket, TicketMensagem
        from app.database import SessionLocal

        s = SessionLocal()
        try:
            for t in s.query(Ticket).all():
                n = s.query(TicketMensagem).filter(TicketMensagem.ticket_id == t.id).count()
                if n == 0:
                    body = (t.descricao or "").strip() or (
                        "(Abertura sem texto adicional — registro anterior ao histórico de mensagens.)"
                    )
                    s.add(TicketMensagem(ticket_id=t.id, atendente_id=None, tipo="abertura", corpo=body))
            s.commit()
        except Exception as ex:
            logger.warning("Backfill ticket_mensagens: %s", ex)
            s.rollback()
        finally:
            s.close()
    except Exception as ex:
        logger.warning("Backfill ticket_mensagens (import): %s", ex)
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


_docs_kw = {}
if settings.is_production:
    _docs_kw = {"docs_url": None, "redoc_url": None, "openapi_url": None}

app = FastAPI(
    title="DX Connect API",
    description="API do sistema de tickets e suporte",
    version="0.1.0",
    lifespan=lifespan,
    **_docs_kw,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list(),
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
