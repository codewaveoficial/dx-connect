"""Configuração Gunicorn + UvicornWorker (produção). Ajuste WEB_CONCURRENCY no ambiente."""
import multiprocessing
import os

bind = os.environ.get("GUNICORN_BIND", "0.0.0.0:8000")
_cpu = max(1, multiprocessing.cpu_count())
workers = int(os.environ.get("WEB_CONCURRENCY", str(min(_cpu * 2 + 1, 8))))
worker_class = "uvicorn.workers.UvicornWorker"
accesslog = "-"
errorlog = "-"
capture_output = True
# IPs do reverse proxy autorizados a enviar X-Forwarded-For / Proto. Não use "*" em produção.
# Docker: pode ser necessário incluir o gateway da bridge (ex.: 172.17.0.1) — defina GUNICORN_FORWARDED_ALLOW_IPS.
forwarded_allow_ips = os.environ.get("GUNICORN_FORWARDED_ALLOW_IPS", "127.0.0.1")
