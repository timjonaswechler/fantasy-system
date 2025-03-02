// src/lib/db.ts
import { Pool, QueryResult, PoolClient } from "pg";
import "server-only";

// Konfiguration für den PostgreSQL-Pool
const poolConfig: any = {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DATABASE,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
};

// Passwort nur hinzufügen, wenn es gesetzt ist
if (
  process.env.POSTGRES_PASSWORD &&
  process.env.POSTGRES_PASSWORD.trim() !== ""
) {
  poolConfig.password = process.env.POSTGRES_PASSWORD;
}

// Debug-Ausgabe der Verbindungsdaten (ohne Passwort)
console.log("Datenbankverbindungsdaten:", {
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  port: process.env.POSTGRES_PORT,
});

// Pool erstellen
const pool = new Pool(poolConfig);

// Testverbindung mit einem Client
async function testConnection(): Promise<void> {
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    console.log("Datenbankverbindung erfolgreich hergestellt");
    // Optional: Einfache Abfrage ausführen
    const result = await client.query("SELECT NOW()");
    console.log("Datenbankzeit:", result.rows[0]);
  } catch (error: any) {
    console.error("Fehler bei der Datenbankverbindung:", error.message);
  } finally {
    if (client) client.release();
  }
}

// Testverbindung beim Start ausführen
testConnection().catch((error) => {
  console.error("Unbehandelte Fehler bei der Testverbindung:", error);
});

// Hilfsfunktion für SELECT-Abfragen
export async function query<T>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Ausgeführte Abfrage", { text, duration, rows: res.rowCount });
    return res.rows;
  } catch (error: any) {
    console.error("Fehler bei der Abfrage:", error.message, { text });
    throw error;
  }
}

// Hilfsfunktion für INSERT/UPDATE/DELETE-Abfragen
export async function mutate(
  text: string,
  params?: any[]
): Promise<QueryResult> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Ausgeführte Mutation", { text, duration, rows: res.rowCount });
    return res;
  } catch (error: any) {
    console.error("Fehler bei der Mutation:", error.message, { text });
    throw error;
  }
}

// Hilfsfunktion für Transaktionen
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
