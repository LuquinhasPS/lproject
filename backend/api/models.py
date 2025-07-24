# api/models.py

from django.db import models
from django.contrib.auth.models import User # <-- IMPORTAR ESTA LINHA
from django.conf import settings # Importe settings

class Cliente(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    # Adicione este campo para sabermos quem é o dono do cliente
    criado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    def __str__(self):
        return self.nome

class MembroProjeto(models.Model):
    class Papel(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrador'
        EDITOR = 'EDITOR', 'Editor'
        VIEWER = 'VIEWER', 'Visualizador'

    projeto = models.ForeignKey('Projeto', on_delete=models.CASCADE, related_name='adesoes')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='adesoes')
    papel = models.CharField(max_length=10, choices=Papel.choices, default=Papel.EDITOR)

    class Meta:
        unique_together = ('projeto', 'usuario')

    def __str__(self):
        return f"{self.usuario.username} como {self.get_papel_display()} em '{self.projeto.codigo_tag}'"


class Projeto(models.Model):
    cliente = models.ForeignKey(Cliente, related_name='projetos', on_delete=models.CASCADE)
    codigo_tag = models.CharField(max_length=200, unique=True)
    nome_detalhado = models.CharField(max_length=300, blank=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_prazo = models.DateField(null=True, blank=True)
    membros = models.ManyToManyField(User, through=MembroProjeto, related_name='projetos_participados')

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
    data_prazo = models.DateField(null=True, blank=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.tarefa_pai:
            return f"Subtarefa de '{self.tarefa_pai.descricao[:20]}...': {self.descricao[:30]}"
        return f"Tarefa de '{self.projeto.codigo_tag}': {self.descricao[:30]}"
    
    def save(self, *args, **kwargs):
        """
        Garante que, ao salvar, toda subtarefa tenha uma referência
        direta ao projeto de sua tarefa-pai.
        """
        if self.tarefa_pai and not self.projeto:
            self.projeto = self.tarefa_pai.projeto

        super().save(*args, **kwargs)
    

