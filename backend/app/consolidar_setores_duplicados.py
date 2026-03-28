"""
Consolida setores com o mesmo nome (trim + case-insensitive).

Mantém sempre o registro de **menor id** no grupo; os demais são excluídos após:
  - atualizar `tickets.setor_id` para o id mantido;
  - migrar `atendente_setor` para o id mantido (sem duplicar vínculos).

Uso (pasta backend, com DATABASE_URL apontando para o banco):
  python -m app.consolidar_setores_duplicados
  python -m app.consolidar_setores_duplicados --dry-run
"""

from __future__ import annotations

import argparse
from collections import defaultdict

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Setor, Ticket


def consolidar_setores_duplicados(db: Session, *, dry_run: bool = False) -> dict:
    """
    Retorna estatísticas: grupos processados, setores removidos, tickets atualizados, vínculos migrados.
    """
    rows = db.query(Setor).order_by(Setor.id).all()
    groups: dict[str, list[Setor]] = defaultdict(list)
    for s in rows:
        key = (s.nome or "").strip().lower()
        groups[key].append(s)

    stats = {
        "grupos_com_duplicata": 0,
        "setores_removidos": 0,
        "tickets_atualizados": 0,
        "vinculos_atendentes_migrados": 0,
    }

    for nome_key in sorted(groups.keys()):
        lst = groups[nome_key]
        if len(lst) < 2:
            continue
        stats["grupos_com_duplicata"] += 1
        lst.sort(key=lambda x: x.id)
        keeper = lst[0]
        losers = lst[1:]

        label = nome_key if nome_key else "(nome vazio)"
        loser_ids = [x.id for x in losers]
        loser_slugs = [x.slug for x in losers]
        print(
            f'Grupo "{label}": manter id={keeper.id} slug={keeper.slug!r}; '
            f"remover ids={loser_ids} slugs={loser_slugs}",
        )

        if dry_run:
            continue

        for L in losers:
            n_t = (
                db.query(Ticket)
                .filter(Ticket.setor_id == L.id)
                .update({Ticket.setor_id: keeper.id}, synchronize_session=False)
            )
            stats["tickets_atualizados"] += n_t
            if n_t:
                print(f"  tickets: setor_id {L.id} -> {keeper.id} ({n_t} linha(s))")

            r_ids = db.execute(
                text("SELECT atendente_id FROM atendente_setor WHERE setor_id = :sid"),
                {"sid": L.id},
            ).fetchall()
            att_ids = [row[0] for row in r_ids]

            for aid in att_ids:
                tem_keeper = db.execute(
                    text(
                        "SELECT 1 FROM atendente_setor WHERE atendente_id = :a AND setor_id = :k LIMIT 1",
                    ),
                    {"a": aid, "k": keeper.id},
                ).first()
                if not tem_keeper:
                    db.execute(
                        text(
                            "INSERT INTO atendente_setor (atendente_id, setor_id) VALUES (:a, :k)",
                        ),
                        {"a": aid, "k": keeper.id},
                    )
                    stats["vinculos_atendentes_migrados"] += 1
                    print(f"  atendente {aid}: vínculo {L.id} -> {keeper.id}")
                db.execute(
                    text(
                        "DELETE FROM atendente_setor WHERE atendente_id = :a AND setor_id = :l",
                    ),
                    {"a": aid, "l": L.id},
                )

            db.query(Setor).filter(Setor.id == L.id).delete(synchronize_session=False)
            stats["setores_removidos"] += 1
            print(f"  setor id={L.id} excluído")

        db.commit()

    return stats


def main() -> None:
    p = argparse.ArgumentParser(description="Consolidar setores duplicados por nome")
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Só mostra o que seria feito, sem alterar o banco",
    )
    args = p.parse_args()
    db = SessionLocal()
    try:
        st = consolidar_setores_duplicados(db, dry_run=args.dry_run)
        print("---")
        print(f"Resumo: {st}")
        if args.dry_run and st["grupos_com_duplicata"] > 0:
            print("Execute sem --dry-run para aplicar.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
