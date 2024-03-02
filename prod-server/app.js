const express = require('express');
const client = require('prom-client');
const bodyParser = require('body-parser');
 
const app = express();
const register = new client.Registry();
 
client.collectDefaultMetrics({ register });
 
// Set up an object to store multiple meters
const meters = {};
 
// Set up an object to store building meters
const buildingMeters = {};
 
// Middleware to parse JSON bodies
app.use(bodyParser.json());
 
// POST endpoint to receive meter readings
app.post('/meter_reading', (req, res) => {
  const { meterName, reading } = req.body;
 
  if (!meterName || reading === undefined) {
    return res.status(400).send('Missing required fields: meterName, reading');
  }
 
  const timestamp = new Date(); // Generate timestamp as current server time

  // Create or update the gauge for the specific meter
  if (!meters[meterName]) {
    meters[meterName] = new client.Gauge({
      name: `meter_reading_${meterName}`,
      help: `Energy meter reading for ${meterName} in kWh`,
      labelNames: ['timestamp'],
    });
    register.registerMetric(meters[meterName]);
  }
 
  meters[meterName].set({ timestamp: timestamp.toISOString() }, reading);
  console.log(meters);
  res.send('Reading recorded');
});

app.post('/building_meter_reading', (req, res) => {
  const { building_name, meterName, reading } = req.body;
 
  if (!building_name || !meterName || reading === undefined) {
    return res.status(400).send('Missing required fields: building_name, meterName, reading');
  }
 
  const timestamp = new Date(); 

  console.log(timestamp)
  if (!buildingMeters[building_name]) {
    buildingMeters[building_name] = new client.Gauge({
      name: `building_data_meter_reading${building_name}`,
      help: `Energy meter reading for building ${building_name} - ${meterName} in kWh`,
      labelNames: ['timestamp'],
    });
    register.registerMetric(buildingMeters[building_name]);
  }
 
  buildingMeters[building_name].set({ timestamp: timestamp.toISOString() }, reading);
  console.log(buildingMeters);
  res.send('Reading recorded');
});
 
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

// Start the server
const port = 3003;
app.listen(port, () => {
  console.log(`Energy meter exporter listening at http://localhost:${port}`);
});


module.exports=app;