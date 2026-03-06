import express from 'express';
import mqtt from 'mqtt';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Свързване към MQTT брокера (това ще чете данните от Zigbee)
// Когато имаме реалната платка, тук ще сложим нейния IP адрес
const mqttClient = mqtt.connect('mqtt://localhost:1883');

mqttClient.on('connect', () => {
  console.log('✅ Connected to MQTT Broker (Zigbee Data Stream)');
  
  // Абонираме се да слушаме всичко от zigbee2mqtt
  mqttClient.subscribe('zigbee2mqtt/#', (err) => {
    if (!err) {
      console.log('📻 Subscribed to Zigbee network!');
    }
  });
});

// Тук ще пристигат съобщенията от сензорите и контактите
mqttClient.on('message', (topic, message) => {
  console.log(`[${topic}] Data: ${message.toString()}`);
});

// Прост API endpoint за нашия Frontend
app.get('/api/status', (req, res) => {
  res.json({ status: 'online', message: 'Smart Home Hub API is running!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Smart Home Hub Backend is running on http://localhost:${PORT}`);
});
