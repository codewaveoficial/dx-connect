from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.atendente import Atendente
from app.core.security import decodificar_token

security = HTTPBearer(auto_error=False)


def obter_atendente_atual(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> Atendente:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token não informado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decodificar_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
        )
    email = payload["sub"]
    atendente = db.query(Atendente).filter(Atendente.email == email, Atendente.ativo.is_(True)).first()
    if not atendente:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado ou inativo",
        )
    return atendente


def exigir_admin(atendente: Atendente = Depends(obter_atendente_atual)) -> Atendente:
    if atendente.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a administradores")
    return atendente
