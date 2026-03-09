import express from 'express';
import cors from 'cors';
import mqtt from 'mqtt';
import Docker from 'dockerode';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Docker instance
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

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

// System & Docker Status
app.get('/api/system/status', async (req, res) => {
  try {
    const containers = await docker.listContainers({ all: true });
    
    const getContainerInfo = (imageName: string) => {
      const container = containers.find(c => c.Image.includes(imageName));
      if (!container) return { status: 'offline', uptime: '-', state: 'Not Found' };
      
      return {
        status: container.State === 'running' ? 'running' : 'offline',
        uptime: container.Status, // e.g. "Up 4 days"
        state: container.State
      };
    };

    const mqttInfo = getContainerInfo('eclipse-mosquitto');
    const dbInfo = getContainerInfo('postgres');
    const influxInfo = getContainerInfo('influxdb');

    res.json([
      { name: 'Smart Hub Backend', status: 'running', uptime: `Up ${Math.floor(process.uptime() / 60)} minutes`, port: '3001' },
      { name: 'Mosquitto MQTT', status: mqttInfo.status, uptime: mqttInfo.uptime, port: '1883' },
      { name: 'InfluxDB', status: influxInfo.status, uptime: influxInfo.uptime, port: '8086' },
      { name: 'PostgreSQL', status: dbInfo.status, uptime: dbInfo.uptime, port: '5432' }
    ]);
  } catch (error) {
    console.error('Docker info fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch Docker status. Make sure Docker Desktop is running.' });
  }
});

// API Status
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'Smart Home Hub API is running!' });
});

// --- SSE (Server-Sent Events) ---
let clients: express.Response[] = [];

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Add this client
  clients.push(res);
  
  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// Function to notify all frontend clients
function broadcastUpdate() {
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify({ type: 'UPDATE_DEVICES', devices })}\n\n`);
  });
}

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
    
    // Notify all connected frontend clients about the change
    broadcastUpdate();
    
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
