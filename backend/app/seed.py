"""Seed inicial: status de ticket e usuário admin (se não existir)."""
from app.database import SessionLocal
from app.models import StatusTicket, Atendente
from app.core.security import hash_senha


def run_seed():
    db = SessionLocal()
    try:
        if db.query(StatusTicket).count() == 0:
            for ordem, (nome, slug) in enumerate([
                ("Aberto", "aberto"),
                ("Em atendimento", "em_atendimento"),
                ("Aguardando cliente", "aguardando_cliente"),
                ("Resolvido", "resolvido"),
                ("Fechado", "fechado"),
            ], start=1):
                db.add(StatusTicket(nome=nome, slug=slug, ordem=ordem, ativo=True))
            db.commit()
            print("Status de ticket criados.")

        if db.query(Atendente).filter(Atendente.email == "admin@email.com").count() == 0:
            db.add(Atendente(
                email="admin@email.com",
                nome="Administrador",
                senha_hash=hash_senha("admin123"),
                role="admin",
                ativo=True,
            ))
            db.commit()
            print("Usuário admin criado: admin@email.com / admin123")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
