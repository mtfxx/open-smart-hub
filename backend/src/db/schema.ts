import { pgTable, serial, varchar, boolean, integer } from 'drizzle-orm/pg-core';

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
});

export const devices = pgTable('devices', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').references(() => rooms.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'light' | 'plug'
  state: boolean('state').default(false).notNull(),
  power: integer('power').default(0).notNull(),
});
