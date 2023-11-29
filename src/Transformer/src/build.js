// Description of file we need to create
// https://kdp.amazon.com/en_US/help/topic/G2HXJS944GL88DNV

const fs = require('fs');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

const OUTPUT_FILE = '../output/content.html';
const DATABASE = '../output/translations.db';

// Function to generate the entry template
function generateEntry(headword, word, translation) {
  return `
<idx:entry name="english" scriptable="yes" spell="yes">
  <idx:short>
    <idx:orth value="${headword}">${word}</idx:orth>
    <p>${translation}</p>
  </idx:short>
</idx:entry>
    `.trim();
}

function getHeader() {
  return `<html xmlns:math="http://exslt.org/math" xmlns:svg="http://www.w3.org/2000/svg"
  xmlns:tl="https://kindlegen.s3.amazonaws.com/AmazonKindlePublishingGuidelines.pdf" 
  xmlns:saxon="http://saxon.sf.net/"
  xmlns:xs="http://www.w3.org/2001/XMLSchema" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:cx="https://kindlegen.s3.amazonaws.com/AmazonKindlePublishingGuidelines.pdf"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:mbp="https://kindlegen.s3.amazonaws.com/AmazonKindlePublishingGuidelines.pdf"
  xmlns:mmc="https://kindlegen.s3.amazonaws.com/AmazonKindlePublishingGuidelines.pdf"
  xmlns:idx="https://kindlegen.s3.amazonaws.com/AmazonKindlePublishingGuidelines.pdf">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body>
  <mbp:frameset>
  `;
}

function getFooter() {
  return `
  </mbp:frameset>
</body>
</html>`;
}

async function main() {
  const db = await sqlite.open({
    filename: DATABASE,
    driver: sqlite3.Database
  });

  // Query all records from the database
  const rows = await db.all('SELECT word, headword, translation FROM translations');

  // Create a write stream
  const writeStream = fs.createWriteStream(OUTPUT_FILE);

  // Write the header
  writeStream.write(getHeader());

  // Generate the file content
  rows.forEach(row => {
    if (row.word.trim() === '')
      return;

    writeStream.write(generateEntry(row.headword, row.word, row.translation) + '\n');
  });

  // Write the footer
  writeStream.write(getFooter());

  // Close the write stream and the database connection
  writeStream.end();
  await db.close();
}

main().catch(err => {
  console.error(err);
});