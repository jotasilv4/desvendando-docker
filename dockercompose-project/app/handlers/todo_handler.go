package handlers

import (
	"net/http"
	"strconv"
	"time"

	"todo-api-go/database"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Todo struct {
	ID          uint      `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Completed   bool      `json:"completed"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// GetTodos retorna todas as tarefas
func GetTodos(c *gin.Context) {
	var todos []Todo
	result := database.DB.Order("created_at DESC").Find(&todos)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar tarefas: " + result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, todos)
}

// CreateTodo cria uma nova tarefa
func CreateTodo(c *gin.Context) {
	var todo Todo
	if err := c.ShouldBindJSON(&todo); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	if todo.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Título é obrigatório"})
		return
	}

	result := database.DB.Create(&todo)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao criar tarefa: " + result.Error.Error()})
		return
	}

	c.JSON(http.StatusCreated, todo)
}

// UpdateTodo atualiza uma tarefa existente
func UpdateTodo(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var todo Todo
	result := database.DB.First(&todo, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Tarefa não encontrada"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar tarefa: " + result.Error.Error()})
		}
		return
	}

	var updateData Todo
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Dados inválidos"})
		return
	}

	// Atualiza apenas os campos fornecidos
	if updateData.Title != "" {
		todo.Title = updateData.Title
	}
	if updateData.Description != "" {
		todo.Description = updateData.Description
	}
	todo.Completed = updateData.Completed

	result = database.DB.Save(&todo)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar tarefa: " + result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, todo)
}

// DeleteTodo deleta uma tarefa
func DeleteTodo(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var todo Todo
	result := database.DB.First(&todo, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Tarefa não encontrada"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar tarefa: " + result.Error.Error()})
		}
		return
	}

	result = database.DB.Delete(&todo)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao deletar tarefa: " + result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tarefa deletada com sucesso"})
}

// ToggleTodo alterna o status de completado de uma tarefa
func ToggleTodo(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID inválido"})
		return
	}

	var todo Todo
	result := database.DB.First(&todo, id)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Tarefa não encontrada"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao buscar tarefa: " + result.Error.Error()})
		}
		return
	}

	todo.Completed = !todo.Completed

	result = database.DB.Save(&todo)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao alterar status da tarefa: " + result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, todo)
}

// HealthCheck verifica se a API está funcionando
func HealthCheck(c *gin.Context) {
	// Verifica a conexão com o banco de dados
	sqlDB, err := database.DB.DB()
	var dbStatus string
	if err != nil {
		dbStatus = "❌ Erro ao obter conexão"
	} else {
		err = sqlDB.Ping()
		if err != nil {
			dbStatus = "❌ Desconectado"
		} else {
			dbStatus = "✅ Conectado"
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "OK",
		"database":  dbStatus,
		"timestamp": time.Now().Format(time.RFC3339),
	})
}