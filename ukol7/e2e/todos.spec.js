import { test, expect } from "@playwright/test"

test("index page has title", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByText("MY TODO APP")).toBeDefined()
})

//Vytvoření nového todočka přes formulář na hlavní stránce
test("form on index page creates new todos", async ({
  page,
}) => {
  await page.goto("/")

  await page.getByLabel("Název todo").fill("E2E todo")
  await page.getByText("Přidat todo").click()

  await expect(page.getByText("E2E todo")).toBeDefined()
})


//Poze pomocná funkce pro vytváření togoček
async function createTodo(page, title) {
  await page.goto("/");
  await page.getByLabel("Název todo").fill(title);
  await page.getByText("Přidat todo").click();

  await expect(page.getByText(title)).toBeVisible();
}

// Test, jestli je možné vytvořit nové todočko
test("can create new todo", async ({ page }) => {
  await page.goto("/");

  const todoTitle = "Nové E2E todo";
  await page.getByLabel("Název todo").fill(todoTitle);
  await page.getByText("Přidat todo").click();

  const todoElement = page.getByRole("link", { name: todoTitle });
  await expect(todoElement).toBeVisible();
  const listItem = page.locator("li", { has: todoElement });
  await expect(listItem).toContainText("normal");
  await expect(listItem).toContainText("nedokončeno");
});

//Přechod na detail todočka
test("can view todo details", async ({ page }) => {
  const todoTitle = "Todo pro zobrazení detailu";

  await createTodo(page, todoTitle);

  await page.getByRole("link", { name: todoTitle }).click();

  await expect(page.locator("h1")).toHaveText(todoTitle);
  await expect(page.getByText("Upravit todočko")).toBeVisible();
});



// Vytvoření todo a následná jeho úprava přímo přes formulář an stránce
test("can edit todo title and priority", async ({ page }) => {
  await createTodo(page, "Todo pro úpravu");

  await page.getByRole("link", { name: "Todo pro úpravu" }).click();
  await page.locator("input[name='title']").fill("Upravené todo");
  await page.locator("select[name='priority']").selectOption("high");
  await page.getByRole("button", { name: "Uložit" }).click();

  await expect(page.locator("h1")).toHaveText("Upravené todo");

  await page.getByText("Todočka").click();

  const todoElement = page.getByRole("link", { name: "Upravené todo" });
  await expect(todoElement).toBeVisible();

  const listItem = page.locator("li", { has: todoElement });
  await expect(listItem).toContainText("high");
});

// TOznačení todo jako dokončené a opětovné označení jako nedokončené pro otestování změny stavu
test("can toggle todo completion status", async ({ page }) => {
  const todoTitle = "Todo pro označení dokončení";

  await createTodo(page, todoTitle);

  const todoLink = page.getByRole("link", { name: todoTitle });
  const todoItem = page.locator("li", { has: todoLink });

  await expect(todoItem).toContainText("nedokončeno");
  await todoItem.getByRole("link", { name: "nedokončeno" }).click();
  await expect(todoItem).toContainText("dokončeno");
  await todoItem.getByRole("link", { name: "dokončeno" }).click();
  await expect(todoItem).toContainText("nedokončeno");
});

// Nalezení a odstranění todočka, které je již označené jako dokončené
test("can remove completed todo", async ({ page }) => {
  const todoTitle = "Todo pro odstranění";

  await createTodo(page, todoTitle);

  const todoLink = page.getByRole("link", { name: todoTitle });
  const todoItem = page.locator("li", { has: todoLink });

  await todoItem.getByRole("link", { name: "nedokončeno" }).click();

  const removeButton = todoItem.getByRole("link", { name: "odebrat" });
  await expect(removeButton).toBeVisible();
  await removeButton.click();
  await expect(page.getByRole("link", { name: todoTitle })).not.toBeVisible();
});

// Kontrola, že nedokončené todo nemá tlačítko pro odstranění
test("incomplete todo does not have remove button", async ({ page }) => {
  const todoTitle = "Nedokončené todo bez tlačítka odstranit";

  await createTodo(page, todoTitle);
  const todoLink = page.getByRole("link", { name: todoTitle });
  const todoItem = page.locator("li", { has: todoLink });

  await expect(todoItem.getByRole("link", { name: "odebrat" })).not.toBeVisible();
});

// Test, jestli je možné se z detailu dostat zpět na hlavní stránku pomocí navigace
test("can navigate from detail back to list", async ({ page }) => {
  const todoTitle = "Todo pro testování navigace";
  await createTodo(page, todoTitle);

  await page.getByRole("link", { name: todoTitle }).click();
  await expect(page.locator("h1")).toHaveText(todoTitle);
  await page.getByRole("link", { name: "Todočka" }).click();
  await expect(page.getByText("MY TODO APP")).toBeVisible();
});

