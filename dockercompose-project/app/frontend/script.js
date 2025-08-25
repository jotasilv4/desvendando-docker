class TodoApp {
    constructor() {
        this.API_BASE_URL = '/api';
        this.currentFilter = 'all';
        this.currentView = 'list';
        this.currentSort = 'newest';
        this.searchTerm = '';
        this.todos = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAPIHealth();
        this.loadTodos();
        this.setupIntersectionObserver();
    }

    bindEvents() {
        // Navegação
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.setFilter(item.dataset.filter);
            });
        });

        // Botões de visualização
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setView(btn.dataset.view);
            });
        });

        // Ordenação
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.setSort(e.target.value);
        });

        // Busca
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.setSearch(e.target.value);
        });

        // Botão adicionar tarefa
        document.getElementById('addTaskBtn').addEventListener('click', () => {
            this.showTaskModal();
        });

        // Botão adicionar do empty state
        document.getElementById('emptyAddBtn').addEventListener('click', () => {
            this.showTaskModal();
        });

        // Modal events
        document.getElementById('modalClose').addEventListener('click', () => {
            this.hideTaskModal();
        });

        document.getElementById('modalCancel').addEventListener('click', () => {
            this.hideTaskModal();
        });

        document.getElementById('taskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // Recarregar
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadTodos();
        });

        // Fechar toast
        document.querySelector('.toast-close').addEventListener('click', () => {
            this.hideToast();
        });

        // Toggle sidebar em mobile
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });
    }

    setupIntersectionObserver() {
        // Para animações quando elementos entram na viewport
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, { threshold: 0.1 });

        // Observar todos os todo items
        document.querySelectorAll('.todo-item').forEach(item => {
            observer.observe(item);
        });
    }

    async checkAPIHealth() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/health`);
            const data = await response.json();
            
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-indicator span:last-child');
            
            if (data.status === 'OK') {
                statusDot.classList.add('healthy');
                statusText.textContent = 'Conectado';
                this.showToast('API conectada com sucesso', 'success');
            } else {
                statusDot.classList.remove('healthy');
                statusText.textContent = 'Erro na API';
                this.showToast('Problema na conexão com a API', 'error');
            }
        } catch (error) {
            console.error('Erro ao verificar saúde da API:', error);
            document.querySelector('.status-dot').classList.remove('healthy');
            document.querySelector('.status-indicator span:last-child').textContent = 'Offline';
            this.showToast('Não foi possível conectar à API', 'error');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Atualiza navegação
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.filter === filter);
        });

        // Atualiza título da página
        const titles = {
            'all': 'Todas as Tarefas',
            'today': 'Tarefas de Hoje',
            'pending': 'Tarefas Pendentes',
            'completed': 'Tarefas Concluídas'
        };
        
        document.getElementById('pageTitle').textContent = titles[filter] || 'Todas as Tarefas';
        document.getElementById('pageSubtitle').textContent = this.getSubtitle(filter);

        this.renderTodos();
    }

    getSubtitle(filter) {
        const subtitles = {
            'all': 'Todas as suas tarefas em um só lugar',
            'today': 'Tarefas que precisam ser feitas hoje',
            'pending': 'Tarefas que estão aguardando sua atenção',
            'completed': 'Tarefas que você já concluiu'
        };
        return subtitles[filter] || 'Organize suas tarefas de forma eficiente';
    }

    setView(view) {
        this.currentView = view;
        
        // Atualiza botões de visualização
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Atualiza a classe da lista
        const todosList = document.getElementById('todosList');
        todosList.className = `todos-list ${view}-view`;
        
        this.renderTodos();
    }

    setSort(sort) {
        this.currentSort = sort;
        this.renderTodos();
    }

    setSearch(term) {
        this.searchTerm = term.toLowerCase();
        this.renderTodos();
    }

    async loadTodos() {
        this.showLoading();
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/todos`);
            if (!response.ok) throw new Error('Erro ao carregar tarefas');
            
            this.todos = await response.json();
            this.updateStats();
            this.renderTodos();
            this.showToast('Tarefas carregadas com sucesso', 'success');
        } catch (error) {
            console.error('Erro:', error);
            this.showError('Erro ao carregar tarefas. Clique para tentar novamente.');
        } finally {
            this.hideLoading();
        }
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const pending = total - completed;
        
        // Tarefas de hoje (criadas hoje)
        const today = new Date().toISOString().split('T')[0];
        const todayCount = this.todos.filter(todo => {
            const createdDate = new Date(todo.created_at).toISOString().split('T')[0];
            return createdDate === today;
        }).length;

        // Atualiza cards de estatísticas
        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
        document.getElementById('todayTasks').textContent = todayCount;

        // Atualiza badges da navegação
        document.getElementById('allCount').textContent = total;
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('pendingCount').textContent = pending;
        document.getElementById('todayCount').textContent = todayCount;
    }

    renderTodos() {
        let filteredTodos = this.filterTodos();
        filteredTodos = this.sortTodos(filteredTodos);
        filteredTodos = this.searchTodos(filteredTodos);

        const todosList = document.getElementById('todosList');
        const emptyState = document.getElementById('emptyState');

        if (filteredTodos.length === 0) {
            todosList.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        todosList.innerHTML = filteredTodos.map(todo => this.renderTodoItem(todo)).join('');
        
        // Configurar observer para novas animações
        this.setupIntersectionObserver();
    }

    filterTodos() {
        switch (this.currentFilter) {
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            case 'pending':
                return this.todos.filter(todo => !todo.completed);
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                return this.todos.filter(todo => {
                    const createdDate = new Date(todo.created_at).toISOString().split('T')[0];
                    return createdDate === today;
                });
            default:
                return this.todos;
        }
    }

    sortTodos(todos) {
        switch (this.currentSort) {
            case 'newest':
                return [...todos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            case 'oldest':
                return [...todos].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            case 'az':
                return [...todos].sort((a, b) => a.title.localeCompare(b.title));
            case 'za':
                return [...todos].sort((a, b) => b.title.localeCompare(a.title));
            default:
                return todos;
        }
    }

    searchTodos(todos) {
        if (!this.searchTerm) return todos;
        
        return todos.filter(todo => 
            todo.title.toLowerCase().includes(this.searchTerm) ||
            (todo.description && todo.description.toLowerCase().includes(this.searchTerm))
        );
    }

    renderTodoItem(todo) {
        const createdDate = new Date(todo.created_at).toLocaleDateString();
        const updatedDate = new Date(todo.updated_at).toLocaleDateString();
        
        // Prioridade aleatória para demonstração (em uma app real, isso viria da API)
        const priorities = ['low', 'medium', 'high'];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const priorityText = {
            'low': 'Baixa',
            'medium': 'Média',
            'high': 'Alta'
        }[priority];

        // Categoria aleatória para demonstração
        const categories = ['work', 'personal', 'shopping', 'health'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const categoryText = {
            'work': 'Trabalho',
            'personal': 'Pessoal',
            'shopping': 'Compras',
            'health': 'Saúde'
        }[category];

        const categoryColors = {
            'work': '#4facfe',
            'personal': '#ff6b6b',
            'shopping': '#ffd93d',
            'health': '#6bcb77'
        };

        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''} ${priority}-priority fade-in">
                <div class="todo-header">
                    <h3 class="todo-title">${this.escapeHtml(todo.title)}</h3>
                    <div class="todo-actions">
                        <button class="btn btn-sm ${todo.completed ? 'btn-secondary' : 'btn-success'}" onclick="app.toggleTodo(${todo.id})">
                            <i class="fas ${todo.completed ? 'fa-undo' : 'fa-check'}"></i>
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="app.showEditModal(${todo.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.deleteTodo(${todo.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${todo.description ? `<p class="todo-description">${this.escapeHtml(todo.description)}</p>` : ''}
                <div class="todo-meta">
                    <span class="todo-category">
                        <span class="category-color" style="background: ${categoryColors[category]}"></span>
                        ${categoryText}
                    </span>
                    <span class="todo-priority priority-${priority}">${priorityText}</span>
                    <span>Criada: ${createdDate}</span>
                    <span>Atualizada: ${updatedDate}</span>
                </div>
            </div>
        `;
    }

    showTaskModal(todo = null) {
        const modal = document.getElementById('taskModal');
        const title = document.getElementById('modalTitle');
        const submitBtn = document.getElementById('modalSubmit');
        
        if (todo) {
            // Modo edição
            title.textContent = 'Editar Tarefa';
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
            
            document.getElementById('taskId').value = todo.id;
            document.getElementById('taskTitle').value = todo.title;
            document.getElementById('taskDescription').value = todo.description || '';
            document.getElementById('taskCompleted').checked = todo.completed;
            
            // Valores aleatórios para demonstração
            document.getElementById('taskCategory').value = ['work', 'personal', 'shopping', 'health'][Math.floor(Math.random() * 4)];
            document.getElementById('taskPriority').value = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
        } else {
            // Modo criação
            title.textContent = 'Adicionar Nova Tarefa';
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar Tarefa';
            
            document.getElementById('taskForm').reset();
            document.getElementById('taskId').value = '';
            document.getElementById('taskPriority').value = 'medium';
        }
        
        modal.classList.remove('hidden');
    }

    hideTaskModal() {
        document.getElementById('taskModal').classList.add('hidden');
    }

    async saveTask() {
        const form = document.getElementById('taskForm');
        const id = document.getElementById('taskId').value;
        
        const taskData = {
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            completed: document.getElementById('taskCompleted').checked
        };

        try {
            const url = id ? `${this.API_BASE_URL}/todos/${id}` : `${this.API_BASE_URL}/todos`;
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });

            if (!response.ok) throw new Error('Erro ao salvar tarefa');

            this.hideTaskModal();
            this.loadTodos();
            this.showToast(
                id ? 'Tarefa atualizada com sucesso!' : 'Tarefa criada com sucesso!',
                'success'
            );
        } catch (error) {
            console.error('Erro:', error);
            this.showToast('Erro ao salvar tarefa', 'error');
        }
    }

    async deleteTodo(id) {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

        try {
            const response = await fetch(`${this.API_BASE_URL}/todos/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Erro ao excluir tarefa');

            this.loadTodos();
            this.showToast('Tarefa excluída com sucesso!', 'success');
        } catch (error) {
            console.error('Erro:', error);
            this.showToast('Erro ao excluir tarefa', 'error');
        }
    }

    async toggleTodo(id) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/todos/${id}/toggle`, {
                method: 'PATCH'
            });

            if (!response.ok) throw new Error('Erro ao alterar status da tarefa');

            this.loadTodos();
        } catch (error) {
            console.error('Erro:', error);
            this.showToast('Erro ao alterar status da tarefa', 'error');
        }
    }

    async showEditModal(id) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/todos/${id}`);
            if (!response.ok) throw new Error('Erro ao carregar tarefa');
            
            const todo = await response.json();
            this.showTaskModal(todo);
        } catch (error) {
            console.error('Erro:', error);
            this.showToast('Erro ao carregar tarefa', 'error');
        }
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('todosList').classList.add('hidden');
        document.getElementById('emptyState').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('todosList').classList.remove('hidden');
    }

    showError(message) {
        const todosList = document.getElementById('todosList');
        todosList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erro ao carregar tarefas</h3>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="app.loadTodos()">
                    <i class="fas fa-redo"></i> Tentar Novamente
                </button>
            </div>
        `;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastIcon = toast.querySelector('.toast-icon');
        const toastMessage = toast.querySelector('.toast-message');
        
        toast.className = `toast ${type}`;
        toastIcon.className = `toast-icon fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`;
        toastMessage.textContent = message;
        
        toast.classList.remove('hidden');
        
        // Auto-esconder após 5 segundos
        setTimeout(() => {
            this.hideToast();
        }, 5000);
    }

    hideToast() {
        document.getElementById('toast').classList.add('hidden');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TodoApp();
});

// Adicionar estilos dinâmicos
const dynamicStyles = `
    .todo-item {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .todo-item.fade-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .stats-grid {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .stats-grid.loaded {
        opacity: 1;
        transform: translateY(0);
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = dynamicStyles;
document.head.appendChild(styleSheet);