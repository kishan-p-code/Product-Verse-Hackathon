from typing import Optional
from fastapi import Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.core.security import verify_token_payload
from backend.app.models.user import User

async def get_current_user(
    authorization: Optional[str] = Header(None),
    local_workspace: Optional[str] = Header(None, alias="X-UniPilot-Local"),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Return the signed-in user, or the single local workspace user.

    The desktop/local version of UniPilot intentionally has no sign-in screen.
    Its frontend identifies that mode with ``X-UniPilot-Local`` so the existing
    data routes can still use a real, stable SQLite owner instead of failing
    before their handlers run.  Normal requests retain the JWT requirement.
    """
    if local_workspace in {"student", "admin"}:
        result = await db.execute(
            select(User).where(User.email == "local-workspace@unipilot.app")
        )
        user = result.scalars().first()
        if user is None:
            user = User(
                email="local-workspace@unipilot.app",
                name="Local UniPilot Student",
                college="Local University",
                course="Student Workspace",
                semester="Local",
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        return user

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication is required.")

    token = authorization.removeprefix("Bearer ").strip()
    payload = await verify_token_payload(token)
    user_id = payload.get("sub") if payload else None
    if not user_id:
        raise HTTPException(status_code=401, detail="Your session is invalid or has expired. Please log in again.")

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=401, detail="This account no longer exists.")

    return user


async def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not authorization or not authorization.startswith('Bearer '):
        return None
    try:
        token = authorization.removeprefix('Bearer ').strip()
        payload = await verify_token_payload(token)
        user_id = payload.get('sub') if payload else None
        if not user_id:
            return None
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        return result.scalars().first()
    except Exception:
        return None
