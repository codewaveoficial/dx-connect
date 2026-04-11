# Manutenção e segurança (rotina)

## Dependências Python

- **`requirements.txt`** mantém versões fixas; antes de deploy relevante:
  - `pip install pip-audit` e `pip-audit -r requirements.txt`
  - Ou confiar no job **CI** (GitHub Actions) que executa o mesmo.
- **Dependabot** (`.github/dependabot.yml`) abre PRs semanais para o backend; revise changelog e testes antes de mergear.

## Dependências Node

- Na pasta `frontend`: `npm audit` (e `npm audit fix` quando fizer sentido).
- Dependabot cobre `package-lock.json`.

## CI

- Workflow `.github/workflows/ci.yml`: `pip-audit`, `npm audit`, `compileall`, build do frontend.
- Não substitui revisão de código nem ferramentas SAST avançadas; pode-se acrescentar CodeQL ou análise estática no GitHub conforme a política da equipa.

## Credenciais de desenvolvimento

As credenciais documentadas para **Docker local** (`admin@email.com` / `admin123`) são só para desenvolvimento. Em repositório **público** ou forks, assuma que qualquer pessoa as vê; nunca as use em produção.
