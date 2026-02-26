const { StatusCodes } = require("http-status-codes");
const { MSG } = require("../utils/message");
const { errorResponse, successResponse } = require("../utils/responseFormat");
const TodoService = require("../services/todo");

const todoService = new TodoService();

const getUserId = (req) => {
    if (req.user && req.user.id) return req.user.id;
    return 1;
};

module.exports.createTodo = async (req, res) => {
    try {
        const userId = getUserId(req);
        const { title, description, priority } = req.body;

        const newTodo = await todoService.createTodo({
            userId,
            title,
            description,
            priority: priority || "medium",
        });

        return successResponse({
            res,
            statusCode: StatusCodes.CREATED,
            message: MSG.TODO.CREATED,
            data: newTodo,
        });
    } catch (error) {
        return errorResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: MSG.SERVER.INTERNAL_ERROR,
            error: error.message,
        });
    }
};

module.exports.getTodos = async (req, res) => {
    try {
        const userId = getUserId(req);
        const todos = await todoService.findTodosByUser(userId);

        return successResponse({
            res,
            statusCode: StatusCodes.OK,
            message: MSG.TODO.FETCHED_ALL,
            data: todos,
        });
    } catch (error) {
        return errorResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: MSG.SERVER.INTERNAL_ERROR,
            error: error.message,
        });
    }
};

module.exports.updateTodo = async (req, res) => {
    try {
        const userId = getUserId(req);
        const todoId = req.params.id;

        const todo = await todoService.findById(todoId);

        if (!todo || todo.isDeleted) {
            return errorResponse({
                res,
                statusCode: StatusCodes.NOT_FOUND,
                message: MSG.TODO_ERROR.NOT_FOUND,
            });
        }

        if (String(todo.userId) !== String(userId)) {
            return errorResponse({
                res,
                statusCode: StatusCodes.FORBIDDEN,
                message: MSG.ACCESS.UNAUTHORIZED_TODO_UPDATE,
            });
        }

        const allowedFields = ["title", "description", "status", "priority"];

        const updatedData = {};
        allowedFields.forEach((field) => {
            if (req.body[field]) updatedData[field] = req.body[field];
        });

        const updatedTodo = await todoService.updateTodo(todo, updatedData);

        return successResponse({
            res,
            statusCode: StatusCodes.OK,
            message: MSG.TODO.UPDATED,
            data: updatedTodo,
        });
    } catch (error) {
        return errorResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: MSG.SERVER.INTERNAL_ERROR,
            error: error.message,
        });
    }
};

module.exports.deleteTodo = async (req, res) => {
    try {
        const userId = getUserId(req);
        const todoId = req.params.id;

        const todo = await todoService.findById(todoId);

        if (!todo || todo.isDeleted) {
            return errorResponse({
                res,
                statusCode: StatusCodes.NOT_FOUND,
                message: MSG.TODO_ERROR.NOT_FOUND,
            });
        }

        if (String(todo.userId) !== String(userId)) {
            return errorResponse({
                res,
                statusCode: StatusCodes.FORBIDDEN,
                message: MSG.ACCESS.UNAUTHORIZED_TODO_DELETE,
            });
        }

        await todoService.softDeleteTodo(todo);

        return successResponse({
            res,
            statusCode: StatusCodes.OK,
            message: MSG.TODO.DELETED,
        });
    } catch (error) {
        return errorResponse({
            res,
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: MSG.SERVER.INTERNAL_ERROR,
            error: error.message,
        });
    }
};
