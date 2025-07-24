# backend/api/serializers.py

from rest_framework import serializers
from .models import Cliente, Projeto, Tarefa, MembroProjeto
from django.contrib.auth.models import User # Adicione este import


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class MembroProjetoCreateUpdateSerializer(serializers.ModelSerializer):
    # Permite que o frontend envie o ID do usuário
    usuario = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = MembroProjeto
        fields = ['id', 'usuario', 'papel']


class MembroProjetoSerializer(serializers.ModelSerializer):
    """Serializer para mostrar os detalhes de um membro do projeto."""
    usuario = serializers.ReadOnlyField(source='usuario.username')
    papel = serializers.CharField(source='get_papel_display')

    class Meta:
        model = MembroProjeto
        fields = ['usuario', 'papel']


class SubtarefaSerializer(serializers.ModelSerializer):
    """Um serializer simplificado para mostrar subtarefas aninhadas."""
    class Meta:
        model = Tarefa
        fields = ['id', 'descricao', 'concluida', 'data_prazo']


class TarefaSerializer(serializers.ModelSerializer):
    """Serializer para tarefas, incluindo suas subtarefas."""
    subtarefas = SubtarefaSerializer(many=True, read_only=True)

    class Meta:
        model = Tarefa
        fields = [
            'id', 'projeto', 'tarefa_pai', 'descricao',
            'concluida', 'data_prazo', 'data_criacao', 'subtarefas'
        ]


class ProjetoSerializer(serializers.ModelSerializer):
    """
    Serializer para projetos.
    Inclui listas aninhadas de tarefas e membros, e uma flag 'is_member'
    para indicar se o usuário atual faz parte do projeto.
    """
    tarefas = serializers.SerializerMethodField()
    membros = MembroProjetoSerializer(source='adesoes', many=True, read_only=True)
    is_member = serializers.SerializerMethodField()

    class Meta:
        model = Projeto
        fields = [
            'id', 'cliente', 'codigo_tag', 'nome_detalhado',
            'data_criacao', 'tarefas', 'membros', 'is_member', 'data_prazo'
        ]

    def get_tarefas(self, obj):
        """
        Retorna TODAS as tarefas do projeto para que o frontend possa montar a árvore.
        """
        # A linha abaixo agora pega todas as tarefas, sem filtro.
        todas_as_tarefas = obj.tarefas.all()
        serializer = TarefaSerializer(todas_as_tarefas, many=True, context=self.context)
        return serializer.data

    def get_is_member(self, obj):
        """Verifica se o usuário da requisição é membro deste projeto."""
        usuario = self.context['request'].user
        # 'obj' é a instância do Projeto que está sendo serializada
        return usuario in obj.membros.all()


# backend/api/serializers.py

class ClienteSerializer(serializers.ModelSerializer):
    # Usamos um método para ter controle total sobre quais projetos são listados
    projetos = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = ['id', 'nome', 'data_criacao', 'projetos']

    def get_projetos(self, obj):
        """
        Este método filtra a lista de projetos de um cliente para retornar
        apenas aqueles dos quais o usuário atual é membro.
        """
        # Pega o usuário logado que o ViewSet nos passou pelo contexto
        usuario = self.context['request'].user
        
        # Filtra os projetos do cliente (obj)
        projetos_acessiveis = obj.projetos.filter(membros=usuario)
        
        # Usa o ProjetoSerializer para formatar os dados corretamente
        # É importante passar o contexto adiante, para que o 'is_member' do ProjetoSerializer funcione
        serializer = ProjetoSerializer(projetos_acessiveis, many=True, context=self.context)
        return serializer.data