from rest_framework import permissions
from .models import MembroProjeto


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permite que qualquer um leia o objeto, mas apenas o dono
    (criado_por) pode alterá-lo.
    """
    def has_object_permission(self, request, view, obj):
        # Permissões de leitura são permitidas para qualquer requisição
        if request.method in permissions.SAFE_METHODS:
            return True
        # Permissões de escrita só são permitidas para o dono do cliente
        return obj.criado_por == request.user

class IsProjectAdminOrReadOnly(permissions.BasePermission):
    """
    Permite que qualquer membro do projeto veja (read-only),
    mas apenas admins alterem ou deletem.
    """
    def has_object_permission(self, request, view, obj):
        # Permissões de leitura (GET, HEAD, OPTIONS) são permitidas para qualquer membro
        if request.method in permissions.SAFE_METHODS:
            return obj.membros.filter(id=request.user.id).exists()

        # Permissões de escrita (POST, PUT, PATCH, DELETE) exigem papel de ADMIN
        return MembroProjeto.objects.filter(
            projeto=obj,
            usuario=request.user,
            papel=MembroProjeto.Papel.ADMIN
        ).exists()

class IsProjectAdmin(permissions.BasePermission):
    """
    Permite acesso apenas a usuários que são administradores do projeto.
    """
    def has_permission(self, request, view):
        # Pega o ID do projeto da URL (ex: /api/projetos/4/membros/)
        projeto_id = view.kwargs.get('projeto_pk')
        if not projeto_id:
            return False
            
        # Verifica se existe uma entrada de membro para este usuário, neste projeto, com o papel de ADMIN
        return MembroProjeto.objects.filter(
            projeto_id=projeto_id,
            usuario=request.user,
            papel=MembroProjeto.Papel.ADMIN
        ).exists()