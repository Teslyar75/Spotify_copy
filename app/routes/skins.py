"""
Skins API — управление скинами плеера.

GET /api/skins — все скины (публичные + свои)
GET /api/skins/presets — встроенные preset-скины
GET /api/skins/{skin_id} — детали скина
POST /api/skins — создать скин (требует авторизации)
PUT /api/skins/{skin_id} — обновить свой скин
DELETE /api/skins/{skin_id} — удалить свой скин
POST /api/skins/upload-image — загрузить изображение для скина
POST /api/skins/activate — установить активный скин
GET /api/skins/active — получить активный скин текущего пользователя
"""

import uuid
from pathlib import Path
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_id, get_optional_user_id
from app.models.skin import Skin
from app.models.user_profile import UserProfile
from app.models.skin_entitlement import SkinEntitlement
from app.models.promotion import Promotion
from app.models.stake import Stake
from app.image_processing import process_skin_image, validate_image_upload
from datetime import datetime, timedelta

router = APIRouter()

# Пути к папкам
MEDIA_DIR = Path(__file__).resolve().parent.parent.parent / "media"
SKINS_DIR = MEDIA_DIR / "skins"


def _ensure_dirs():
    """Создать папку media/skins если её нет."""
    SKINS_DIR.mkdir(parents=True, exist_ok=True)


# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────

class SkinResponse(BaseModel):
    id: UUID
    owner_id: Optional[UUID]
    name: str
    description: Optional[str]
    banner_url: Optional[str]
    background_url: Optional[str]
    thumbnail_url: Optional[str]
    button_style: str
    accent_color: Optional[str]
    accent_secondary: Optional[str]
    animation_type: str
    is_public: bool
    is_preset: bool
    
    class Config:
        from_attributes = True


class SkinCreate(BaseModel):
    name: str
    description: Optional[str] = None
    button_style: str = "round"
    animation_type: str = "none"
    is_public: bool = False


class SkinUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    button_style: Optional[str] = None
    animation_type: Optional[str] = None
    is_public: Optional[bool] = None


class ActivateSkinRequest(BaseModel):
    skin_id: Optional[UUID]  # None для сброса на default


class SupportSkinRequest(BaseModel):
    skin_id: UUID
    amount: float = 100.0  # Demo amount (не реальные деньги)


class PurchaseSkinRequest(BaseModel):
    skin_id: UUID


class CreatePromotionRequest(BaseModel):
    target_type: str  # artist, skin, track, bundle
    target_id: UUID
    stars_amount: int
    duration_hours: int = 24  # Длительность в часах


class CreateStakeRequest(BaseModel):
    target_type: str  # track, skin, bundle
    target_id: UUID
    stars_amount: int  # 1, 2, или 5


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@router.get("/presets", response_model=list[SkinResponse])
def get_preset_skins(db: Session = Depends(get_db)):
    """Получить список встроенных preset-скинов."""
    presets = db.query(Skin).filter(Skin.is_preset == True).all()
    return presets


@router.get("", response_model=list[SkinResponse])
def get_all_skins(
    user_id: Optional[UUID] = Depends(get_optional_user_id),
    db: Session = Depends(get_db)
):
    """
    Получить все доступные скины (маркетплейс).
    
    Для авторизованных: публичные скины
    Для гостей: только публичные
    """
    # Публичные скины (маркетплейс)
    skins = db.query(Skin).filter(Skin.is_public == True).order_by(
        Skin.is_preset.desc(), Skin.created_at.desc()
    ).all()
    
    return skins


