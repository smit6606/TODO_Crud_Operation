const express = require("express");
const route = express.Router();

const {
  createTodo,
  getTodos,
  getTodoById,
  updateTodo,
  deleteTodo,
} = require("../controllers/todo");

const {
  validateCreateTodo,
  validateUpdateTodo,
} = require("../validations/todo");

/*
|--------------------------------------------------------------------------
| TODO ROUTES
|--------------------------------------------------------------------------
*/

// Create Todo
// route - POST /api/task/
route.post("/", validateCreateTodo, createTodo);

// Get All Todos By User
// route - GET /api/task/ (accepts ?priority=... & ?status=... query strings)
route.get("/", getTodos);

// Get Todo By ID
// route - GET /api/task/:id
route.get("/:id", getTodoById);

// Update Todo
// route - PUT /api/task/:id
route.put("/:id", validateUpdateTodo, updateTodo);

// Soft Delete Todo
// route - DELETE /api/task/:id
route.delete("/:id", deleteTodo);

module.exports = route;
