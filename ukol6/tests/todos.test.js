import test from "ava"
import { migrate } from "drizzle-orm/libsql/migrator"
import { db, getTodoById, getAllTodos } from "../src/db.js"
import { todosTable } from "../src/schema.js"

test.before("run migrations", async () => {
  await migrate(db, { migrationsFolder: "drizzle" })
})

test("getTodoById returns id", async (t) => {
  await db
    .insert(todosTable)
    .values({ id: 1, title: "testovaci todo", done: false })

  const todo = await getTodoById(1)
  t.is(todo.title, "testovaci todo")
})

test("getAllTodos returns all todos", async (t) => {

  //Oprava chyby kdy jsem měl vložené testovací hodnoty v databázi a před testem jsem je nesmazal a nešlo mi tak vložit id 1 protože už v databázi existovalo
  await db.delete(todosTable)

  await db
      .insert(todosTable)
      .values([
        { id: 1, title: "pokus na todo", done: false },
        { id: 2, title: "druhý todo", done: true }
      ])

  const todos = await getAllTodos()

  t.is(todos.length, 2)

  //Oprava chyby, kdy jsem vložil v jiném pořadí a pak mi neprocházely testy, takže je řadím podle id, aby mi to sedělo na indexy v poli
  const sortedTodos = todos.sort((a, b) => a.id - b.id)

  t.is(sortedTodos[0].id, 1)
  t.is(sortedTodos[0].title, "pokus na todo")
  t.is(sortedTodos[0].done, false)

  t.is(sortedTodos[1].id, 2)
  t.is(sortedTodos[1].title, "druhý todo")
  t.is(sortedTodos[1].done, true)
})
