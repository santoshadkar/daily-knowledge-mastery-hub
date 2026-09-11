const fs = require('fs');

let content = fs.readFileSync('./src/data/curriculum.js', 'utf8');

// Replace any triple backtick ``` that is not escaped
// We can replace ``` with \`\`\`
content = content.split('```').join('\\`\\`\\`');

fs.writeFileSync('./src/data/curriculum.js', content, 'utf8');
console.log('Successfully fixed unescaped backticks in curriculum.js!');
