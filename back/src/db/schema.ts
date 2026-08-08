import { sqliteTable, text, integer, real, unique, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const adfs = sqliteTable("adfs", {
  id: integer("id").primaryKey(), // Número d'ADF
  nom: text("nom").notNull(),
  osm_relations: text("osm_relations").notNull(), // JSON array de strings
  bbox: text("bbox"), // JSON array de 4 números
  center: text("center"), // JSON array de 2 números
  boundary_geojson: text("boundary_geojson"), // GeoJSON del límit territorial
  tracking_shared: integer("tracking_shared", { mode: "boolean" }).default(false),
  created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const hidrants = sqliteTable(
  "hidrants",
  {
    id: text("id").primaryKey(),
    osm_id: integer("osm_id"),
    osm_version: integer("osm_version"),
    adf_id: integer("adf_id").references(() => adfs.id),
    municipi: text("municipi"), // Mantinguem el nom del municipi per info visual
    lat: real("lat").notNull(),
    lon: real("lon").notNull(),
    osm_tags: text("osm_tags").default("{}"),
    private_tags: text("private_tags").default("{}"),
    sync_status: text("sync_status", {
      enum: ["SYNCED", "PENDING_CREATE", "PENDING_UPDATE", "PENDING_DELETE"],
    }).default("SYNCED"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updated_at: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    adfIdx: index("idx_hidrants_adf").on(t.adf_id),
    osmIdIdx: index("idx_hidrants_osm_id").on(t.osm_id),
    syncStatusIdx: index("idx_hidrants_sync_status").on(t.sync_status),
  }),
);

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    password_hash: text("password_hash").notNull(),
    adf_id: integer("adf_id").references(() => adfs.id),
    role: text("role", { enum: ["admin", "coordinador", "voluntari"] }).default("voluntari"),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    usernameIdx: index("idx_users_username").on(t.username),
    adfIdx: index("idx_users_adf").on(t.adf_id),
    unq: unique().on(t.username),
  }),
);

export const mqttUsers = sqliteTable(
  "mqtt_users",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id")
      .notNull()
      .references(() => users.id),
    mqtt_username: text("mqtt_username").notNull(),
    mqtt_password_enc: text("mqtt_password_enc"),
    enabled: integer("enabled", { mode: "boolean" }).default(false),
    created_at: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    userIdIdx: index("idx_mqtt_users_user_id").on(t.user_id),
    mqttUsernameUnq: unique().on(t.mqtt_username),
  }),
);

export const incidencies = sqliteTable(
  "incidencies",
  {
    id: text("id").primaryKey(), // UUID
    titol: text("titol").notNull(),
    tipus: text("tipus").notNull(),
    estat: text("estat", { enum: ["OBERT", "EN_PROGRES", "RESOLT", "TANCAT"] }).default("OBERT"),
    prioritat: text("prioritat", { enum: ["BAIXA", "MITJANA", "ALTA"] }).default("MITJANA"),
    adf_id: integer("adf_id").references(() => adfs.id),
    lat: real("lat").notNull(),
    lon: real("lon").notNull(),
    precisio: text("precisio", { enum: ["DESCONEGUDA", "MUNICIPI", "AREA", "EXACTA"] }).default(
      "DESCONEGUDA",
    ),
    visibilitat: text("visibilitat", { enum: ["PUBLICA", "TOTES_ADFS", "ADF_PRIVADA"] }).default(
      "ADF_PRIVADA",
    ),
    creat_at: text("creat_at").default(sql`CURRENT_TIMESTAMP`),
    actualitzat_at: text("actualitzat_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    adfIdx: index("idx_incidencies_adf").on(t.adf_id),
    estatIdx: index("idx_incidencies_estat").on(t.estat),
  }),
);

export const incidencia_events = sqliteTable(
  "incidencia_events",
  {
    id: text("id").primaryKey(), // UUID
    incidencia_id: text("incidencia_id")
      .notNull()
      .references(() => incidencies.id),
    usuari_id: text("usuari_id").references(() => users.id),
    tipus_event: text("tipus_event").notNull(),
    dades: text("dades").default("{}"), // JSON
    creat_at: text("creat_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    incidenciaIdx: index("idx_events_incidencia").on(t.incidencia_id),
  }),
);
