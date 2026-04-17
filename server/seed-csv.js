const fs = require('fs');

const data = fs.readFileSync('./data/hospitals.csv', 'utf8').split('\n');
const header = data[0];
const rows = data.slice(1).filter(r => r.trim().length > 0);

const types = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const update = rows.map(r => {
  const cols = r.split(',');
  // Some CSV rows might have quoted strings with commas. We just naively replace the last two empty commas.
  if (r.endsWith(',,')) {
    // Generate dummy unit stock
    const stock = {};
    const availTypes = [];
    const numTypes = Math.floor(Math.random() * 4) + 2; // 2 to 5 random types
    for (let i = 0; i < numTypes; i++) {
        const typ = types[Math.floor(Math.random() * types.length)];
        const qty = Math.floor(Math.random() * 50) + 5;
        stock[typ] = qty;
        if (!availTypes.includes(typ)) availTypes.push(typ);
    }
    
    // Formatting JSON inside CSV requires double quotes escaped if using standard CSV, but let's just make it a JSON string wrapped in quotes -> "{""O+"": 14}"
    const stockStr = `"{${availTypes.map(t => `""${t}"":${stock[t]}`).join(',')}}"`;
    const typesStr = `"${availTypes.join(', ')}"`;
    
    return r.slice(0, r.length - 2) + `${stockStr},${typesStr}`;
  }
  return r;
});

fs.writeFileSync('./data/hospitals.csv', [header, ...update].join('\n'));
console.log('CSV populated with dummy blood units!');
