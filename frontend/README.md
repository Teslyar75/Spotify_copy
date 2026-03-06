# Spotify Clone - Frontend

React + TypeScript frontend для Spotify Clone.

## Стек

- **React 18** - UI библиотека
- **TypeScript** - Типизация
- **Vite** - Сборщик
- **Tailwind CSS** - Стили
- **Zustand** - Управление состоянием
- **React Router** - Роутинг
- **Socket.IO Client** - WebSocket для real-time
- **Radix UI** - UI компоненты
- **Axios** - HTTP клиент

## Установка

```bash
npm install
```

## Запуск

```bash
npm run dev
```

Frontend будет доступен на http://localhost:3000

## Структура проекта

```
frontend/
├── src/
│   ├── components/       # UI компоненты
│   │   ├── ui/          # Базовые компоненты (button, input, etc.)
│   │   ├── skeletons/   # Skeleton загрузчики
│   │   └── Topbar.tsx   # Верхняя панель
│   ├── layout/          # Layout компоненты
│   │   ├── components/  # Части layout
│   │   └── MainLayout.tsx
│   ├── pages/           # Страницы приложения
│   │   ├── home/        # Главная страница
│   │   ├── album/       # Страница альбома
│   │   ├── chat/        # Чат
│   │   ├── admin/       # Админ панель
│   │   ├── login/       # Вход/регистрация
│   │   └── 404/         # Страница не найдена
│   ├── stores/          # Zustand stores
│   │   ├── useAuthStore.ts
│   │   ├── usePlayerStore.ts
│   │   ├── useMusicStore.ts
│   │   └── useChatStore.ts
│   ├── providers/       # React провайдеры
│   ├── types/           # TypeScript типы
│   ├── lib/             # Утилиты
│   │   ├── axios.ts
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/              # Статические файлы
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## Функционал

### Аутентификация
- Регистрация нового пользователя
- Вход по email/паролю
- JWT токены (access + refresh)
- Сохранение сессии в localStorage

### Музыкальный плеер
- Воспроизведение треков
- Пауза/продолжение
- Переключение треков (вперед/назад)
- Регулировка громкости
- Progress bar с перемоткой
- Очередь воспроизведения

### Real-time функции
- Чат между пользователями
- Онлайн статусы
- Текущая активность (что играет)
- WebSocket подключение

### Страницы
- **Home** - Главная с подборками треков
- **Album** - Просмотр альбома и треков
- **Chat** - Личные сообщения
- **Admin** - Панель администратора (добавление треков/альбомов)

## API

Frontend ожидает backend на http://localhost:8000

### Endpoints

#### Auth
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/logout` - Выход
- `POST /api/auth/refresh` - Обновление токена
- `GET /api/auth/me` - Текущий пользователь

#### Songs
- `GET /api/songs` - Все треки
- `GET /api/songs/featured` - Избранные треки
- `GET /api/songs/made-for-you` - Треки для вас
- `GET /api/songs/trending` - Трендовые треки
- `GET /api/songs/:id` - Трек по ID
- `POST /api/songs` - Создать трек
- `PUT /api/songs/:id` - Обновить трек
- `DELETE /api/songs/:id` - Удалить трек

#### Albums
- `GET /api/albums` - Все альбомы
- `GET /api/albums/:id` - Альбом по ID
- `POST /api/albums` - Создать альбом
- `PUT /api/albums/:id` - Обновить альбом
- `DELETE /api/albums/:id` - Удалить альбом

#### Users
- `GET /api/users` - Все пользователи
- `GET /api/users/:id` - Пользователь по ID
- `GET /api/users/messages/:id` - Сообщения с пользователем

#### WebSocket
- `WS /ws` - WebSocket подключение для чата и статусов

## Переменные окружения

Создайте файл `.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```

## Сборка

```bash
npm run build
```

Собранный проект будет в папке `dist/`

## Линтинг

```bash
npm run lint
```
