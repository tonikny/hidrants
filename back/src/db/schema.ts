import { sqliteTable, text, integer, real, unique, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const hidrants = sqliteTable('hidrants', {
  id: text('id').primaryKey(),
  osm_id: integer('osm_id'),
  municipi: text('municipi'),
  lat: real('lat').notNull(),
  lon: real('lon').notNull(),
  osm_tags: text('osm_tags').default('{}'),
  private_tags: text('private_tags').default('{}'),
  sync_status: text('sync_status', { enum: ['SYNCED', 'PENDING_CREATE', 'PENDING_UPDATE', 'PENDING_DELETE'] }).default('SYNCED'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`)
}, (t) => ({
  municipiIdx: index('idx_hidrants_municipi').on(t.municipi),
  osmIdIdx: index('idx_hidrants_osm_id').on(t.osm_id),
  syncStatusIdx: index('idx_hidrants_sync_status').on(t.sync_status)
}));

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  password_hash: text('password_hash').notNull(),
  municipi: text('municipi').notNull(),
  role: text('role', { enum: ['admin', 'editor'] }).default('editor'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`)
}, (t) => ({
  usernameIdx: index('idx_users_username').on(t.username),
  municipiIdx: index('idx_users_municipi').on(t.municipi),
  unq: unique().on(t.username, t.municipi)
}));
