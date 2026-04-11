#!/usr/bin/env bash
# Backup lógico do PostgreSQL usando DATABASE_URL do backend/.env
# Requisitos no host: apt install -y postgresql-client python3
#
# Uso manual:
#   sudo /opt/dx-connect/deploy/scripts/backup-postgres.sh
#
# Cron (ex.: todos os dias às 03:00):
#   sudo crontab -e
#   0 3 * * * /opt/dx-connect/deploy/scripts/backup-postgres.sh >> /var/log/dx-connect-backup.log 2>&1

set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/dx-connect/backend/.env}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/dx-connect}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Ficheiro não encontrado: $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

DATABASE_URL="$(python3 "$SCRIPT_DIR/read_database_url.py" "$ENV_FILE")"
if [[ -z "$DATABASE_URL" ]]; then
  echo "DATABASE_URL vazio." >&2
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/dxconnect-${STAMP}.dump"

echo "[$(date -Iseconds)] Início backup -> $OUT"

pg_dump "$DATABASE_URL" -Fc -f "$OUT"

SIZE="$(du -h "$OUT" | cut -f1)"
echo "[$(date -Iseconds)] Concluído ($SIZE)"

find "$BACKUP_DIR" -name 'dxconnect-*.dump' -type f -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true
echo "[$(date -Iseconds)] Limpeza: ficheiros com mais de ${RETENTION_DAYS} dias removidos (se existirem)."
