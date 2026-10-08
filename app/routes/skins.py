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
GET /api/skins/{skin_id}/banners — баннеры скина с учётом личных фото пользователя
POST /api/skins/{skin_id}/banners/{slot} — заменить баннер окна своим фото
DELETE /api/skins/{skin_id}/banners/{slot} — вернуть баннер темы
"""

import io
import uuid
from pathlib import Path
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from PIL import Image
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user_id, get_optional_user_id
from app.models.skin import Skin
from app.models.user_profile import UserProfile
from app.models.skin_entitlement import SkinEntitlement
from app.models.promotion import Promotion
from app.models.stake import Stake
from app.models.user_skin_banner import UserSkinBanner, BANNER_SLOTS
from app.image_processing import process_skin_image, resize_and_crop_image, validate_image_upload
from datetime import datetime, timedelta

router = APIRouter()

# Пути к папкам
MEDIA_DIR = Path(__file__).resolve().parent.parent.parent / "media"
SKINS_DIR = MEDIA_DIR / "skins"
USER_BANNERS_DIR = SKINS_DIR / "user"  # личные фото пользователей: /media/skins/user/<user_id>/...

STANDARD_SKIN_NAME = "Стандартный"  # оригинальные заголовки, редактировать нельзя
MAX_BANNER_MB = 10
ALLOWED_BANNER_FORMATS = {"JPEG", "PNG", "WEBP"}


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
    banners: Optional[dict] = None  # баннеры с учётом личных фото пользователя
    default_banners: Optional[dict] = None  # баннеры темы (без личных фото)
    custom_slots: list[str] = []  # окна, где стоит личное фото пользователя
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
# Личные баннеры пользователя (поверх баннеров темы)
# ──────────────────────────────────────────────

def _is_standard_skin(skin: Skin) -> bool:
    return bool(skin.is_preset) and skin.name == STANDARD_SKIN_NAME


def _load_overrides(db: Session, user_id: Optional[UUID], skin_ids) -> dict:
    """{skin_id: {slot: url}} личных фото пользователя для заданных скинов."""
    skin_ids = list(skin_ids)
    if not user_id or not skin_ids:
        return {}
    rows = db.query(UserSkinBanner).filter(
        UserSkinBanner.user_id == user_id,
        UserSkinBanner.skin_id.in_(skin_ids),
    ).all()
    result: dict = {}
    for row in rows:
        result.setdefault(row.skin_id, {})[row.slot] = row.url
    return result


def _to_response(skin: Skin, overrides: Optional[dict] = None) -> SkinResponse:
    """Скин для ответа: баннеры темы + личные фото (личное фото побеждает по слоту)."""
    data = SkinResponse.model_validate(skin)
    defaults = dict(skin.banners) if skin.banners else None
    overrides = overrides or {}
    merged = {**(defaults or {}), **overrides}
    return data.model_copy(update={
        "banners": merged or None,
        "default_banners": defaults,
        "custom_slots": [slot for slot in BANNER_SLOTS if slot in overrides],
    })


def _with_user_banners(db: Session, user_id: Optional[UUID], skins: list) -> list[SkinResponse]:
    overrides = _load_overrides(db, user_id, {skin.id for skin in skins})
    return [_to_response(skin, overrides.get(skin.id)) for skin in skins]


def _skin_for_user(db: Session, skin: Optional[Skin], user_id: Optional[UUID]) -> Optional[SkinResponse]:
    if not skin:
        return None
    return _to_response(skin, _load_overrides(db, user_id, [skin.id]).get(skin.id))


def _check_slot(slot: str) -> None:
    if slot not in BANNER_SLOTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неизвестное окно. Допустимо: home, search, library, player",
        )


def _get_editable_skin(db: Session, skin_id: UUID, user_id: UUID) -> Skin:
    skin = db.query(Skin).filter(Skin.id == skin_id).first()
    if not skin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Скин не найден")
    if _is_standard_skin(skin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Скин «Стандартный» нельзя редактировать — выберите тематический скин",
        )
    if not (skin.is_preset or skin.is_public or skin.owner_id == user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нет доступа к этому скину")
    return skin


def _remove_user_banner_file(url: Optional[str]) -> None:
    """Удаляет файл личного баннера (только из /media/skins/user/)."""
    if not url or not url.startswith("/media/skins/user/"):
        return
    try:
        path = (MEDIA_DIR / url[len("/media/"):]).resolve()
        if USER_BANNERS_DIR.resolve() in path.parents:
            path.unlink(missing_ok=True)
    except Exception:
        pass


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@router.get("/presets", response_model=list[SkinResponse])
def get_preset_skins(
    user_id: Optional[UUID] = Depends(get_optional_user_id),
    db: Session = Depends(get_db)
):
    """Получить список встроенных preset-скинов."""
    presets = db.query(Skin).filter(Skin.is_preset == True).all()
    return _with_user_banners(db, user_id, presets)


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
    
    return _with_user_banners(db, user_id, skins)


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
    
    return _with_user_banners(db, user_id, list(all_skins.values()))


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
    return _skin_for_user(db, skin, user_id)


@router.get("/{skin_id}", response_model=SkinResponse)
def get_skin(
    skin_id: UUID,
    user_id: Optional[UUID] = Depends(get_optional_user_id),
    db: Session = Depends(get_db)
):
    """Получить детали конкретного скина."""
    skin = db.query(Skin).filter(Skin.id == skin_id).first()
    
    if not skin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skin not found"
        )
    
    return _skin_for_user(db, skin, user_id)


@router.get("/{skin_id}/banners", response_model=SkinResponse)
def get_skin_banners(
    skin_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Баннеры скина для 4 окон: тема + личные фото пользователя (custom_slots)."""
    skin = db.query(Skin).filter(Skin.id == skin_id).first()
    if not skin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Скин не найден")
    return _skin_for_user(db, skin, user_id)


