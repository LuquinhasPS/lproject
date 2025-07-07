# backend/api/views.py

from rest_framework import viewsets, permissions
from .models import Cliente, Projeto, Tarefa
from .serializers import ClienteSerializer, ProjetoSerializer, TarefaSerializer
from django.db.models import Q # <-- 1. IMPORTE O 'Q' PARA CONSULTAS COMPLEXAS
from django.db import transaction

# --- ClienteViewSet e ProjetoViewSet continuam os mesmos ---

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('nome')
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

class ProjetoViewSet(viewsets.ModelViewSet):
    serializer_class = ProjetoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Esta linha está correta e busca os projetos do usuário
        return self.request.user.projetos_participados.all().order_by('-data_criacao')

    def perform_create(self, serializer):
        projeto = serializer.save()
        projeto.membros.add(self.request.user, through_defaults={'papel': 'ADMIN'})

    # ADICIONE ESTE MÉTODO PARA CORRIGIR O ERRO 500
    def get_serializer_context(self):
        """
        Garante que o serializer tenha acesso ao objeto de requisição,
        necessário para o campo 'is_member'.
        """
        return {'request': self.request}




class TarefaViewSet(viewsets.ModelViewSet):
    serializer_class = TarefaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Retorna todas as tarefas (pai e filhas) de todos os projetos
        aos quais o usuário tem acesso.
        """
        usuario = self.request.user

        # Pega todos os projetos que o usuário pode acessar
        projetos_acessiveis = usuario.projetos_participados.all()

        # Retorna todas as tarefas que pertencem a esses projetos
        return Tarefa.objects.filter(projeto__in=projetos_acessiveis)

    def perform_create(self, serializer):
        """
        Garante que, ao criar uma subtarefa, ela seja associada ao projeto correto.
        """
        tarefa_pai = serializer.validated_data.get('tarefa_pai', None)
        projeto = serializer.validated_data.get('projeto', None)
        if tarefa_pai and not projeto:
            serializer.save(projeto=tarefa_pai.projeto)
        else:
            serializer.save()

        instance = serializer.instance
        print("--- NOVA TAREFA CRIADA ---")
        print(f"  ID da Tarefa: {instance.id}")
        print(f"  Descrição: {instance.descricao}")
        print(f"  ID da Tarefa Pai: {instance.tarefa_pai_id}")
        print(f"  ID do Projeto Salvo: {instance.projeto_id}") # <-- LINHA MAIS IMPORTANTE
        print("--------------------------")

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        # A lógica de cascata para o 'concluida' continua a mesma
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