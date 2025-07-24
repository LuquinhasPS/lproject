# backend/api/views.py

from rest_framework import viewsets, permissions
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from .models import Cliente, Projeto, Tarefa, MembroProjeto
from .serializers import (
    ClienteSerializer, ProjetoSerializer, TarefaSerializer, UserSerializer,
    MembroProjetoCreateUpdateSerializer
)
from .permissions import IsOwnerOrReadOnly, IsProjectAdminOrReadOnly, IsProjectAdmin

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class MembroProjetoViewSet(viewsets.ModelViewSet):
    serializer_class = MembroProjetoCreateUpdateSerializer
    permission_classes = [IsProjectAdmin]
    def get_queryset(self):
        return MembroProjeto.objects.filter(projeto_id=self.kwargs['projeto_pk'])
    def perform_create(self, serializer):
        serializer.save(projeto_id=self.kwargs['projeto_pk'])

class ClienteViewSet(viewsets.ModelViewSet):
    serializer_class = ClienteSerializer
    permission_classes = [IsOwnerOrReadOnly]

    def get_queryset(self):
        usuario = self.request.user
        show_all = self.request.query_params.get('all', 'false').lower() == 'true'
        if show_all:
            return Cliente.objects.all().order_by('nome')
        else:
            projetos_do_usuario = usuario.projetos_participados.all()
            ids_clientes = projetos_do_usuario.values_list('cliente_id', flat=True).distinct()
            return Cliente.objects.filter(id__in=ids_clientes)

    def perform_create(self, serializer):
        serializer.save(criado_por=self.request.user)
    def get_serializer_context(self):
        return {'request': self.request}

class ProjetoViewSet(viewsets.ModelViewSet):
    serializer_class = ProjetoSerializer
    permission_classes = [IsProjectAdminOrReadOnly]
    def get_queryset(self):
        return self.request.user.projetos_participados.all().distinct()
    def perform_create(self, serializer):
        projeto = serializer.save()
        projeto.membros.add(self.request.user, through_defaults={'papel': 'ADMIN'})
    def get_serializer_context(self):
        return {'request': self.request}

class TarefaViewSet(viewsets.ModelViewSet):
    serializer_class = TarefaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        usuario = self.request.user
        projetos_acessiveis = usuario.projetos_participados.all()
        return Tarefa.objects.filter(projeto__in=projetos_acessiveis)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        if response.status_code < 400 and 'concluida' in request.data:
            instance = self.get_object()
            novo_status = request.data.get('concluida')
            descendentes = self.get_descendentes(instance)
            if descendentes:
                descendentes.update(concluida=novo_status)
        return response

    def get_descendentes(self, tarefa):
        filhas = list(tarefa.subtarefas.all())
        descendentes = list(filhas)
        for filha in filhas:
            descendentes.extend(self.get_descendentes(filha))
        ids_descendentes = [d.id for d in descendentes]
        return Tarefa.objects.filter(id__in=ids_descendentes)