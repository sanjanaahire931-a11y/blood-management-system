/**
 * seedHospitals.js
 * ────────────────────────────────────────────────────────────────────────────
 * Reads data/hospitals.csv and seeds the MongoDB `hospitals` collection.
 *
 * Usage:
 *   node src/seeders/seedHospitals.js
 *
 * Safe to re-run: existing records are matched by name and upserted.
 * ────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');

const CSV_PATH = path.join(__dirname, '../../data/hospitals.csv');
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloodtrack';

// ── CSV Parser (no external dependency needed) ───────────────────────────────
function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

  // Extract header
  const header = parseCSVLine(lines[0]);

  return lines.slice(1).map((line) => {
    const values = parseCSVLine(line);
    const row = {};
    header.forEach((col, i) => {
      row[col.trim()] = (values[i] || '').trim();
    });
    return row;
  });
}

/** Handle quoted fields with commas inside */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── Transform CSV row → Hospital document ────────────────────────────────────
function rowToHospital(row) {
  const name = row['Hospital Name'] || '';
  const type = row['Address'] || 'Hospital';   // CSV column is mislabeled — it's actually type
  const contact = row['Contact'] === '·' ? '' : (row['Contact'] || '');
  const rawUnits = parseInt(row['Blood Units Available'], 10);
  const totalUnits = isNaN(rawUnits) ? 0 : rawUnits;

  // Parse blood types: "A+, O-, B+" → ['A+', 'O-', 'B+']
  const rawTypes = row['Blood Types Available'] || '';
  const bloodTypesAvailable = rawTypes
    .split(',')
    .map((t) => t.trim())
    .filter((t) => BLOOD_TYPES.includes(t));

  // Build blood stock map
  const bloodStock = {};
  BLOOD_TYPES.forEach((t) => {
    bloodStock[t] = bloodTypesAvailable.includes(t) ? Math.max(1, Math.floor(totalUnits / bloodTypesAvailable.length || 0)) : 0;
  });

  return {
    name: name.replace(/[\u{1F600}-\u{1FFFF}]/gu, '').trim(), // strip emoji
    type,
    contact,
    totalUnitsAvailable: totalUnits,
    bloodTypesAvailable,
    bloodStock,
  };
}

// ── Main Seeder ──────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n🌱 BloodTrack Hospital Seeder');
  console.log('────────────────────────────────────');

  // Parse CSV
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV not found at: ${CSV_PATH}`);
    process.exit(1);
  }
  const rows = parseCSV(CSV_PATH);
  console.log(`📄 Parsed ${rows.length} rows from CSV`);

  // Connect to MongoDB
  await mongoose.connect(MONGODB_URI);
  console.log(`🗄  Connected to MongoDB: ${MONGODB_URI}`);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const data = rowToHospital(row);
    if (!data.name) { skipped++; continue; }

    const result = await Hospital.findOneAndUpdate(
      { name: data.name },
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (result.createdAt.getTime() === result.updatedAt?.getTime()) {
      inserted++;
    } else {
      updated++;
    }
  }

  console.log(`\n✅ Seeding complete:`);
  console.log(`   Inserted : ${inserted}`);
  console.log(`   Updated  : ${updated}`);
  console.log(`   Skipped  : ${skipped}`);
  console.log(`   Total    : ${rows.length}\n`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeder failed:', err.message);
  process.exit(1);
});
