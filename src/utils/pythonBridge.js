const { spawn } = require('child_process');
const path = require('path');

/**
 * Runs the demand prediction engine script.
 * We pass JSON data to python via stdin and read JSON from stdout.
 */
function runDemandPrediction(historicalData, method = 'moving_average') {
  return new Promise((resolve, reject) => {
    // Determine path to the python script at root directory
    const scriptPath = path.join(__dirname, '../../../demand_prediction_engine.py');
    
    // We'll write a small inline wrapper so we don't have to change the python script's inputs if it only accepts args, but actually demand_prediction_engine.py just expects a list of dicts. 
    // Let's invoke python with a small inline script to import and run it.
    
    const inlineScript = `
import sys, json, os

sys.path.append(os.path.dirname(r'${scriptPath}'))
from demand_prediction_engine import run_prediction_pipeline

input_data = sys.stdin.read()
if not input_data:
    print(json.dumps({"error": "No input data"}))
    sys.exit(1)

try:
    data = json.loads(input_data)
    results = run_prediction_pipeline(data, method='${method}')
    print(json.dumps(results))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;

    const pythonProcess = spawn('python', ['-c', inlineScript]);

    let output = '';
    let errOutput = '';

    pythonProcess.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });

    pythonProcess.stderr.on('data', (chunk) => {
      errOutput += chunk.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}: ${errOutput}`));
      }
      try {
        const result = JSON.parse(output);
        if (result.error) return reject(new Error(result.error));
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to parse python output: ${output}`));
      }
    });

    // Send data to stdin
    pythonProcess.stdin.write(JSON.stringify(historicalData));
    pythonProcess.stdin.end();
  });
}

/**
 * Runs the alert decision engine script.
 */
function runAlertDecision(inventoryData) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, '../../../alert_decision_engine.py');
      const inlineScript = `
import sys, json, os

sys.path.append(os.path.dirname(r'${scriptPath}'))
from alert_decision_engine import AdvancedAlertDecisionEngine

input_data = sys.stdin.read()
try:
    data = json.loads(input_data)
    engine = AdvancedAlertDecisionEngine()
    alerts, metrics = engine.analyze_system_state(data)
    print(json.dumps({"alerts": alerts, "metrics": metrics}))
except Exception as e:
    print(json.dumps({"error": str(e)}))
`;
  
      const pythonProcess = spawn('python', ['-c', inlineScript]);
  
      let output = '';
      let errOutput = '';
  
      pythonProcess.stdout.on('data', (chunk) => { output += chunk.toString(); });
      pythonProcess.stderr.on('data', (chunk) => { errOutput += chunk.toString(); });
  
      pythonProcess.on('close', (code) => {
        if (code !== 0) return reject(new Error(\`Python error: \${errOutput}\`));
        try {
          const result = JSON.parse(output);
          if (result.error) return reject(new Error(result.error));
          resolve(result);
        } catch (e) {
          reject(new Error(\`Parse error: \${output}\`));
        }
      });
  
      pythonProcess.stdin.write(JSON.stringify(inventoryData));
      pythonProcess.stdin.end();
    });
  }

module.exports = { runDemandPrediction, runAlertDecision };
