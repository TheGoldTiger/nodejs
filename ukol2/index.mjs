import { readFile, writeFile } from 'fs/promises';
async function main() {
    try {
        const data = await readFile('instrukce.txt', 'utf8');
        const pocetSouboru = parseInt(data.trim());
        console.log(`Vytvářím ${pocetSouboru} souborů paralelně...`);
        const promises = [];
        for (let i = 0; i <= pocetSouboru; i++) {
            const promise = writeFile(`${i}.txt`, `Soubor ${i}`)
                .then(() => console.log(`Soubor ${i}.txt byl vytvořen`));

            promises.push(promise);
        }


        await Promise.all(promises);

        console.log('Všechny soubory byly úspěšně vytvořeny!');
    } catch (error) {
        console.error('Nastala chyba:', error);
    }
}

main();