@router.post("/{skin_id}/banners/{slot}", response_model=SkinResponse)
def upload_skin_banner(
    skin_id: UUID,
    slot: str,
    file: UploadFile = File(...),
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Заменить баннер одного окна (home/search/library/player) своим фото.
    JPG/PNG/WebP до 10 МБ -> обрезка по центру до 1200x400 WebP.
    Тема не меняется: фото хранится как личное переопределение пользователя.
    """
    _check_slot(slot)
    skin = _get_editable_skin(db, skin_id, user_id)

    max_bytes = MAX_BANNER_MB * 1024 * 1024
    data = file.file.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Файл слишком большой (максимум {MAX_BANNER_MB} МБ)",
        )
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Файл пустой")
    try:
        probe = Image.open(io.BytesIO(data))
        image_format = probe.format
        probe.verify()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Файл не похож на изображение или повреждён",
        )
    if image_format not in ALLOWED_BANNER_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Поддерживаются только JPG, PNG и WebP",
        )
    try:
        banner_bytes, _ = resize_and_crop_image(data, 1200, 400, quality=85, output_format="WEBP")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось обработать изображение",
        )

    user_dir = USER_BANNERS_DIR / str(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{skin.id}-{slot}-{uuid.uuid4().hex[:12]}.webp"  # новое имя -> кэш /media не мешает
    (user_dir / filename).write_bytes(banner_bytes)
    url = f"/media/skins/user/{user_id}/{filename}"

    row = db.query(UserSkinBanner).filter(
        UserSkinBanner.user_id == user_id,
        UserSkinBanner.skin_id == skin.id,
        UserSkinBanner.slot == slot,
    ).first()
    old_url = None
    if row:
        old_url = row.url
        row.url = url
    else:
        db.add(UserSkinBanner(user_id=user_id, skin_id=skin.id, slot=slot, url=url))
    db.commit()
    _remove_user_banner_file(old_url)

    return _skin_for_user(db, skin, user_id)


@router.delete("/{skin_id}/banners/{slot}", response_model=SkinResponse)
def reset_skin_banner(
    skin_id: UUID,
    slot: str,
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Вернуть баннер темы для окна (удалить личное фото)."""
    _check_slot(slot)
    skin = _get_editable_skin(db, skin_id, user_id)
    row = db.query(UserSkinBanner).filter(
        UserSkinBanner.user_id == user_id,
        UserSkinBanner.skin_id == skin.id,
        UserSkinBanner.slot == slot,
    ).first()
    if row:
        old_url = row.url
        db.delete(row)
        db.commit()
        _remove_user_banner_file(old_url)
    return _skin_for_user(db, skin, user_id)


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


@router.post("/create-custom", response_model=SkinResponse)
def create_custom_skin(
    name: str = Form(...),
    home: Optional[UploadFile] = File(None),
    search: Optional[UploadFile] = File(None),
    library: Optional[UploadFile] = File(None),
    player: Optional[UploadFile] = File(None),
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Create a custom 4-banner skin from up to 4 uploaded photos.
    
    Each photo is center-cropped to 1200x400 WebP (<150 KB).
    Accent colors are extracted from the first provided photo.
    If fewer than 4 photos, reuse in order: home -> search -> library -> player.
    
    Returns the created skin saved to the user's library.
    """
    _ensure_dirs()
    
    # Collect uploaded files in order
    photos = []
    for slot_file in [home, search, library, player]:
        if slot_file and slot_file.filename:
            data = slot_file.file.read()
            if not validate_image_upload(data, max_size_mb=10):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid image in {slot_file.filename} or file too large (max 10MB)"
                )
            photos.append(data)
    
    if not photos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one photo required"
        )
    
    # Process first photo for accent colors
    from app.image_processing import resize_and_crop_image, get_dominant_color, get_secondary_color, fix_exif_orientation
    from PIL import Image
    import io as io_module
    
    original_img = Image.open(io_module.BytesIO(photos[0]))
    original_img = fix_exif_orientation(original_img)
    dominant = get_dominant_color(original_img)
    secondary = get_secondary_color(original_img, dominant)
    
    # Fallback reuse: if fewer than 4 photos, cycle through available
    while len(photos) < 4:
        photos.append(photos[len(photos) % len(photos)])
    
    # Process each photo to 1200x400 WebP
    file_id = uuid.uuid4().hex
    banner_urls = {}
    slot_names = ["home", "search", "library", "player"]
    
    for idx, (slot_name, photo_data) in enumerate(zip(slot_names, photos)):
        banner_bytes, _ = resize_and_crop_image(photo_data, 1200, 400, quality=85, output_format="WEBP")
        filename = f"{file_id}-{slot_name}.webp"
        (SKINS_DIR / filename).write_bytes(banner_bytes)
        banner_urls[slot_name] = f"/media/skins/{filename}"
    
    # Create skin in DB
    new_skin = Skin(
        name=name,
        owner_id=user_id,
        button_style="round",
        accent_color=dominant,
        accent_secondary=secondary,
        animation_type="none",
        is_public=False,
        is_preset=False,
        banners=banner_urls,
        banner_url=banner_urls["home"],  # fallback
        thumbnail_url=banner_urls["home"]
    )
    db.add(new_skin)
    db.commit()
    db.refresh(new_skin)
    
    return new_skin


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
        skin = db.query(Skin).filter(Skin.id == profile.active_skin_id).first()
    else:
        skin = db.query(Skin).filter(Skin.is_preset == True).first()
    # с личными баннерами пользователя
    return _skin_for_user(db, skin, user_id)


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
