# Документация по Админ-панели: Spotify Clone

Полное описание реализации админ-панели — что сделано, как устроено, какие проблемы были решены.

---

## Содержание

1. [Обзор функциональности](#обзор-функциональности)
2. [Доступ и права](#доступ-и-права)
3. [Интерфейс](#интерфейс)
4. [Backend: API для администратора](#backend-api-для-администратора)
5. [Backend: Загрузка файлов](#backend-загрузка-файлов)
6. [Frontend: State Management](#frontend-state-management)
7. [Frontend: Компонент AdminPage](#frontend-компонент-adminpage)
8. [Nginx: проксирование медиафайлов](#nginx-проксирование-медиафайлов)
9. [Docker: хранение файлов](#docker-хранение-файлов)
10. [Проблемы и их решения](#проблемы-и-их-решения)
11. [Итоговые изменения по файлам](#итоговые-изменения-по-файлам)

---

## Обзор функциональности

Админ-панель предоставляет полный CRUD для музыкального каталога:

| Операция | Альбомы | Треки |
|---------|---------|-------|
| Просмотр списка | ✅ | ✅ (внутри альбома) |
| Создание | ✅ | ✅ |
| Редактирование | ✅ | ✅ |
| Удаление | ✅ (+ все треки) | ✅ |
| Загрузка обложки | ✅ | ✅ |
| Загрузка аудиофайла | — | ✅ |
| Указание URL вместо файла | ✅ | ✅ |

---

## Доступ и права

### Кто может использовать панель

Только пользователи, у которых `email` указан в переменной окружения `ADMIN_EMAILS`.

**Настройка в `.env`:**
```
ADMIN_EMAILS=test@example.com,admin@mysite.com
```

**Настройка в `docker-compose.yml`:**
```yaml
environment:
  - ADMIN_EMAILS=test@example.com
```

По умолчанию: `test@example.com` — тот же email, что и в seed-данных.

### Проверка прав на backend

В `app/dependencies.py` — функция `get_admin_user_id`:

```python
def get_admin_user_id(
    user_id: UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> UUID:
    admin_emails = settings.ADMIN_EMAILS
    user = db.query(AuthUser).filter(AuthUser.id == user_id).first()
    if not user or user.email.lower() not in admin_emails:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return user_id
```

Если email не в списке — `403 Forbidden`.

### Защита на frontend

Маршрут `/admin` доступен только авторизованным:

```tsx
<Route
    path="/admin"
    element={isAuthenticated ? <AdminPage /> : <Navigate to="/login" />}
/>
```

Кнопка **Admin** в Topbar показывается только администраторам (проверка email).

---

## Интерфейс

### Расположение

- **URL:** http://localhost:3000/admin
- **Кнопка:** «Admin» в правом верхнем углу (Topbar), видна только администраторам
- **Назад:** кнопка «← На главную» в верхнем левом углу страницы

### Структура страницы

```
┌─────────────────────────────────────┐
│  ← На главную          Admin Panel  │  ← Topbar
├─────────────────────────────────────┤
│  [+ Добавить альбом]                │
│                                     │
│  ▼ Название альбома (2024)  [✏] [🗑] │  ← Аккордеон альбомов
│    ├─ Трек 1  [✏] [🗑]              │
│    ├─ Трек 2  [✏] [🗑]              │
│    └─ [+ Загрузить трек]            │
│                                     │
│  ▶ Другой альбом (2023)   [✏] [🗑]  │
└─────────────────────────────────────┘
```

### Диалоги

| Диалог | Поля |
|--------|------|
| Создать альбом | Название, Исполнитель, Год, Обложка (файл или URL) |
| Редактировать альбом | Те же поля (предзаполнены) |
| Создать трек | Название, Исполнитель, Длительность (сек), Альбом (необязательно), Обложка, Аудио |
| Редактировать трек | Те же поля (предзаполнены) |
| Удалить | Подтверждение: «Удалить X?» + кнопка подтверждения |

### Компонент FileOrUrlInput

Для каждого медиапоя есть переключатель — файл или URL:

```
[📁 Файл] [🔗 URL]

○ Выбрать файл...   (если выбран "Файл")
○ https://...       (если выбран "URL")
```

---

## Backend: API для администратора

### Albums (`app/routes/albums.py`)

#### Создать альбом
```
POST /api/albums/
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Abbey Road",
  "artist": "The Beatles",
  "image_url": "https://...",
  "release_year": 1969
}
```

Ответ: `AlbumResponse` с полем `songs: []`

#### Обновить альбом
```
PUT /api/albums/{album_id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Abbey Road (Remastered)",
  "artist": "The Beatles",
  "image_url": "https://...",
  "release_year": 2009
}
```

Если изменился `title` или `artist`, автоматически обновляются поля `album_name` и `artist` во всех связанных треках.

#### Удалить альбом
```
DELETE /api/albums/{album_id}
Authorization: Bearer <admin_token>
```

Удаляет альбом и **все связанные треки** (cascade).

---

### Songs (`app/routes/songs.py`)

#### Создать трек

```
POST /api/songs/
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Come Together",
  "artist": "The Beatles",
  "duration": 259,
  "file_url": "/media/songs/uuid.mp3",
  "image_url": "/media/images/uuid.jpg",
  "album_id": "uuid-альбома"   // необязательно
}
```

Если передан `album_id` — поле `album_name` заполняется автоматически из альбома.

**Важно:** endpoint зарегистрирован с двумя декораторами, чтобы принимать и `/songs`, и `/songs/`:
```python
@router.post("", response_model=TrackResponse)
@router.post("/", response_model=TrackResponse)
def create_song(...):
    ...
```

Это предотвращает `307 Temporary Redirect` при запросе без trailing slash.

#### Обновить трек
```
PUT /api/songs/{song_id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Come Together",
  "artist": "The Beatles",
  "duration": 259,
  "file_url": "...",
  "image_url": "...",
  "album_id": null
}
```

#### Удалить трек
```
DELETE /api/songs/{song_id}
Authorization: Bearer <admin_token>
```

---

## Backend: Загрузка файлов

### Endpoints (`app/routes/upload.py`)

#### Загрузить изображение
```
POST /api/upload/image
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

file: <binary>
```

Ответ:
```json
{ "url": "/media/images/a3f1c9d2-...jpg" }
```

Разрешённые форматы: `image/jpeg`, `image/png`, `image/webp`

#### Загрузить аудио
```
POST /api/upload/audio
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data

file: <binary>
```

Ответ:
```json
{ "url": "/media/songs/b7e2d4a1-...mp3" }
```

Разрешённые форматы: `audio/mpeg`, `audio/wav`, `audio/ogg`

### Хранение файлов

```python
BASE_MEDIA_DIR = Path("./media")
IMAGE_DIR = BASE_MEDIA_DIR / "images"
AUDIO_DIR = BASE_MEDIA_DIR / "songs"
```

Файл сохраняется с уникальным именем: `{uuid}{extension}`.

### Отдача файлов

В `app/main.py` настроен `StaticFiles`:

```python
from fastapi.staticfiles import StaticFiles

app.mount("/media", StaticFiles(directory="media"), name="media")
```

Любой `GET /media/images/xxx.jpg` обрабатывается напрямую FastAPI без доп. кода.

---

## Frontend: State Management

### useMusicStore (`src/stores/useMusicStore.ts`)

Все операции с музыкальным каталогом — в одном store.

#### Структура state

```typescript
interface MusicStore {
    albums: Album[];
    songs: Song[];
    isLoading: boolean;
    error: string | null;
    // ...
}
```

#### Загрузка медиафайлов

```typescript
uploadImage: async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file, file.name);   // file.name важен!
    const response = await axiosInstance.post("/upload/image", formData);
    const url = response.data?.url;
    return typeof url === "string" ? url : null;
}

uploadAudio: async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const response = await axiosInstance.post("/upload/audio", formData);
    const url = response.data?.url;
    return typeof url === "string" ? url : null;
}
```

**Зачем передавать `file.name`?** Третий аргумент `FormData.append` — имя файла. Без него сервер может получить файл без расширения, что ломает определение формата.

#### Создание трека

```typescript
createSong: async (songData: CreateSongData): Promise<void> => {
    await axiosInstance.post("/songs/", songData);  // слэш в конце обязателен
    get().fetchAlbums();
}
```

Слэш в конце URL `/songs/` критичен: FastAPI без trailing slash даёт `307 Redirect` на адрес с trailing slash, а Nginx в Docker подставляет внутренний IP-адрес в заголовок `Location`, который браузер не может разрезолвить.

#### Обновление и удаление

```typescript
updateAlbum: async (id: string, data: Partial<Album>): Promise<void> => {
    await axiosInstance.put(`/albums/${id}`, data);
    get().fetchAlbums();
}

deleteAlbum: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/albums/${id}`);
    set((state) => ({ albums: state.albums.filter(a => a.id !== id) }));
}
```

---

## Frontend: Компонент AdminPage

### Расположение в роутинге

`AdminPage` намеренно вынесена **за пределы `<MainLayout>`**:

```tsx
// App.tsx
<Route element={<MainLayout />}>
    <Route path="/" element={<HomePage />} />
    {/* ... другие страницы ... */}
</Route>

{/* AdminPage — отдельно, без sidebar и плеера */}
<Route
    path="/admin"
    element={isAuthenticated ? <AdminPage /> : <Navigate to="/login" />}
/>
```

**Почему это важно:** MainLayout содержит LeftSidebar, AudioPlayer и ArtistInfoSidebar — лишние элементы для панели управления. Кроме того, изоляция упрощает отладку.

### Ключевые технические решения

#### 1. FileOrUrlInput вне AdminPage

```tsx
// ❌ НЕПРАВИЛЬНО — компонент пересоздаётся при каждом рендере
const AdminPage = () => {
    const FileOrUrlInput = ({ ... }) => { ... };  // проблема здесь!
    return <FileOrUrlInput />;
};

// ✅ ПРАВИЛЬНО — компонент определён на уровне модуля
const FileOrUrlInput = ({ label, value, onChange, onFileChange, accept }) => {
    const [mode, setMode] = useState<"url" | "file">("url");
    // ...
};

const AdminPage = () => {
    return <FileOrUrlInput />;
};
```

**Почему это критично:** React идентифицирует компоненты по их типу (ссылке на функцию). Если функция создаётся при каждом рендере — это каждый раз новый тип. React полностью размонтирует и монтирует заново дерево внутри, теряя весь state, включая выбранный файл. Это означало: клик на «Выбрать файл», открытие диалога ОС — и мгновенный сброс состояния.

#### 2. Управление диалогами через state (не DialogTrigger)

```tsx
// ❌ НЕПРАВИЛЬНО — Radix DialogTrigger мог перехватывать события
<DialogTrigger asChild>
    <Button>Добавить альбом</Button>
</DialogTrigger>

// ✅ ПРАВИЛЬНО — явный контроль через state
const [isCreateAlbumOpen, setIsCreateAlbumOpen] = useState(false);

<Button onClick={() => {
    toast("Открытие формы...");
    setIsCreateAlbumOpen(true);
}}>
    Добавить альбом
</Button>

<Dialog open={isCreateAlbumOpen} onOpenChange={setIsCreateAlbumOpen}>
    ...
</Dialog>
```

#### 3. Прямой вызов handler вместо form submit

```tsx
// ❌ НЕПРАВИЛЬНО — form onSubmit мог не сработать из-за Radix Dialog
<form onSubmit={handleCreateAlbum}>
    ...
    <button type="submit">Создать</button>
</form>

// ✅ ПРАВИЛЬНО — onClick напрямую вызывает async функцию
<div>
    ...
    <Button
        type="button"
        onClick={handleCreateAlbum}
        disabled={isLoading}
    >
        {isLoading ? "Создание..." : "Создать"}
    </Button>
</div>
```

#### 4. Клиентская валидация

```typescript
const handleCreateAlbum = async () => {
    if (!albumForm.title.trim()) {
        toast.error("Введите название альбома");
        return;
    }
    if (!albumForm.artist.trim()) {
        toast.error("Введите имя исполнителя");
        return;
    }
    if (!albumForm.image_url && !albumForm.imageFile) {
        toast.error("Добавьте обложку (файл или URL)");
        return;
    }
    // ...
};
```

#### 5. Последовательная загрузка файлов

Если пользователь выбрал файл — сначала загружаем файл, получаем URL, потом создаём альбом/трек с этим URL:

```typescript
const handleCreateAlbum = async () => {
    let imageUrl = albumForm.image_url;

    if (albumForm.imageFile) {
        toast("Загрузка обложки...");
        const uploadedUrl = await uploadImage(albumForm.imageFile);
        if (!uploadedUrl) {
            toast.error("Ошибка загрузки обложки");
            return;
        }
        imageUrl = uploadedUrl;
    }

    toast("Создание альбома...");
    await createAlbum({
        title: albumForm.title,
        artist: albumForm.artist,
        release_year: albumForm.release_year,
        image_url: imageUrl,
    });

    toast.success("Альбом создан!");
    setIsCreateAlbumOpen(false);
    resetAlbumForm();
};
```

#### 6. Toast-уведомления для обратной связи

```typescript
import toast from "react-hot-toast";

toast("Открытие формы...");          // нейтральное
toast("Создание альбома...");        // процесс
toast.success("Альбом создан!");    // успех
toast.error("Введите название");    // ошибка
```

---

## Nginx: проксирование медиафайлов

Файл `frontend/nginx.conf`:

```nginx
# Проксировать /api на backend
location /api {
    proxy_pass http://backend:8000;
    proxy_set_header Host $host;
    proxy_set_header Authorization $http_authorization;  # важно!
    client_max_body_size 100M;
}

# Проксировать /media на backend
location /media {
    proxy_pass http://backend:8000;
    proxy_set_header Host $host;
    client_max_body_size 100M;
}

# Кэшировать статику (JS, CSS, изображения)
# ⚠️ mp3 здесь НЕТ — иначе Nginx попытается раздать mp3 из /usr/share/nginx/html
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Почему mp3 нельзя добавлять в regex статики

Nginx применяет location-блоки по приоритету. Блок `~* \.(...)$` (regex) имеет приоритет над `location /media`. Если добавить `mp3` в regex — Nginx будет искать файл в `/usr/share/nginx/html` и возвращать `404`, не проксируя на backend.

### Зачем проксировать Authorization header

По умолчанию некоторые версии Nginx не пересылают заголовок `Authorization` upstream. Явная директива `proxy_set_header Authorization $http_authorization` гарантирует, что JWT токен дойдёт до backend.

---

## Docker: хранение файлов

В `docker-compose.yml`:

```yaml
services:
  backend:
    volumes:
      - media_data:/app/media       # файлы сохраняются в volume

volumes:
  postgres_data:                    # данные PostgreSQL
  media_data:                       # загруженные медиафайлы
```

### Жизненный цикл данных

| Команда | Контейнеры | postgres_data | media_data |
|---------|-----------|--------------|------------|
| `docker-compose down` | Удалены | Сохранён | Сохранён |
| `docker-compose down -v` | Удалены | **Удалён** | **Удалён** |
| `docker-compose up -d --build` | Пересозданы | Сохранён | Сохранён |

---

## Проблемы и их решения

### Проблема 1: Кнопки диалогов не реагировали на клики

**Симптомы:** нажатие на «Добавить альбом», «Загрузить трек» — никакой реакции в DevTools, никаких сетевых запросов, никаких изменений в state.

**Причина:** `FileOrUrlInput` был определён как функция внутри тела `AdminPage`. При каждом рендере React создавал новую функцию с другой ссылкой — для него это был новый тип компонента. Он размонтировал старый экземпляр и монтировал новый с пустым state. Любой клик или ввод вызывал ре-рендер, который тут же сбрасывал state компонента.

**Решение:** вынести `FileOrUrlInput` за пределы `AdminPage` на уровень модуля.

---

### Проблема 2: 307 Redirect → ERR_CONNECTION_REFUSED

**Симптомы:** в DevTools — `POST /api/songs` → `307 Temporary Redirect`, затем `ERR_CONNECTION_REFUSED`.

**Причина:** FastAPI-роутер был зарегистрирован с `@router.post("/")`. Запрос на `/api/songs` (без slash) FastAPI перенаправлял на `/api/songs/`. Nginx генерировал `Location: http://172.17.0.3:8000/api/songs/` — внутренний Docker IP, недоступный из браузера.

**Решение:**
1. В `songs.py` — добавить второй декоратор:
```python
@router.post("", response_model=TrackResponse)
@router.post("/", response_model=TrackResponse)
def create_song(...):
```

2. В `useMusicStore.ts` — использовать URL со слэшем:
```typescript
await axiosInstance.post("/songs/", payload);
```

---

### Проблема 3: Аудиофайлы не воспроизводились (NotSupportedError)

**Симптомы:** в консоли — `Playback error: NotSupportedError: Failed to load because no supported source was found`.

**Причина:** в `nginx.conf` regex-правило для кэширования статики включало `mp3`:
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|mp3)$ {
```
Nginx не проксировал mp3 на backend, а пытался найти файл в `/usr/share/nginx/html` — и возвращал `404 Not Found`. Браузер получал HTML вместо аудиоданных и выдавал `NotSupportedError`.

**Решение:** удалить `mp3` из regex-правила. Теперь запросы `/media/*.mp3` матчатся по блоку `location /media` и корректно проксируются на backend.

---

### Проблема 4: Accessibility предупреждение для Dialog

**Симптомы:** в консоли — `Warning: Missing Description or aria-describedby={undefined} for {DialogContent}`.

**Причина:** Radix UI требует либо `<DialogDescription>`, либо явный `aria-describedby={undefined}` для контента диалога.

**Решение:** добавить атрибут в `dialog.tsx`:
```tsx
<DialogPrimitive.Content
  ref={ref}
  aria-describedby={undefined}
  className={cn(...)}
  {...props}
>
```

---

## Итоговые изменения по файлам

### `app/routes/songs.py`

- Добавлен двойной декоратор `@router.post("")` + `@router.post("/")`

### `app/routes/albums.py`

- Добавлены `PUT /{album_id}` (обновление)
- Добавлен `DELETE /{album_id}` (удаление)
- При обновлении — каскадное обновление `album_name` в связанных треках

### `app/routes/upload.py` (новый)

- `POST /upload/image` — загрузка обложек
- `POST /upload/audio` — загрузка аудио
- Валидация типа файла по MIME
- Генерация UUID-имён файлов
- Возврат URL для использования в создании треков/альбомов

### `app/main.py`

- Подключён роутер `upload`
- Настроен `StaticFiles` на `/media`
- Создание директорий `media/images` и `media/songs` при старте

### `frontend/src/stores/useMusicStore.ts`

- Добавлены методы: `createAlbum`, `updateAlbum`, `deleteAlbum`
- Добавлены методы: `createSong`, `updateSong`, `deleteSong`
- Добавлены методы: `uploadImage`, `uploadAudio`
- Исправлен URL: `/songs/` (со слэшем)
- Передача `file.name` в `FormData.append`
- Безопасное извлечение URL из ответа

### `frontend/src/pages/admin/AdminPage.tsx`

- `FileOrUrlInput` вынесен за пределы компонента
- Управление диалогами через `useState` вместо `DialogTrigger`
- Формы заменены на `div` + `Button` с `onClick`
- Клиентская валидация с `toast.error`
- Toast-уведомления на каждый этап операции
- Layout: `h-screen flex flex-col overflow-hidden` + кнопка «← На главную»

### `frontend/src/App.tsx`

- Маршрут `/admin` вынесен из `<Route element={<MainLayout />}>`
- AdminPage рендерится без sidebar, плеера и других элементов MainLayout

### `frontend/src/components/ui/dialog.tsx`

- Добавлен `aria-describedby={undefined}` в `DialogPrimitive.Content`

### `frontend/nginx.conf`

- Добавлен `proxy_set_header Authorization $http_authorization`
- Удалён `mp3` из regex-правила кэширования статики
- Добавлен блок `location /media` с проксированием на backend
- `client_max_body_size 100M` для загрузки больших файлов

### `docker-compose.yml`

- Добавлен volume `media_data` для backend
- Примонтирован `media_data:/app/media`

---

*Документация по админ-панели. Spotify Clone. Составлено 13.03.2026*
