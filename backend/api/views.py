from rest_framework import viewsets, permissions # <-- IMPORTAR PERMISSIONS
from .models import Cliente, Projeto, Tarefa, MembroProjeto
from .serializers import ClienteSerializer, ProjetoSerializer, TarefaSerializer

class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.all().order_by('nome')
    serializer_class = ClienteSerializer
    permission_classes = [permissions.IsAuthenticated] # Apenas exige login

class ProjetoViewSet(viewsets.ModelViewSet):
    serializer_class = ProjetoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filtra para mostrar apenas projetos dos quais o usuário é membro."""
        return self.request.user.projetos_participados.all().distinct().order_by('-data_criacao')

    def perform_create(self, serializer):
        """
        Ao criar, salva o projeto e torna o criador um membro administrador.
        """
        projeto = serializer.save() # Salva o projeto primeiro
        # Agora cria a "ficha de membro" para o criador
        MembroProjeto.objects.create(
            projeto=projeto,
            usuario=self.request.user,
            papel=MembroProjeto.Papel.ADMIN
        )

class TarefaViewSet(viewsets.ModelViewSet):
    serializer_class = TarefaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filtra tarefas para mostrar apenas as de projetos
        aos quais o usuário tem acesso (é membro).
        """
        projetos_acessiveis = self.request.user.projetos_participados.all()

        projeto_pk = self.kwargs.get('projeto_pk')
        if projeto_pk:
            # Na rota aninhada, pega apenas tarefas do projeto especificado, se ele estiver na lista de acessíveis
            return Tarefa.objects.filter(projeto_id=projeto_pk, projeto__in=projetos_acessiveis)

        # Na rota geral, mostra todas as tarefas de todos os projetos acessíveis
        return Tarefa.objects.filter(projeto__in=projetos_acessiveis)