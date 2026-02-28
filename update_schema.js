const fs = require('fs');
let c = fs.readFileSync('shared/schema.ts', 'utf8');
let count = 0;
c = c.replace(/\.references\(\(\) => ([a-zA-Z]+)\.id\)/g, (match, p1) => {
  count++;
  return `.references(() => ${p1}.id, { onDelete: 'cascade' })`;
});
console.log(`Replaced ${count} occurrences.`);
fs.writeFileSync('shared/schema.ts', c);
