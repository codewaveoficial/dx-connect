"""Seed inicial: status de ticket e usuário admin (se não existir)."""
from sqlalchemy import func

import bcrypt

from app.database import SessionLocal
from app.models import StatusTicket, Atendente


def _hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _ensure_status_aguardando_atendimento(db):
    """Garante o status inicial da fila (ticket sem responsável, visível ao setor)."""
    if db.query(StatusTicket).filter(StatusTicket.slug == "aguardando_atendimento").first():
        return
    for row in db.query(StatusTicket).order_by(StatusTicket.ordem.desc()).all():
        row.ordem = int(row.ordem) + 1
    db.add(
        StatusTicket(
            nome="Aguardando atendimento",
            slug="aguardando_atendimento",
            ordem=1,
            ativo=True,
        )
    )
    db.commit()
    print("Status «Aguardando atendimento» adicionado (fila do setor).")


def run_seed():
    db = SessionLocal()
    try:
        if db.query(StatusTicket).count() == 0:
            for ordem, (nome, slug) in enumerate(
                [
                    ("Aguardando atendimento", "aguardando_atendimento"),
                    ("Em atendimento", "em_atendimento"),
                    ("Aguardando cliente", "aguardando_cliente"),
                    ("Resolvido", "resolvido"),
                    ("Fechado", "fechado"),
                ],
                start=1,
            ):
                db.add(StatusTicket(nome=nome, slug=slug, ordem=ordem, ativo=True))
            db.commit()
            print("Status de ticket criados.")
        else:
            _ensure_status_aguardando_atendimento(db)

        if db.query(Atendente).filter(func.lower(Atendente.email) == "admin@email.com").count() == 0:
            db.add(Atendente(
                email="admin@email.com",
                nome="Administrador",
                senha_hash=_hash_senha("admin123"),
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
        a.senha_hash = _hash_senha(senha)
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
