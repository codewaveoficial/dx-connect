"""Configuração Gunicorn + UvicornWorker (produção). Ajuste WEB_CONCURRENCY no ambiente."""
import multiprocessing
import os

bind = "0.0.0.0:8000"
_cpu = max(1, multiprocessing.cpu_count())
workers = int(os.environ.get("WEB_CONCURRENCY", str(min(_cpu * 2 + 1, 8))))
worker_class = "uvicorn.workers.UvicornWorker"
accesslog = "-"
errorlog = "-"
capture_output = True
# Atrás de reverse proxy (nginx, painel): confiar em X-Forwarded-* .
forwarded_allow_ips = "*"
