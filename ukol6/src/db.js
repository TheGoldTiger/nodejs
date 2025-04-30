import { drizzle } from "drizzle-orm/libsql"
import { todosTable } from "./schema.js"
import { eq } from "drizzle-orm"

export const db = drizzle({
    connection:
        process.env.NODE_ENV === "test"
            ? "file::memory:"
            : "file:db.sqlite",
    logger: process.env.NODE_ENV !== "test",
})

export const getAllTodos = async () => {
    const todos = await db.select().from(todosTable).all()
    return todos
}

export const getTodoById = async (id) => {
    const todo = await db
        .select()
        .from(todosTable)
        .where(eq(todosTable.id, id))
        .get()

    return todo
}

export const createTodo = async (data) => {
    await db.insert(todosTable).values(data)
    return true
}

export const updateTodo = async (id, data) => {
    await db
        .update(todosTable)
        .set(data)
        .where(eq(todosTable.id, id))

    return await getTodoById(id)
}

export const deleteTodo = async (id) => {
    await db.delete(todosTable).where(eq(todosTable.id, id))
    return true
}

export const toggleTodo = async (id) => {
    const todo = await getTodoById(id)

    if (!todo) return null

    await db
        .update(todosTable)
        .set({ done: !todo.done })
        .where(eq(todosTable.id, id))

    return await getTodoById(id)
}