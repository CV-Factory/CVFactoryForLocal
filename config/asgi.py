"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
import sys
from pathlib import Path
from django.core.asgi import get_asgi_application

# Add the project root to the Python path
# This allows importing the 'api' module from the root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# Import the FastAPI app *after* setting the path and env var
from api.main import app as fastapi_app

django_asgi_app = get_asgi_application()

class PathPrefixDispatcher:
    def __init__(self, default_app, prefixes):
        self.default_app = default_app
        self.prefixes = {prefix: app for prefix, app in prefixes.items()}

    async def __call__(self, scope, receive, send):
        # HTTP 요청이고, 경로가 있는 경우에만 처리
        if scope["type"] == "http":
            path = scope.get("path", "")
            for prefix, app in self.prefixes.items():
                if path.startswith(prefix):
                    # FastAPI로 요청을 보낼 때는 경로에서 prefix를 제거합니다.
                    # 예를 들어 /api/docs -> /docs로 변환
                    scope["path"] = path[len(prefix):]
                    await app(scope, receive, send)
                    return
        
        # 일치하는 prefix가 없으면 기본 앱(Django)으로 전달
        await self.default_app(scope, receive, send)

# /api 로 시작하는 경로는 fastapi_app으로, 나머지는 django_asgi_app으로 라우팅
application = PathPrefixDispatcher(
    default_app=django_asgi_app, 
    prefixes={"/api": fastapi_app}
)
