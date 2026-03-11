import { db } from './index';
import { rooms, devices } from './schema';

const initialData = {
  'Хол': [
    { name: 'Лампа хол', type: 'light', state: true, power: 12 },
    { name: 'Контакт TV', type: 'plug', state: true, power: 87 },
    { name: 'Лампа ъгъл', type: 'light', state: false, power: 0 },
  ],
  'Спалня': [
    { name: 'Лампа спалня', type: 'light', state: false, power: 0 },
    { name: 'Контакт зарядно', type: 'plug', state: true, power: 18 },
  ],
  'Кухня': [
    { name: 'Лампа кухня', type: 'light', state: true, power: 9 },
    { name: 'Контакт кафемашина', type: 'plug', state: false, power: 0 },
  ],
};

async function seed() {
  console.log('Seeding database...');
  for (const [roomName, roomDevices] of Object.entries(initialData)) {
    // Insert room
    const [insertedRoom] = await db.insert(rooms).values({ name: roomName }).returning();
    
    // Insert devices for this room
    for (const device of roomDevices) {
      await db.insert(devices).values({
        roomId: insertedRoom.id,
        name: device.name,
        type: device.type,
        state: device.state,
        power: device.power,
      });
    }
  }
  console.log('Database seeded successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding database:', err);
  process.exit(1);
});
