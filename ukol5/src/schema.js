import {
  sqliteTable,
  int,
  text,
} from "drizzle-orm/sqlite-core"
export const Priority = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
}
export const todosTable = sqliteTable("todos", {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  done: int({ mode: "boolean" }).notNull(),
  priority: int('priority', { enum: Object.values(Priority) }).default(Priority.MEDIUM)
})
