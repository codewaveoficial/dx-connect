from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.atendente import Atendente
from app.schemas.atendente import AtendenteLogin, Token
from app.core.security import verificar_senha, criar_access_token
from app.core.login_protection import check_login_rate_limit, delay_on_auth_failure

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=Token)
async def login(request: Request, data: AtendenteLogin, db: Session = Depends(get_db)):
    check_login_rate_limit(request)
    email_login = data.email.strip().lower()
    atendente = (
        db.query(Atendente).filter(func.lower(Atendente.email) == email_login).first()
    )
    if not atendente or not atendente.ativo:
        await delay_on_auth_failure()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos")
    if not verificar_senha(data.senha, atendente.senha_hash):
        await delay_on_auth_failure()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="E-mail ou senha inválidos")
    token = criar_access_token(data={"sub": atendente.email})
    return Token(
        access_token=token,
        must_change_password=bool(getattr(atendente, "must_change_password", False)),
    )
