# backend/api/serializers.py

from rest_framework import serializers
from .models import Cliente, Projeto, Tarefa, MembroProjeto


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


class ClienteSerializer(serializers.ModelSerializer):
    """
    Serializer para Clientes.
    Usa o ProjetoSerializer aninhado, que agora é "inteligente" o suficiente
    para adicionar a flag 'is_member' em cada projeto.
    """
    projetos = ProjetoSerializer(many=True, read_only=True)

    class Meta:
        model = Cliente
        fields = ['id', 'nome', 'data_criacao', 'projetos']