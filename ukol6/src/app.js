import { Hono } from "hono"
import { logger } from "hono/logger"
import { serveStatic } from "@hono/node-server/serve-static"
import { renderFile } from "ejs"
import { createNodeWebSocket } from "@hono/node-ws"
import { WSContext } from "hono/ws"
import {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo
} from "./db.js"

export const app = new Hono()

export const { injectWebSocket, upgradeWebSocket } =
    createNodeWebSocket({ app })

app.use(logger())
app.use(serveStatic({ root: "public" }))

app.get("/", async (c) => {
  const todos = await getAllTodos()

  const index = await renderFile("views/index.html", {
    title: "My todo app",
    todos,
  })

  return c.html(index)
})

app.post("/todos", async (c) => {
  const form = await c.req.formData()

  await createTodo({
    title: form.get("title"),
    done: false,
  })

  sendTodosToAllConnections()

  return c.redirect("/")
})

app.get("/todos/:id", async (c) => {
  const id = Number(c.req.param("id"))

  const todo = await getTodoById(id)

  if (!todo) return c.notFound()

  const detail = await renderFile("views/detail.html", {
    todo,
  })

  return c.html(detail)
})

app.post("/todos/:id", async (c) => {
  const id = Number(c.req.param("id"))

  const todo = await getTodoById(id)

  if (!todo) return c.notFound()

  const form = await c.req.formData()

  await updateTodo(id, {
    title: form.get("title"),
    priority: form.get("priority"),
  })

  sendTodosToAllConnections()
  sendTodoDetailToAllConnections(id)

  return c.redirect(c.req.header("Referer"))
})

app.get("/todos/:id/toggle", async (c) => {
  const id = Number(c.req.param("id"))

  await toggleTodo(id)

  sendTodosToAllConnections()
  sendTodoDetailToAllConnections(id)

  return c.redirect(c.req.header("Referer"))
})

app.get("/todos/:id/remove", async (c) => {
  const id = Number(c.req.param("id"))

  const todo = await getTodoById(id)

  if (!todo) return c.notFound()

  await deleteTodo(id)

  sendTodosToAllConnections()
  sendTodoDeletedToAllConnections(id)

  return c.redirect("/")
})

/** @type{Set<WSContext<WebSocket>>} */
const connections = new Set()

app.get(
    "/ws",
    upgradeWebSocket((c) => {
      console.log(c.req.path)

      return {
        onOpen: (ev, ws) => {
          connections.add(ws)
          console.log("onOpen")
        },
        onClose: (evt, ws) => {
          connections.delete(ws)
          console.log("onClose")
        },
        onMessage: (evt, ws) => {
          console.log("onMessage", evt.data)
        },
      }
    })
)

const sendTodosToAllConnections = async () => {
  const todos = await getAllTodos()

  const rendered = await renderFile("views/_todos.html", {
    todos,
  })

  for (const connection of connections.values()) {
    const data = JSON.stringify({
      type: "todos",
      html: rendered,
    })

    connection.send(data)
  }
}

const sendTodoDetailToAllConnections = async (id) => {
  const todo = await getTodoById(id)

  const rendered = await renderFile("views/_todo.html", {
    todo,
  })

  for (const connection of connections.values()) {
    const data = JSON.stringify({
      type: "todo",
      id,
      html: rendered,
    })

    connection.send(data)
  }
}

const sendTodoDeletedToAllConnections = async (id) => {
  for (const connection of connections.values()) {
    const data = JSON.stringify({
      type: "todoDeleted",
      id,
    })

    connection.send(data)
  }
}