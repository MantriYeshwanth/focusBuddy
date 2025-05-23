document.addEventListener("DOMContentLoaded", () => {
    const todoInput = document.getElementById("todo-input")
    const addTodoButton = document.getElementById("add-todo")
    const todoList = document.getElementById("todo-list")
    const todoCount = document.getElementById("todo-count")
  
    const MAX_TODOS = 10
  
    // Load todos
    loadTodos()
  
    // Add todo button
    addTodoButton.addEventListener("click", () => {
      const todoText = todoInput.value.trim()
  
      if (todoText) {
        chrome.storage.local.get(["todos"], (data) => {
          const todos = data.todos || []
  
          if (todos.length >= MAX_TODOS) {
            alert(`You can only have ${MAX_TODOS} tasks at a time. Please complete or remove existing tasks.`)
            return
          }
  
          todos.push({
            text: todoText,
            completed: false,
            id: Date.now(),
          })
  
          chrome.storage.local.set({ todos: todos }, () => {
            todoInput.value = ""
            loadTodos()
          })
        })
      }
    })
  
    // Load todos function
    function loadTodos() {
      chrome.storage.local.get(["todos"], (data) => {
        const todos = data.todos || []
  
        todoList.innerHTML = ""
  
        if (todos.length === 0) {
          const li = document.createElement("li")
          li.textContent = "No tasks added"
          todoList.appendChild(li)
          todoCount.textContent = `0/${MAX_TODOS} tasks`
          return
        }
  
        todos.forEach((todo) => {
          const li = document.createElement("li")
          li.innerHTML = `
            <span class="todo-text ${todo.completed ? "completed" : ""}">${todo.text}</span>
            <div class="todo-actions">
              <button class="complete-todo" data-id="${todo.id}">✓</button>
              <button class="remove-todo" data-id="${todo.id}">×</button>
            </div>
          `
          todoList.appendChild(li)
        })
  
        todoCount.textContent = `${todos.length}/${MAX_TODOS} tasks`
  
        // Add event listeners to todo actions
        document.querySelectorAll(".complete-todo").forEach((button) => {
          button.addEventListener("click", function () {
            const id = Number.parseInt(this.getAttribute("data-id"))
            toggleTodoComplete(id)
          })
        })
  
        document.querySelectorAll(".remove-todo").forEach((button) => {
          button.addEventListener("click", function () {
            const id = Number.parseInt(this.getAttribute("data-id"))
            removeTodo(id)
          })
        })
      })
    }
  
    // Toggle todo complete function
    function toggleTodoComplete(id) {
      chrome.storage.local.get(["todos"], (data) => {
        const todos = data.todos || []
  
        const updatedTodos = todos.map((todo) => {
          if (todo.id === id) {
            return { ...todo, completed: !todo.completed }
          }
          return todo
        })
  
        chrome.storage.local.set({ todos: updatedTodos }, () => {
          loadTodos()
        })
      })
    }
  
    // Remove todo function
    function removeTodo(id) {
      chrome.storage.local.get(["todos"], (data) => {
        const todos = data.todos || []
  
        const updatedTodos = todos.filter((todo) => todo.id !== id)
  
        chrome.storage.local.set({ todos: updatedTodos }, () => {
          loadTodos()
        })
      })
    }
  })
  