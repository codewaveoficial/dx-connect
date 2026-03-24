"""Seed inicial: status de ticket e usuário admin (se não existir)."""
from sqlalchemy import func

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

        if db.query(Atendente).filter(func.lower(Atendente.email) == "admin@email.com").count() == 0:
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


def reset_senha_admin_padrao(senha: str = "admin123") -> bool:
    """Redefine a senha do usuário admin@email.com (útil após volume antigo ou seed falho)."""
    db = SessionLocal()
    try:
        a = db.query(Atendente).filter(func.lower(Atendente.email) == "admin@email.com").first()
        if not a:
            return False
        a.senha_hash = hash_senha(senha)
        db.commit()
        return True
    finally:
        db.close()


if __name__ == "__main__":
    import sys

    if "--reset-admin" in sys.argv:
        ok = reset_senha_admin_padrao()
        print("Senha do admin redefinida." if ok else "Nenhum admin@email.com encontrado.")
    else:
        run_seed()
