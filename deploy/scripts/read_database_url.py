#!/usr/bin/env python3
"""Lê DATABASE_URL de um ficheiro .env (uma linha KEY=value)."""
import sys


def main() -> None:
    path = sys.argv[1] if len(sys.argv) > 1 else "/opt/dx-connect/backend/.env"
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("DATABASE_URL="):
                v = line.split("=", 1)[1].strip().strip('"').strip("'")
                print(v, end="")
                return
    sys.exit("DATABASE_URL não encontrado em " + path)


if __name__ == "__main__":
    main()
