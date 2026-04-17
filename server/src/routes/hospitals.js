/**
 * hospitals.js
 * Routes for hospital and blood bank data (seeded from CSV).
 *
 * GET  /api/hospitals            → list all hospitals
 * GET  /api/hospitals/search     → search by name or blood type
 * GET  /api/hospitals/:id        → get single hospital
 * PUT  /api/hospitals/:id/stock  → update blood stock for a hospital
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getIO } = require('../sockets/socketManager');
// const Hospital = require('../models/Hospital'); // Disabled due to DB failure

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

function parseCSVHospitals() {
  const csvPath = path.join(__dirname, '../../data/hospitals.csv');
  const file = fs.readFileSync(csvPath, 'utf8');
  const lines = file.split('\n').filter(l => l.trim().length > 0);
  const hospitals = [];
  
  for (let i = 1; i < lines.length; i++) {
    // Basic CSV splitting, considering quotes for JSON structures
    // Our node script put JSON in the last col wrapper in quotes e.g. "{""A+"":12}"
    // Format: State,District,Name,Address,Latitude,Longitude,Type,Public/Private,Blood Units Available,Blood Types Available
    
    // We can do a simple regex or split by comma to parse this.
    // However, the JSON has commas inside. A simpler way is to find the first `{` and last `}`
    const raw = lines[i];
    let bloodObj = {};
    if (raw.includes('{')) {
       try {
         const jsonStr = raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1).replace(/""/g, '"');
         bloodObj = JSON.parse(jsonStr);
       } catch(e) {}
    }
    
    const parts = raw.split(',');
    hospitals.push({
      _id: `HOSP-${i}`,
      name: parts[2] || 'Unknown',
      location: [parseFloat(parts[4]) || 20.0, parseFloat(parts[5]) || 78.0],
      address: parts[3],
      bloodStock: bloodObj,
      totalUnitsAvailable: Object.values(bloodObj).reduce((sum, v) => sum + (parseInt(v)||0), 0)
    });
  }
  return hospitals;
}

/**
 * GET /api/hospitals
 * Returns all hospitals from CSV overriding DB.
 */
router.get('/', (req, res, next) => {
  try {
    const hospitals = parseCSVHospitals();
    res.status(200).json({ count: hospitals.length, hospitals });
  } catch (err) {
    console.error("CSV Parse Error:", err);
    next(err);
  }
});

/**
 * GET /api/hospitals/search
 * Query params:
 *   name=<string>       → partial, case-insensitive hospital name match
 *   bloodType=<type>    → filter hospitals that have this blood type available
 *   lat=<num>&lng=<num> → (future) location-based sort
 */
router.get('/search', async (req, res, next) => {
  try {
    const { name, bloodType } = req.query;
    const filter = { isActive: true };

    if (name) {
      filter.name = { $regex: name.trim(), $options: 'i' };
    }

    if (bloodType) {
      if (!BLOOD_TYPES.includes(bloodType)) {
        return res.status(400).json({
          error: true,
          message: `Invalid bloodType. Must be one of: ${BLOOD_TYPES.join(', ')}`,
          code: 400,
        });
      }
      filter.bloodTypesAvailable = bloodType;
    }

    const hospitals = await Hospital.find(filter).sort({ name: 1 }).lean();

    res.status(200).json({ count: hospitals.length, hospitals });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/hospitals/:id
 * Returns a single hospital by MongoDB _id.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const hospitals = parseCSVHospitals();
    const hospital = hospitals.find(h => h._id === req.params.id);
    if (!hospital) {
      return res.status(404).json({ error: true, message: 'Hospital not found', code: 404 });
    }
    res.status(200).json({ hospital });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/hospitals/add-unit
 * Updates the physical data/hospitals.csv file in real-time for cross-user syncing.
 */
router.post('/add-unit', (req, res, next) => {
  try {
    const { hospitalId, bloodType, quantity } = req.body;
    const qtyNum = parseInt(quantity);
    
    if (!hospitalId || !bloodType || isNaN(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({ error: true, message: 'Invalid payload' });
    }

    const csvPath = path.join(__dirname, '../../data/hospitals.csv');
    const file = fs.readFileSync(csvPath, 'utf8');
    const lines = file.split('\n');
    let updated = false;

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      const raw = lines[i];
      if (`HOSP-${i}` === hospitalId) {
        let bloodObj = {};
        if (raw.includes('{')) {
          try {
            const jsonStr = raw.substring(raw.indexOf('{'), raw.lastIndexOf('}') + 1).replace(/""/g, '"');
            bloodObj = JSON.parse(jsonStr);
          } catch(e) {}
        }
        
        // Update stock
        bloodObj[bloodType] = (bloodObj[bloodType] || 0) + qtyNum;
        
        // Re-stringify with escaped quotes for CSV
        let typesArr = Object.keys(bloodObj);
        let stockStr = `"{${typesArr.map(t => `""${t}"":${bloodObj[t]}`).join(',')}}"`;
        let descStr = `"${typesArr.join(', ')}"`;

        // Strip old trailing columns and append new ones
        let baseLine = raw.includes('"{') ? raw.substring(0, raw.indexOf('"{')) : raw;
        // if baseline ends with comma, keep it, else add it. Usually we just drop the last two cols
        const parts = baseLine.split(',');
        parts[parts.length - 2] = stockStr;
        parts[parts.length - 1] = descStr;
        
        if (baseLine.includes('"{')) {
          // If already had JSON, it replaced everything from `"{` onward
          lines[i] = baseLine + stockStr + ',' + descStr;
        } else {
           // Basic replacement of last two items
           const origParts = raw.split(',');
           origParts[origParts.length - 2] = stockStr;
           origParts[origParts.length - 1] = descStr;
           lines[i] = origParts.join(',');
        }
        
        updated = true;
        break;
      }
    }

    if (updated) {
      fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
      
      const io = getIO();
      if (io) {
        io.emit('INVENTORY_UPDATE', { 
          hospitalId, 
          bloodType, 
          quantity: qtyNum,
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(200).json({ success: true, message: 'Stock written to global ledger' });
    } else {
      res.status(404).json({ error: true, message: 'Hospital match failed' });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
