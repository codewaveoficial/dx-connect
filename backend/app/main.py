from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, redes, empresas, setores, atendentes, funcionarios_rede, status_ticket, tickets, dashboard
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
    yield


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

app.include_router(auth.router)
app.include_router(redes.router)
app.include_router(empresas.router)
app.include_router(setores.router)
app.include_router(atendentes.router)
app.include_router(funcionarios_rede.router)
app.include_router(status_ticket.router)
app.include_router(tickets.router)
app.include_router(dashboard.router)


@app.get("/health")
def health():
    return {"status": "ok"}
