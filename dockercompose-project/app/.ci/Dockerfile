# Build stage
FROM golang:1.25-alpine AS builder

# Instala dependências de compilação
RUN apk add --no-cache git gcc musl-dev

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependências
COPY go.mod go.sum ./

# Baixa as dependências
RUN go mod download

# Copia o código fonte
COPY . .

# Compila a aplicação
RUN CGO_ENABLED=0 GOOS=linux go build -o todo-api .

# Runtime stage
FROM alpine:3.18

# Instala dependências de runtime
RUN apk add --no-cache ca-certificates tzdata

# Cria um usuário não-root para executar a aplicação
RUN adduser -D -g '' appuser

# Define o diretório de trabalho
WORKDIR /app

# Copia o binário compilado do estágio de build
COPY --from=builder /app/todo-api .

# Copia a pasta frontend
COPY --from=builder /app/frontend ./frontend

# Define as permissões
RUN chown -R appuser:appuser /app
USER appuser

# Expõe a porta
EXPOSE 5000

# Comando para executar a aplicação
CMD ["./todo-api"]