# Спецификация базы данных Spotify Clone

Официальная спецификация схемы. Все таблицы и модели должны соответствовать этому документу.

---

## Auth Service — auth_users

| Поле          | Тип         | Описание                              |
|---------------|--------------|---------------------------------------|
| id            | UUID         | PK, уникальный идентификатор пользователя |
| email         | VARCHAR(255) | Уникальный email                      |
| password_hash | VARCHAR(255) | Хеш пароля                            |
| created_at    | TIMESTAMP    | Дата создания записи                  |

---

## User Service — user_profiles

| Поле       | Тип         | Описание                          |
|------------|--------------|-----------------------------------|
| id         | UUID         | PK, совпадает с auth_users.id     |
| username   | VARCHAR(50)  | Уникальное имя пользователя       |
| avatar_url | VARCHAR(255) | Ссылка на аватар                  |
| bio        | VARCHAR(500) | Короткая биография               |
| created_at | TIMESTAMP    | Дата создания профиля              |
| updated_at | TIMESTAMP    | Дата последнего обновления        |

---

## Track Service — tracks

| Поле      | Тип         | Описание                 |
|-----------|--------------|--------------------------|
| id        | UUID         | PK                       |
| title     | VARCHAR(255) | Название трека           |
| artist    | VARCHAR(255) | Исполнитель              |
| album     | VARCHAR(255) | Альбом                   |
| duration  | INT          | Длительность в секундах  |
| file_url  | VARCHAR(500) | Ссылка на файл трека    |
| created_at| TIMESTAMP    | Дата добавления трека    |

---

## Playlist Service — playlists

| Поле      | Тип         | Описание                    |
|-----------|--------------|-----------------------------|
| id        | UUID         | PK                          |
| owner_id  | UUID         | FK → user_profiles.id       |
| title     | VARCHAR(255) | Название плейлиста          |
| is_public | BOOLEAN      | Публичный или приватный     |
| created_at| TIMESTAMP    | Дата создания               |

---

## Playlist Service — playlist_tracks

| Поле       | Тип  | Описание                      |
|------------|------|-------------------------------|
| id         | UUID | PK                            |
| playlist_id| UUID | FK → playlists.id             |
| track_id   | UUID | FK → tracks.id                |
| position   | INT  | Позиция трека в плейлисте     |

---

## Player / History Service — listening_history

| Поле     | Тип      | Описание              |
|----------|----------|-----------------------|
| id       | UUID     | PK                     |
| user_id  | UUID     | FK → user_profiles.id  |
| track_id | UUID     | id трека               |
| played_at| TIMESTAMP| Время прослушивания    |

---

## Recommendation Service — recommendations

**НЕ ВХОДИТ В ОСНОВНУЮ БД** (отдельная база данных)

| Поле        | Тип      | Описание                    |
|-------------|----------|-----------------------------|
| id          | UUID     | PK                          |
| user_id     | UUID     | id пользователя             |
| content_id  | UUID     | id трека (track)             |
| score       | FLOAT    | Оценка релевантности        |
| generated_at| TIMESTAMP| Время генерации рекомендации |
