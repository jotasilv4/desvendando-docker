package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"todo-api-go/database"
	"todo-api-go/handlers"
)

func initDB() {

	// Configuração do banco de dados
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	// Conecta ao banco de dados
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Falha ao conectar ao banco de dados: %v", err)
	}

	// Configura a conexão do banco no pacote database
	database.DB = db

	// Auto-migrate para criar a tabela
	err = database.DB.AutoMigrate(&handlers.Todo{})
	if err != nil {
		log.Fatalf("❌ Falha ao migrar tabelas: %v", err)
	}

	fmt.Println("✅ Conexão com MySQL estabelecida com sucesso!")
	fmt.Println("✅ Tabela 'todos' verificada/criada!")
}

// Configuração de CORS mais robusta
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, Accept, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// serveFrontend serve os arquivos estáticos do frontend
func serveFrontend(c *gin.Context) {
	// Tenta servir o arquivo solicitado
	filePath := filepath.Join("frontend", c.Request.URL.Path)
	
	// Se o caminho for a raiz ou não existir, serve o index.html
	if c.Request.URL.Path == "/" || c.Request.URL.Path == "" {
		c.File(filepath.Join("frontend", "index.html"))
		return
	}
	
	// Verifica se o arquivo existe
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		// Se não existir, serve o index.html (para suportar rotas do frontend)
		c.File(filepath.Join("frontend", "index.html"))
		return
	}
	
	// Serve o arquivo estático
	c.File(filePath)
}

func main() {
	// Inicializa o banco de dados
	initDB()

	// Configura o router Gin
	router := gin.Default()

	// Usa o middleware CORS para as APIs
	router.Use(CORSMiddleware())

	// API routes
	api := router.Group("/api")
	{
		api.GET("/todos", handlers.GetTodos)
		api.POST("/todos", handlers.CreateTodo)
		api.PUT("/todos/:id", handlers.UpdateTodo)
		api.DELETE("/todos/:id", handlers.DeleteTodo)
		api.PATCH("/todos/:id/toggle", handlers.ToggleTodo)
		api.GET("/health", handlers.HealthCheck)
	}

	// Servir arquivos estáticos do frontend
	// Primeiro verifica se a pasta frontend existe
	if _, err := os.Stat("frontend"); os.IsNotExist(err) {
		log.Println("⚠️  Pasta 'frontend' não encontrada. Criando estrutura básica...")
		// Cria a pasta frontend
		os.MkdirAll("frontend", 0755)
		
		// Cria um index.html básico
		createBasicFrontend()
	}

	// Servir arquivos estáticos
	router.Static("/static", "./frontend")
	
	// Para todas as outras rotas, serve o frontend
	router.NoRoute(serveFrontend)

	// Informações de inicialização
	fmt.Println("\n🚀 Iniciando servidor...")
	fmt.Println("🌐 Frontend disponível em: http://localhost:8080")
	fmt.Println("🔌 API disponível em: http://localhost:8080/api")
	fmt.Println("\n📖 Endpoints disponíveis:")
	fmt.Println("  GET    /api/todos           - Listar todas as tarefas")
	fmt.Println("  POST   /api/todos           - Criar nova tarefa")
	fmt.Println("  PUT    /api/todos/:id       - Atualizar tarefa")
	fmt.Println("  DELETE /api/todos/:id       - Deletar tarefa")
	fmt.Println("  PATCH  /api/todos/:id/toggle - Alternar status da tarefa")
	fmt.Println("  GET    /health              - Status da API")

	// Inicia o servidor
	router.Run(":5000")
}

// createBasicFrontend cria um frontend básico se não existir
func createBasicFrontend() {
	// HTML básico
	htmlContent := `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gerenciador de Tarefas</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }
        header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 25px;
            text-align: center;
        }
        .content {
            padding: 25px;
        }
        .loading {
            text-align: center;
            padding: 40px;
            color: #7f8c8d;
        }
        .todo-list {
            margin-top: 20px;
        }
        .todo-item {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .todo-item.completed {
            background: #d4edda;
            border-color: #c3e6cb;
        }
        .btn {
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        .btn-primary {
            background: #4facfe;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Gerenciador de Tarefas</h1>
            <p>Frontend será carregado em breve...</p>
        </header>
        <div class="content">
            <div class="loading">
                <p>Frontend não encontrado. Por favor, adicione os arquivos frontend na pasta 'frontend'.</p>
                <p>Ou <a href="/api/todos">clique aqui</a> para ver a API diretamente.</p>
            </div>
        </div>
    </div>
</body>
</html>`
	
	// Escreve o arquivo index.html
	err := os.WriteFile("frontend/index.html", []byte(htmlContent), 0644)
	if err != nil {
		log.Printf("❌ Erro ao criar index.html: %v", err)
		return
	}
	
	log.Println("✅ Frontend básico criado em: frontend/index.html")
}