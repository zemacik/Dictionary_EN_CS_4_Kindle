const fs = require('fs');
const readline = require('readline');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

//const INPUT_FILE = '../data/encs_dictionary_by_tomogo_v3_small.html';
const INPUT_FILE = '../data/data.txt';
const DATABASE = '../output/translations.db';

// Main function to run the script
async function main() {

    // Open a database connection (it will create the file if it does not exist)
    const db = await sqlite.open({
        filename: DATABASE,
        driver: sqlite3.Database
    });

    await db.run(`CREATE TABLE IF NOT EXISTS translations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT,
        headword TEXT,
        translation TEXT
    )`);

    await db.run('DELETE FROM translations');

    console.log('Table created and cleared.');

    const fileStream = fs.createReadStream(INPUT_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });


    let counter = 0;
    let chunk = [];
    let params = [];
    const chunkSize = 1000; // You can adjust the chunk size

    for await (const line of rl) {
        // Extract English word (before the first tab)
        const englishWord = line.split('\t')[0];

        // Extract headword, categories, and translations
        const regex = /<b>(.*?)<\/b>|<i>\[(.*?)\]<\/i>/g;
        let matches;
        let headword, translations = [], currentCategory = '';

        while ((matches = regex.exec(line)) !== null) {
            if (matches[2]) {
                // This is a category
                currentCategory = matches[2].trim();
            } else if (matches[1]) {
                if (!headword) {
                    headword = matches[1].trim();
                } else {
                    let translation = matches[1].trim();
                    if (currentCategory) {
                        translation = `[${currentCategory}] ${translation}`;
                    }
                    translations.push(translation);
                }
            }
        }

        let translation = translations.join(', ');

        // Skip empty words
        if (englishWord.trim() === '') {
            continue;
        }

        // Add parameter placeholders and values
        chunk.push("(?, ?, ?)");
        params.push(englishWord, headword, translation);

        // When chunk is full, insert it
        if (chunk.length === chunkSize) {
            await db.run(`INSERT INTO translations (word, headword, translation) VALUES ${chunk.join(',')}`, params);
            chunk = []; // Reset the chunk
            params = []; // Reset the params
        }

        counter++;
    }

    // Insert any remaining records
    if (chunk.length > 0) {
        await db.run(`INSERT INTO translations (word, headword, translation) VALUES ${chunk.join(',')}`, params);
    }

    console.log(`Inserted ${counter} rows.`);

    await db.close();
}

// Run the main function
main().catch(err => {
    console.error(err);
});
