# Nginx — exemplos para deploy

O **backend** já envia logs corretamente atrás de proxy (Gunicorn com `forwarded_allow_ips`). Estes ficheiros **não** são aplicados automaticamente: copie-os para o VPS e ajuste domínios e caminhos.

## Requisitos no VPS

1. Backend a escutar **só em localhost** (ex.: `127.0.0.1:8000` — padrão do `docker compose` ao mapear `8000:8000` continua acessível no host; para fechar à internet deixe o `-p` apenas se usar rede interna; o mais comum é `ports: - "127.0.0.1:8000:8000"` no compose de produção).
2. Variáveis do app: `CORS_ORIGINS` deve incluir a origem do frontend (ex.: `http://app.seudominio.com` durante testes HTTP, depois `https://...`).

## Instalação rápida (Debian/Ubuntu)

```bash
sudo apt update && sudo apt install -y nginx
sudo cp api.http.conf.example /etc/nginx/sites-available/dx-connect-api
sudo cp frontend.http.conf.example /etc/nginx/sites-available/dx-connect-app
# Editar server_name e root
sudo ln -sf /etc/nginx/sites-available/dx-connect-api /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/dx-connect-app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Testar em HTTP

- API: `curl -sS http://api.seudominio.com/health`
- App: abrir `http://app.seudominio.com` no browser e fazer login.

Depois ative **HTTPS** (Certbot ou certificado do painel) e atualize `CORS_ORIGINS`, `VITE_API_URL` e redirecionamentos `80 → 443`.

## Um domínio só (API + SPA)

Se quiser tudo no mesmo `server_name`, pode servir o `dist/` em `/` e fazer `location /api/` com `proxy_pass` — **neste projeto** a API não usa o prefixo `/api` nas rotas, seria preciso alinhar `proxy_pass` e o `VITE_API_URL`. O arranjo mais simples é **dois nomes**: `app.` e `api.`.
