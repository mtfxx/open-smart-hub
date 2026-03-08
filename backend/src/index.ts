import express from 'express';
import cors from 'cors';
import mqtt from 'mqtt';

const app = express();
app.use(cors());
app.use(express.json());

// Mock Data (will be replaced by DB later)
let devices = {
  'Хол': [
    { id: 1, name: 'Лампа хол', type: 'light', state: true, power: 12 },
    { id: 2, name: 'Контакт TV', type: 'plug', state: true, power: 87 },
    { id: 3, name: 'Лампа ъгъл', type: 'light', state: false, power: 0 },
  ],
  'Спалня': [
    { id: 4, name: 'Лампа спалня', type: 'light', state: false, power: 0 },
    { id: 5, name: 'Контакт зарядно', type: 'plug', state: true, power: 18 },
  ],
  'Кухня': [
    { id: 6, name: 'Лампа кухня', type: 'light', state: true, power: 9 },
    { id: 7, name: 'Контакт кафемашина', type: 'plug', state: false, power: 0 },
  ],
};

// --- REST API ROUTES ---

// API Status
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'Smart Home Hub API is running!' });
});

// Get all devices
app.get('/api/devices', (req, res) => {
  res.json(devices);
});

// Toggle a device
app.post('/api/devices/:roomId/:id/toggle', (req, res) => {
  const roomId = req.params.roomId;
  const id = parseInt(req.params.id);
  
  if (devices[roomId as keyof typeof devices]) {
    devices[roomId as keyof typeof devices] = devices[roomId as keyof typeof devices].map((d) => {
      if (d.id === id) {
        const newState = !d.state;
        return { 
          ...d, 
          state: newState, 
          power: newState ? (d.type === 'light' ? 12 : 45) : 0 
        };
      }
      return d;
    });
    // Return the updated full state
    res.json({ success: true, devices });
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

// --- MQTT CLIENT ---
// Connecting to the Mosquitto broker in Docker!
const mqttClient = mqtt.connect('mqtt://localhost:1883');

mqttClient.on('connect', () => {
  console.log('📦 Connected to local MQTT broker (Docker)');
  mqttClient.subscribe('zigbee2mqtt/#');
});

mqttClient.on('message', (topic, message) => {
  // We will process real Zigbee messages here later
  // console.log(`Received message on ${topic}:`, message.toString());
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Smart Home Hub Backend running on http://localhost:${PORT}`);
});
