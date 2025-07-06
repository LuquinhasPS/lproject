from rest_framework import serializers
from .models import Cliente, Projeto, Tarefa, MembroProjeto

# --- NOVO SERIALIZER ---
class MembroProjetoSerializer(serializers.ModelSerializer):
    """Serializer para mostrar os detalhes de um membro do projeto."""
    # Usamos source para buscar o username diretamente do objeto User
    usuario = serializers.ReadOnlyField(source='usuario.username')
    # get_papel_display() retorna o nome legível do papel (ex: "Administrador")
    papel = serializers.CharField(source='get_papel_display')

    class Meta:
        model = MembroProjeto
        fields = ['usuario', 'papel']

# --- SERIALIZERS EXISTENTES (com atualização no ProjetoSerializer) ---

class SubtarefaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tarefa
        fields = ['id', 'descricao', 'concluida', 'data_limite']


class TarefaSerializer(serializers.ModelSerializer):
    subtarefas = SubtarefaSerializer(many=True, read_only=True)
    class Meta:
        model = Tarefa
        fields = [
            'id', 'projeto', 'tarefa_pai', 'descricao', 
            'concluida', 'data_limite', 'data_criacao', 'subtarefas'
        ]


class ProjetoSerializer(serializers.ModelSerializer):
    tarefas = serializers.SerializerMethodField()
    # --- INÍCIO DA MUDANÇA ---
    # Usamos o related_name 'adesoes' que definimos no modelo MembroProjeto
    # e nosso novo serializer para formatar os dados.
    membros = MembroProjetoSerializer(source='adesoes', many=True, read_only=True)
    # --- FIM DA MUDANÇA ---

    class Meta:
        model = Projeto
        fields = [
            'id', 'cliente', 'codigo_tag', 'nome_detalhado', 
            'data_criacao', 'tarefas', 'membros' # <-- Adicionamos 'membros' aqui
        ]

    def get_tarefas(self, obj):
        tarefas_principais = obj.tarefas.filter(tarefa_pai__isnull=True)
        serializer = TarefaSerializer(tarefas_principais, many=True, context=self.context)
        return serializer.data


class ClienteSerializer(serializers.ModelSerializer):
    projetos = ProjetoSerializer(many=True, read_only=True)
    class Meta:
        model = Cliente
        fields = ['id', 'nome', 'data_criacao', 'projetos']