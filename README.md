# Stream Post

Веб-платформа для создания профессиональных публикаций в Telegram для киберспортивных стримеров MLBB.

**Статус:** v0.2.0. Готов первый инструмент — картинка с расписанием матчей (ручной ввод, страница `#/schedule`). Картинка рисуется прямо в браузере (canvas), поэтому backend для неё не нужен. Telegram и база данных пока не подключены.

## Структура

```
stream-post/
├── backend/                 # Python + FastAPI
│   ├── app/
│   │   ├── main.py          # создание приложения, CORS
│   │   ├── api/
│   │   │   ├── router.py    # сборка всех роутов
│   │   │   └── routes/health.py
│   │   └── core/
│   │       ├── config.py    # настройки из переменных окружения
│   │       └── database.py  # подключение к PostgreSQL (заготовка)
│   ├── requirements.txt
│   └── .env.example
├── frontend/                # React + TypeScript + Vite
│   └── src/
│       ├── api/             # запросы к backend
│       ├── components/      # общие компоненты
│       ├── features/
│       │   └── schedule/    # генератор картинки с расписанием
│       │       ├── render/      # отрисовка на canvas (фон, шапка, матчи, футер)
│       │       ├── components/  # форма, список матчей, предпросмотр, экспорт
│       │       └── hooks/
│       ├── pages/
│       ├── router/
│       └── styles.css
├── render.yaml              # деплой на Render
└── README.md
```

## Локальный запуск (ПК / ноутбук)

Нужны Python 3.12+ и Node.js 20+.

**Backend** (терминал 1):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Проверка: http://localhost:8000/api/health и документация http://localhost:8000/api/docs

**Frontend** (терминал 2):

```bash
cd frontend
npm install
npm run dev
```

Откройте http://localhost:5173 — на главной странице должен появиться блок «Сервер работает».

## Деплой на Render (с iPhone)

1. Создайте на GitHub репозиторий `stream-post` и загрузите в него содержимое проекта (папки `backend`, `frontend`, файлы `render.yaml`, `.gitignore`, `README.md`). Это можно сделать через приложение GitHub или сайт github.com в Safari («Add file → Upload files»).
2. В Render (dashboard.render.com): **New → Blueprint** → выберите репозиторий. Render прочитает `render.yaml` и создаст три ресурса: `stream-post-api`, `stream-post-web`, `stream-post-db`.
3. Дождитесь окончания деплоя. Откройте адрес `stream-post-web` — главная страница должна показать «Сервер работает».
4. Если у backend оказался адрес не `stream-post-api.onrender.com` (имя было занято), откройте `render.yaml`, замените адрес в блоке `routes → destination` на реальный и сделайте commit — Render передеплоит сайт.

Заметки:
- Бесплатный web service на Render «засыпает» без запросов, первый запрос после паузы может занять до минуты.
- Бесплатная база PostgreSQL на Render действует ограниченное время (около 30 дней), потом её нужно пересоздать или перейти на платный план.
- Переменные окружения backend: см. `backend/.env.example`.

## Принципы

- Код разделён по модулям: новая функция — новый файл в `api/routes` (backend) или `components`/`pages` (frontend).
- Все настройки — через переменные окружения, секреты в репозиторий не попадают (`.env` в `.gitignore`).
