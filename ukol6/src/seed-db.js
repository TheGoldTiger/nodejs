import { db } from './db.js';
import { todosTable } from './schema.js';

/**
 * Skript pro naplnění databáze ukázkovými daty, použil jsem protože mi z
 * nějakého důvodu nefungovalo spuštění aplikace aniž bych si udělal skript pro export z drizzle schematu,
 * který jsme měl předtím. Dost možná se jedná jen o chybu, kterou jsem udělal já v průběhu práce.
 */
async function seedDatabase() {

    try {

        const existingTodos = await db.select().from(todosTable);

        if (existingTodos.length === 0) {

            /**
             * Testovací data pro tabulku todos, abych tam měl něco na testování i po tom co pokaždé znovu vracím databázi
             */
            await db.insert(todosTable).values([
                { title: 'Nakoupit potraviny', done: false, priority: 'high' },
                { title: 'Zaplatit faktury', done: false, priority: 'normal' },
                { title: 'Venčit psa', done: true, priority: 'low' }
            ]);

        } else {
            console.log(`V tabulce již existuje ${existingTodos.length} záznamů, přeskakuji vkládání ukázkových dat`);
        }
    } catch (error) {
        process.exit(1);
    }
}

seedDatabase();