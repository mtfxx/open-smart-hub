import express from 'express';
import cors from 'cors';
import mqtt from 'mqtt';
import Docker from 'dockerode';
import { db } from './db';
import { rooms, devices } from './db/schema';
import { eq } from 'drizzle-orm';
import { recordPowerMetrics } from './db/influx';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Docker instance
const docker = new Docker({ socketPath: process.platform === 'win32' ? '//./pipe/docker_engine' : '/var/run/docker.sock' });

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
      { name: 'PostgreSQL', status: dbInfo.status, uptime: dbInfo.uptime, port: '5433' }
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
async function broadcastUpdate() {
  const allDevices = await getAllDevicesGrouped();
  clients.forEach(client => {
    client.write(`data: ${JSON.stringify({ type: 'UPDATE_DEVICES', devices: allDevices })}\n\n`);
  });
}

// Helper to group devices by room for the frontend
async function getAllDevicesGrouped() {
  const allRooms = await db.select().from(rooms);
  const allDevices = await db.select().from(devices);
  
  const grouped: Record<string, any[]> = {};
  
  for (const room of allRooms) {
    grouped[room.name] = allDevices.filter(d => d.roomId === room.id);
  }
  
  return grouped;
}

// Get all devices
app.get('/api/devices', async (req, res) => {
  try {
    const grouped = await getAllDevicesGrouped();
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Toggle a device
app.post('/api/devices/:roomId/:id/toggle', async (req, res) => {
  const roomIdStr = req.params.roomId; // This is the room name from frontend
  const id = parseInt(req.params.id);
  
  try {
    // Find device
    const [device] = await db.select().from(devices).where(eq(devices.id, id));
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    const newState = !device.state;
    const newPower = newState ? (device.type === 'light' ? 12 : 45) : 0;
    
    // Update device
    await db.update(devices)
      .set({ state: newState, power: newPower })
      .where(eq(devices.id, id));
    
    // Record power change in InfluxDB
    recordPowerMetrics(device.id, device.name, newPower);
    
    // Notify all connected frontend clients about the change
    await broadcastUpdate();
    
    // Return the updated full state
    const grouped = await getAllDevicesGrouped();
    res.json({ success: true, devices: grouped });
  } catch (error) {
    console.error('Error toggling device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- MQTT CLIENT ---
// Connecting to the Mosquitto broker in Docker!
const mqttClient = mqtt.connect('mqtt://127.0.0.1:1883');

mqttClient.on('connect', () => {
  console.log('📦 Connected to local MQTT broker');
  mqttClient.subscribe('zigbee2mqtt/#');
});

mqttClient.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    
    // Example: zigbee2mqtt/контакт_тв
    // Expecting payload: { "state": "ON", "power": 45, "linkquality": 80 }
    
    if (payload.power !== undefined) {
      console.log(`[MQTT] Received power metric on ${topic}: ${payload.power}W`);
      // Here we would normally look up the device by topic name and save to InfluxDB
      // For now, we just log it.
    }
  } catch (e) {
    // Ignore non-JSON messages
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Smart Home Hub Backend running on http://localhost:${PORT}`);
});
