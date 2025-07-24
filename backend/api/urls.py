# backend/api/urls.py

from django.urls import path, include
from rest_framework_nested import routers
from .views import (
    ClienteViewSet, ProjetoViewSet, TarefaViewSet, 
    UserViewSet, MembroProjetoViewSet
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = routers.DefaultRouter()
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'projetos', ProjetoViewSet, basename='projeto')
router.register(r'tarefas', TarefaViewSet, basename='tarefa')
router.register(r'users', UserViewSet, basename='user')

# Rota aninhada para membros dentro de projetos
projetos_membros_router = routers.NestedDefaultRouter(router, r'projetos', lookup='projeto')
projetos_membros_router.register(r'membros', MembroProjetoViewSet, basename='projeto-membros')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(projetos_membros_router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]