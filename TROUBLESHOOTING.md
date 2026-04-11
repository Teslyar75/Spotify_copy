# Отчет об устранении неполадок (Troubleshooting Report)

В ходе работы над проектом **Spotify Clone** были выявлены и решены несколько критических проблем, препятствовавших запуску и сборке приложения.

---

## 1. Конфликт портов (Docker & Windows)

### Проблема
При попытке запуска контейнеров через `docker-compose up` возникала ошибка:
`Error response from daemon: ports are not available: listen tcp 0.0.0.0:8000: bind: An attempt was made to access a socket in a way forbidden by its access permissions.`

**Причина:** Порты `8000` и `8001` в Windows часто попадают в диапазон исключенных портов (Excluded Port Range), зарезервированных системой (например, для Hyper-V или WSL).

### Решение
1.  **Изменение порта бэкенда**: В файле [docker-compose.yml](file:///d:/Spotify_copy/docker-compose.yml) внешний порт бэкенда был изменен с `8000` на **`8080`**.
2.  **Обновление фронтенда**: В файле [axios.ts](file:///d:/Spotify_copy/frontend/src/lib/axios.ts) переменная `API_URL` была обновлена для работы с новым портом `http://localhost:8080/api`.

---

## 2. Ошибки сборки Frontend (TypeScript & Export)

### Проблема
Контейнер `spotify_frontend` не мог собраться (fail на стадии `npm run build`) из-за нескольких ошибок в коде.

**Ошибка 1 (Missing Export):**
`Module '"@/lib/axios"' declares 'axiosInstance' locally, but it is not exported.`
*   **Причина:** В процессе редактирования [axios.ts](file:///d:/Spotify_copy/frontend/src/lib/axios.ts) случайно было удалено ключевое слово `export` перед объявлением `axiosInstance`. Это привело к поломке всех компонентов и сторов, импортирующих этот инстанс.

**Ошибка 2 (Type Mismatch):**
`src/pages/login/LoginPage.tsx(37,6): error TS2322: Type 'string | undefined' is not assignable to type 'string | null'.`
*   **Причина:** При обработке OAuth-коллбэка в [LoginPage.tsx](file:///d:/Spotify_copy/frontend/src/pages/login/LoginPage.tsx) значение `avatar_url` могло быть `undefined`, в то время как типы данных в приложении ожидали `string` или `null`.

### Решение
1.  **Восстановление экспорта**: В [axios.ts](file:///d:/Spotify_copy/frontend/src/lib/axios.ts) возвращено ключевое слово `export const axiosInstance`.
2.  **Исправление типов**: В [LoginPage.tsx](file:///d:/Spotify_copy/frontend/src/pages/login/LoginPage.tsx) логика была изменена на `avatar_url: avatar_url || null`, что обеспечило совместимость с типами TypeScript.

---

## 3. Статус проекта после исправлений

После применения вышеуказанных правок:
1.  Команда `docker-compose up -d --build` выполняется успешно.
2.  Бэкенд проходит проверку работоспособности (`/health`).
3.  Фронтенд корректно взаимодействует с бэкендом через порт `8080`.

**Текущие адреса доступа:**
-   Frontend: `http://localhost:3000`
-   Backend API: `http://localhost:8080/docs`
