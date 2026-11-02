from fastapi import APIRouter

from app.api.routes import health

# Здесь подключаются все группы эндпоинтов. Новые модули добавляются сюда.
api_router = APIRouter()
api_router.include_router(health.router)
