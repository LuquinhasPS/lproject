# api/models.py

from django.db import models

# Os modelos Cliente e Projeto permanecem os mesmos...
class Cliente(models.Model):
    nome = models.CharField(max_length=100)
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nome

class Projeto(models.Model):
    cliente = models.ForeignKey(Cliente, related_name='projetos', on_delete=models.CASCADE)
    codigo_tag = models.CharField(max_length=200, unique=True, help_text="Ex: CE023913_500_37 - NOME")
    nome_detalhado = models.CharField(max_length=300, blank=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.codigo_tag


class Tarefa(models.Model):
    # Uma tarefa pode estar ligada a um projeto OU a uma tarefa pai, mas não ambos.
    # Por isso, ambos os campos podem ser nulos.
    projeto = models.ForeignKey(
        Projeto, 
        related_name='tarefas', 
        on_delete=models.CASCADE,
        null=True,  # Permitir que este campo seja nulo
        blank=True
    )
    tarefa_pai = models.ForeignKey(
        'self',  # A mágica acontece aqui: ForeignKey para o próprio modelo
        related_name='subtarefas', 
        on_delete=models.CASCADE,
        null=True,  # Permitir que seja nulo (para tarefas principais)
        blank=True
    )

    descricao = models.TextField()
    concluida = models.BooleanField(default=False)
    data_limite = models.DateField(null=True, blank=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.tarefa_pai:
            return f"Subtarefa de '{self.tarefa_pai.descricao[:20]}...': {self.descricao[:30]}"
        return f"Tarefa de '{self.projeto.codigo_tag}': {self.descricao[:30]}"

