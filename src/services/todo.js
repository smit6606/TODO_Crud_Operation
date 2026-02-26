const { Op } = require("sequelize");
const Todo = require("../models/todo");

module.exports = class TodoService {
    async createTodo(body) {
        return await Todo.create(body);
    }

    async findTodosByUser(userId) {
        return await Todo.findAll({
            where: {
                userId,
                isDeleted: false,
            },
            order: [["createdAt", "DESC"]],
        });
    }

    async findById(id) {
        return await Todo.findByPk(id);
    }

    async countIncompleteTodos(userId) {
        return await Todo.count({
            where: {
                userId,
                isDeleted: false,
                status: {
                    [Op.in]: ["pending", "in-progress"],
                },
            },
        });
    }

    async updateTodo(todo, updatedData) {
        return await todo.update(updatedData);
    }

    async softDeleteTodo(todo) {
        return await todo.update({ isDeleted: true });
    }
};
