from django.contrib import admin
from django.urls import path, include # Certifique-se que 'include' está importado

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/', include('api.urls')), # Aponta todas as urls /api/... para o nosso app api
]