@router.get("/library", response_model=list[SkinResponse])
def get_my_skin_library(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Получить библиотеку скинов пользователя.
    
    Включает:
    - Preset-скины (доступны всем)
    - Свои загруженные скины
    - Купленные/поддержанные скины
    """
    # Preset-скины доступны всем
    preset_skins = db.query(Skin).filter(Skin.is_preset == True).all()
    
    # Свои скины
    own_skins = db.query(Skin).filter(Skin.owner_id == user_id).all()
    
    # Купленные скины (через entitlements)
    entitlement_skin_ids = db.query(SkinEntitlement.skin_id).filter(
        SkinEntitlement.user_id == user_id
    ).all()
    entitlement_skin_ids = [ent[0] for ent in entitlement_skin_ids]
    
    purchased_skins = db.query(Skin).filter(Skin.id.in_(entitlement_skin_ids)).all() if entitlement_skin_ids else []
    
    # Объединяем и убираем дубликаты
    all_skins = {skin.id: skin for skin in (preset_skins + own_skins + purchased_skins)}
    
    return list(all_skins.values())


@router.get("/active", response_model=Optional[SkinResponse])
def get_active_skin(
    user_id: Optional[UUID] = Depends(get_optional_user_id),
    db: Session = Depends(get_db)
):
    """
    Получить активный скин текущего пользователя.
    Для гостей возвращает None (используется localStorage).
    """
    if not user_id:
        return None
    
    profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not profile or not profile.active_skin_id:
        return None
    
    skin = db.query(Skin).filter(Skin.id == profile.active_skin_id).first()
    return skin


@router.get("/{skin_id}", response_model=SkinResponse)
def get_skin(skin_id: UUID, db: Session = Depends(get_db)):
    """Получить детали конкретного скина."""
    skin = db.query(Skin).filter(Skin.id == skin_id).first()
    
    if not skin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skin not found"
        )
    
    return skin


@router.post("", response_model=SkinResponse, status_code=status.HTTP_201_CREATED)
def create_skin(
    skin_data: SkinCreate,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Создать новый скин."""
    skin = Skin(
        owner_id=user_id,
        name=skin_data.name,
        description=skin_data.description,
        button_style=skin_data.button_style,
        animation_type=skin_data.animation_type,
        is_public=skin_data.is_public,
        is_preset=False,
    )
    
    db.add(skin)
    db.commit()
    db.refresh(skin)
    
    return skin


@router.put("/{skin_id}", response_model=SkinResponse)
def update_skin(
    skin_id: UUID,
    skin_data: SkinUpdate,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Обновить свой скин."""
    skin = db.query(Skin).filter(Skin.id == skin_id).first()
    
    if not skin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skin not found"
        )
    
    if skin.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own skins"
        )
    
    # Обновляем поля
    if skin_data.name is not None:
        skin.name = skin_data.name
    if skin_data.description is not None:
        skin.description = skin_data.description
    if skin_data.button_style is not None:
        skin.button_style = skin_data.button_style
    if skin_data.animation_type is not None:
        skin.animation_type = skin_data.animation_type
    if skin_data.is_public is not None:
        skin.is_public = skin_data.is_public
    
    db.commit()
    db.refresh(skin)
    
    return skin


@router.delete("/{skin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skin(
    skin_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Удалить свой скин."""
    skin = db.query(Skin).filter(Skin.id == skin_id).first()
    
    if not skin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skin not found"
        )
    
    if skin.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own skins"
        )
    
    # Удаляем файлы изображений
    for url in [skin.banner_url, skin.background_url, skin.thumbnail_url]:
        if url:
            try:
                filepath = MEDIA_DIR / url.lstrip("/media/")
                if filepath.exists():
                    filepath.unlink()
            except Exception:
                pass
    
    db.delete(skin)
    db.commit()
    
    return None


@router.post("/upload-image")
def upload_skin_image(
    file: UploadFile = File(...),
    user_id: UUID = Depends(get_current_user_id),
):
    """
    Загрузить изображение для скина.
    
    Обрабатывает изображение и создаёт три варианта:
    - banner (1200x400) — для хедеров
    - background (800x800) — для now-playing
    - thumbnail (300x200) — для карточек
    
    Также извлекает доминантные цвета для акцентов.
    
    Returns:
        {
            "banner_url": "/media/skins/xxx-banner.webp",
            "background_url": "/media/skins/xxx-background.webp",
            "thumbnail_url": "/media/skins/xxx-thumbnail.webp",
            "accent_color": "#1DB954",
            "accent_secondary": "#1ed760"
        }
    """
    _ensure_dirs()
    
    # Читаем файл
    image_data = file.file.read()
    
    # Валидация
    if not validate_image_upload(image_data, max_size_mb=10):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image or file too large (max 10MB)"
        )
    
    # Обрабатываем изображение
    try:
        banner, background, thumbnail, dominant, secondary = process_skin_image(image_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image processing failed: {str(e)}"
        )
    
    # Генерируем уникальные имена файлов
    file_id = uuid.uuid4().hex
    banner_filename = f"{file_id}-banner.webp"
    background_filename = f"{file_id}-background.webp"
    thumbnail_filename = f"{file_id}-thumbnail.webp"
    
    # Сохраняем файлы
    (SKINS_DIR / banner_filename).write_bytes(banner)
    (SKINS_DIR / background_filename).write_bytes(background)
    (SKINS_DIR / thumbnail_filename).write_bytes(thumbnail)
    
    return {
        "banner_url": f"/media/skins/{banner_filename}",
        "background_url": f"/media/skins/{background_filename}",
        "thumbnail_url": f"/media/skins/{thumbnail_filename}",
        "accent_color": dominant,
        "accent_secondary": secondary,
    }