// Otestování websocketu po tom, co udělám edit todočka a test, jestli se změna projeví
test("websocket updates todo after edit", async ({ page, context }) => {
  const todoTitle = "Todo pro WS test";
  const updatedTitle = "Todo upravené přes WS";
  await createTodo(page, todoTitle);
  const secondPage = await context.newPage();
  await secondPage.goto("/");
  await expect(secondPage.getByRole("link", { name: todoTitle })).toBeVisible();
  await page.getByRole("link", { name: todoTitle }).click();
  await page.locator("input[name='title']").fill(updatedTitle);
  await page.getByRole("button", { name: "Uložit" }).click();
  await expect(secondPage.getByRole("link", { name: updatedTitle })).toBeVisible({ timeout: 3000 });
});
//Test, že nejde vytvořit TODO pokud mám prázdný title
test("cannot create todo with empty title", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Název todo").fill("");
  await page.getByRole("button", { name: "Přidat todo" }).click();

  const beforeCount = await page.locator("li").count();
  await page.getByRole("button", { name: "Přidat todo" }).click();
  const afterCount = await page.locator("li").count();
  expect(beforeCount).toBe(afterCount);
});


// Test websocketu, jestli správně funguje v případě, že je todo odstraněno
test("websocket updates after todo removal", async ({ page, context }) => {
  const todoTitle = "Todo pro test odstranění přes WS";
  await createTodo(page, todoTitle);

  const secondPage = await context.newPage();
  await secondPage.goto("/");

  await expect(secondPage.getByRole("link", { name: todoTitle })).toBeVisible();

  const todoLink = page.getByRole("link", { name: todoTitle });
  const todoItem = page.locator("li", { has: todoLink });

  await todoItem.getByRole("link", { name: "nedokončeno" }).click();
  await todoItem.getByRole("link", { name: "odebrat" }).click();
  await expect(secondPage.getByRole("link", { name: todoTitle })).not.toBeVisible({ timeout: 3000 });
});


//Test, zda neexistující todočko opravud vrací 404
test("non-existent todo returns 404", async ({ page }) => {
  const response = await page.goto("/todos/99999");
  expect(response.status()).toBe(404);
});

//Test, jestli všechny dostupné prority a úrovně jsou viditelné a dají se nastavit
test("can set and display all priority levels", async ({ page }) => {
  const baseTodoTitle = "Todo s prioritou";
  const priorities = ["low", "normal", "high"];

  for (const priority of priorities) {
    const todoTitle = `${baseTodoTitle} ${priority}`;

    await createTodo(page, todoTitle);

    await page.getByRole("link", { name: todoTitle }).click();

    await page.locator("select[name='priority']").selectOption(priority);
    await page.getByRole("button", { name: "Uložit" }).click();

    await page.getByRole("link", { name: "Todočka" }).click();
    const todoElement = page.getByRole("link", { name: todoTitle });
    const todoItem = page.locator("li", { has: todoElement });
    await expect(todoItem).toContainText(priority);
  }
});

// Test websocketu, že funguje správně v příapdě, že se změní stav todočka na dokončeno
test("websocket updates completion status", async ({ page, context }) => {
  const todoTitle = "Todo pro test změny stavu přes WS";

  await createTodo(page, todoTitle);

  const secondPage = await context.newPage();
  await secondPage.goto("/");
  await secondPage.getByRole("link", { name: todoTitle }).click();

  await expect(secondPage.getByRole("link", { name: "nedokončeno" })).toBeVisible();

  const todoLink = page.getByRole("link", { name: todoTitle });
  const todoItem = page.locator("li", { has: todoLink });
  await todoItem.getByRole("link", { name: "nedokončeno" }).click();
  await expect(secondPage.getByRole("link", { name: "dokončeno" })).toBeVisible({ timeout: 3000 });
});

//Test, že pokud zadáne přímo url určitého todočka, tak se dostaneme na jeho detail. Nejendá se o přístup ze seznamu todo
test("can access todo detail directly via URL", async ({ page }) => {
  const todoTitle = "Todo pro přímý přístup";

  await createTodo(page, todoTitle);
  await page.getByRole("link", { name: todoTitle }).click();

  const detailUrl = page.url();
  await page.getByRole("link", { name: "Todočka" }).click();
  await page.goto(detailUrl);
  await expect(page.locator("h1")).toHaveText(todoTitle);
});
