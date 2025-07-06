from django.urls import path, include
# Importando os routers aninhados
from rest_framework_nested import routers
from .views import ClienteViewSet, ProjetoViewSet, TarefaViewSet

# O router principal funciona como antes
router = routers.DefaultRouter()
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'projetos', ProjetoViewSet, basename='projeto')
router.register(r'tarefas', TarefaViewSet, basename='tarefa') # Rota principal de tarefas (opcional)

# --- INÍCIO DA MUDANÇA ---

# Router aninhado para projetos dentro de clientes
# Ex: /api/clientes/1/projetos/
clientes_router = routers.NestedDefaultRouter(router, r'clientes', lookup='cliente')
clientes_router.register(r'projetos', ProjetoViewSet, basename='cliente-projetos')

# Router aninhado para tarefas dentro de projetos
# Ex: /api/projetos/1/tarefas/
projetos_router = routers.NestedDefaultRouter(router, r'projetos', lookup='projeto')
projetos_router.register(r'tarefas', TarefaViewSet, basename='projeto-tarefas')


# As URLs da API são determinadas automaticamente pelos routers.
urlpatterns = [
    path('', include(router.urls)),
    # Incluindo as novas URLs aninhadas
    path('', include(clientes_router.urls)),
    path('', include(projetos_router.urls)),
]