@router.post("/activate", response_model=SkinResponse)
def activate_skin(
    request: ActivateSkinRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Активировать скин для текущего пользователя.
    
    Если skin_id = None — сбросить на default.
    """
    profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    if request.skin_id:
        # Проверяем что скин существует и доступен
        skin = db.query(Skin).filter(Skin.id == request.skin_id).first()
        
        if not skin:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Skin not found"
            )
        
        # Проверяем доступность (публичный или свой)
        if not skin.is_public and skin.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This skin is not accessible"
            )
        
        profile.active_skin_id = request.skin_id
    else:
        # Сброс на default
        profile.active_skin_id = None
    
    db.commit()
    db.refresh(profile)
    
    # Возвращаем активный скин или default preset
    if profile.active_skin_id:
        return db.query(Skin).filter(Skin.id == profile.active_skin_id).first()
    else:
        # Возвращаем первый preset
        return db.query(Skin).filter(Skin.is_preset == True).first()


@router.post("/purchase")
def purchase_skin(
    request: PurchaseSkinRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Купить/разблокировать скин за звёзды (demo, не реальные деньги).
    
    Создаёт entitlement запись и добавляет скин в библиотеку пользователя.
    """
    profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    skin = db.query(Skin).filter(Skin.id == request.skin_id).first()
    if not skin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skin not found"
        )
    
    # Проверяем что у пользователя достаточно звёзд
    if profile.stars_balance < skin.price_stars:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недостаточно звёзд. Нужно: {skin.price_stars}, есть: {profile.stars_balance}"
        )
    
    # Проверяем что скин ещё не куплен
    existing = db.query(SkinEntitlement).filter(
        SkinEntitlement.user_id == user_id,
        SkinEntitlement.skin_id == request.skin_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Скин уже куплен"
        )
    
    # Списываем звёзды
    profile.stars_balance -= skin.price_stars
    
    # Создаём entitlement
    entitlement = SkinEntitlement(
        user_id=user_id,
        skin_id=request.skin_id,
        amount=skin.price_stars
    )
    db.add(entitlement)
    
    # Увеличиваем total_supports скина
    skin.total_supports += skin.price_stars
    
    db.commit()
    
    return {"success": True, "stars_balance": profile.stars_balance}


@router.get("/promoted")
def get_promoted_content(db: Session = Depends(get_db)):
    """
    Получить активные продвигаемые элементы (полка «Продвигается»).
    """
    now = datetime.utcnow()
    
    promotions = db.query(Promotion).filter(
        Promotion.starts_at <= now,
        Promotion.ends_at >= now
    ).order_by(Promotion.created_at.desc()).limit(20).all()
    
    result = []
    for promo in promotions:
        item = {
            "promotion_id": promo.id,
            "target_type": promo.target_type,
            "target_id": promo.target_id,
            "stars_spent": promo.stars_spent,
            "ends_at": promo.ends_at
        }
        
        # Добавляем детали объекта
        if promo.target_type == "skin":
            skin = db.query(Skin).filter(Skin.id == promo.target_id).first()
            if skin:
                item["skin"] = SkinResponse.from_orm(skin)
        elif promo.target_type == "artist":
            profile = db.query(UserProfile).filter(UserProfile.id == promo.target_id).first()
            if profile:
                item["artist"] = {
                    "id": profile.id,
                    "username": profile.username,
                    "avatar_url": profile.avatar_url
                }
        
        result.append(item)
    
    return result


@router.post("/promote")
def create_promotion(
    request: CreatePromotionRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Создать продвижение контента за звёзды.
    """
    profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # Проверяем баланс
    if profile.stars_balance < request.stars_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недостаточно звёзд"
        )
    
    # Списываем звёзды
    profile.stars_balance -= request.stars_amount
    
    # Создаём promotion
    now = datetime.utcnow()
    promotion = Promotion(
        owner_id=user_id,
        target_type=request.target_type,
        target_id=request.target_id,
        stars_spent=request.stars_amount,
        starts_at=now,
        ends_at=now + timedelta(hours=request.duration_hours)
    )
    db.add(promotion)
    db.commit()
    db.refresh(promotion)
    
    return {"success": True, "promotion_id": promotion.id, "stars_balance": profile.stars_balance}


@router.post("/stake")
def create_stake(
    request: CreateStakeRequest,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Сделать ставку на контент (1, 2, или 5 звёзд).
    """
    if request.stars_amount not in [1, 2, 5]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ставка может быть только 1, 2, или 5 звёзд"
        )
    
    profile = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    
    # Проверяем баланс
    if profile.stars_balance < request.stars_amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Недостаточно звёзд"
        )
    
    # Списываем звёзды
    profile.stars_balance -= request.stars_amount
    
    # Создаём ставку
    stake = Stake(
        user_id=user_id,
        target_type=request.target_type,
        target_id=request.target_id,
        stars_amount=request.stars_amount,
        payout_status="pending"
    )
    db.add(stake)
    db.commit()
    db.refresh(stake)
    
    return {"success": True, "stake_id": stake.id, "stars_balance": profile.stars_balance}
