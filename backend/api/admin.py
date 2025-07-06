from django.contrib import admin
from .models import Cliente, Projeto, Tarefa, MembroProjeto

class MembroProjetoInline(admin.TabularInline):
    model = MembroProjeto
    extra = 1

class SubtarefaInline(admin.TabularInline):
    """Permite adicionar subtarefas diretamente na página de uma tarefa pai."""
    model = Tarefa
    fk_name = 'tarefa_pai' # Especifica qual ForeignKey usar
    extra = 1
    verbose_name = "Subtarefa"
    verbose_name_plural = "Subtarefas"
    
    # Exclui campos que não fazem sentido para uma subtarefa no formulário inline
    exclude = ('projeto',)


@admin.register(Tarefa)
class TarefaAdmin(admin.ModelAdmin):
    """Configuração da visualização de Tarefas no Admin."""
    list_display = ('descricao', 'projeto', 'tarefa_pai', 'concluida', 'data_limite')
    list_filter = ('concluida', 'data_limite', 'projeto')
    search_fields = ('descricao', 'projeto__codigo_tag')

    # Adiciona o formulário de subtarefas na página de edição de uma tarefa
    inlines = [SubtarefaInline]


@admin.register(Projeto)
class ProjetoAdmin(admin.ModelAdmin):
    list_display = ('codigo_tag', 'cliente', 'data_criacao')
    list_filter = ('cliente',)
    search_fields = ('codigo_tag',)
    inlines = [MembroProjetoInline]


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('nome', 'data_criacao')
    search_fields = ('nome',)

# Removemos os registros antigos pois estamos usando o decorador @admin.register
# admin.site.register(Cliente, ClienteAdmin) # Não é mais necessário
# admin.site.register(Projeto, ProjetoAdmin) # Não é mais necessário
# admin.site.register(Tarefa) # Não é mais necessário