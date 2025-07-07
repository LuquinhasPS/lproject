





from django.urls import path, include
from rest_framework import routers
from rest_framework_nested.routers import NestedDefaultRouter
from .views import ClienteViewSet, ProjetoViewSet, TarefaViewSet
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

# Router principal
router = routers.DefaultRouter()
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'projetos', ProjetoViewSet, basename='projeto')
router.register(r'tarefas', TarefaViewSet, basename='tarefa')

# Router aninhado para projetos dentro de clientes
clientes_router = NestedDefaultRouter(router, r'clientes', lookup='cliente')
clientes_router.register(r'projetos', ProjetoViewSet, basename='cliente-projetos')

# Router aninhado para tarefas dentro de projetos
projetos_router = NestedDefaultRouter(router, r'projetos', lookup='projeto')
projetos_router.register(r'tarefas', TarefaViewSet, basename='projeto-tarefas')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(clientes_router.urls)),
    path('', include(projetos_router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]