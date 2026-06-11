// 待办事项应用 - 支持本地存储

class TodoApp {
    constructor() {
        this.todos = [];
        this.currentFilter = 'all';
        this.draggedElement = null;
        
        this.elements = {
            todoInput: document.getElementById('todoInput'),
            addBtn: document.getElementById('addBtn'),
            todoList: document.getElementById('todoList'),
            clearCompleted: document.getElementById('clearCompleted'),
            totalCount: document.getElementById('totalCount'),
            activeCount: document.getElementById('activeCount'),
            completedCount: document.getElementById('completedCount'),
            filterBtns: document.querySelectorAll('.filter-btn')
        };

        this.init();
    }

    init() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // 添加任务
        this.elements.addBtn.addEventListener('click', () => this.addTodo());
        this.elements.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // 过滤按钮
        this.elements.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.setFilter(e.target.dataset.filter));
        });

        // 清除已完成
        this.elements.clearCompleted.addEventListener('click', () => this.clearCompleted());
    }

    addTodo() {
        const text = this.elements.todoInput.value.trim();
        
        if (!text) {
            alert('请输入一个任务！');
            return;
        }

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.push(todo);
        this.elements.todoInput.value = '';
        this.elements.todoInput.focus();
        
        this.saveToLocalStorage();
        this.render();
    }

    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveToLocalStorage();
        this.render();
    }

    toggleComplete(id) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToLocalStorage();
            this.render();
        }
    }

    editTodo(id, newText) {
        const todo = this.todos.find(todo => todo.id === id);
        if (todo) {
            todo.text = newText.trim();
            if (todo.text === '') {
                this.deleteTodo(id);
            } else {
                this.saveToLocalStorage();
                this.render();
            }
        }
    }

    clearCompleted() {
        if (confirm('确定要删除所有已完成的任务吗？')) {
            this.todos = this.todos.filter(todo => !todo.completed);
            this.saveToLocalStorage();
            this.render();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // 更新活动按钮
        this.elements.filterBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });

        this.render();
    }

    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(todo => todo.completed).length;
        const active = total - completed;

        this.elements.totalCount.textContent = total;
        this.elements.activeCount.textContent = active;
        this.elements.completedCount.textContent = completed;

        // 如果没有已完成任务，禁用清除按钮
        this.elements.clearCompleted.disabled = completed === 0;
    }

    render() {
        this.updateStats();
        
        const filteredTodos = this.getFilteredTodos();
        this.elements.todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            this.elements.todoList.innerHTML = `
                <li class="empty-state">
                    <p>${this.currentFilter === 'all' ? '还没有任务。添加一个开始吧！' : 
                          this.currentFilter === 'active' ? '没有进行中的任务！🎉' :
                          '没有已完成的任务。'}</p>
                </li>
            `;
            return;
        }

        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.draggable = true;
            li.dataset.id = todo.id;

            li.innerHTML = `
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''}
                >
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <input 
                    type="text" 
                    class="todo-edit-input" 
                    value="${this.escapeHtml(todo.text)}"
                >
                <button class="todo-edit">编辑</button>
                <button class="todo-delete">删除</button>
            `;

            // 复选框事件
            const checkbox = li.querySelector('.todo-checkbox');
            checkbox.addEventListener('change', () => this.toggleComplete(todo.id));

            // 删除按钮
            const deleteBtn = li.querySelector('.todo-delete');
            deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));

            // 编辑按钮
            const editBtn = li.querySelector('.todo-edit');
            const editInput = li.querySelector('.todo-edit-input');
            const todoText = li.querySelector('.todo-text');

            editBtn.addEventListener('click', () => {
                if (li.classList.contains('edit-mode')) {
                    const newText = editInput.value.trim();
                    if (newText) {
                        this.editTodo(todo.id, newText);
                    } else {
                        this.render();
                    }
                } else {
                    li.classList.add('edit-mode');
                    editInput.focus();
                    editInput.select();
                }
            });

            // 编辑输入框事件
            editInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    editBtn.click();
                }
            });

            editInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    li.classList.remove('edit-mode');
                }
            });

            editInput.addEventListener('blur', () => {
                if (li.classList.contains('edit-mode')) {
                    editBtn.click();
                }
            });

            // 双击编辑
            todoText.addEventListener('dblclick', () => {
                li.classList.add('edit-mode');
                editInput.focus();
                editInput.select();
            });

            // 拖拽事件
            li.addEventListener('dragstart', (e) => {
                this.draggedElement = li;
                li.style.opacity = '0.5';
            });

            li.addEventListener('dragend', () => {
                this.draggedElement = null;
                li.style.opacity = '1';
            });

            li.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (this.draggedElement && this.draggedElement !== li) {
                    const allItems = Array.from(this.elements.todoList.querySelectorAll('.todo-item'));
                    const draggedIndex = allItems.indexOf(this.draggedElement);
                    const targetIndex = allItems.indexOf(li);

                    if (draggedIndex < targetIndex) {
                        li.parentNode.insertBefore(this.draggedElement, li.nextSibling);
                    } else {
                        li.parentNode.insertBefore(this.draggedElement, li);
                    }
                }
            });

            li.addEventListener('drop', () => {
                // 更新待办事项数组顺序
                const reorderedTodos = Array.from(this.elements.todoList.querySelectorAll('.todo-item'))
                    .map(item => this.todos.find(todo => todo.id == item.dataset.id));
                
                this.todos = reorderedTodos.filter(todo => todo);
                this.saveToLocalStorage();
            });

            this.elements.todoList.appendChild(li);
        });
    }

    saveToLocalStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    loadFromLocalStorage() {
        const stored = localStorage.getItem('todos');
        if (stored) {
            try {
                this.todos = JSON.parse(stored);
            } catch (e) {
                console.error('从本地存储加载待办事项出错：', e);
                this.todos = [];
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 当DOM加载完毕时初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});