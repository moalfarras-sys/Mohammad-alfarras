import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;

function getDatabaseUrl() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DIRECT_URL or DATABASE_URL");
  }
  return url;
}

export function hasDatabaseUrl() {
  return Boolean(process.env.DIRECT_URL || process.env.DATABASE_URL);
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

function serializeValue(value: unknown) {
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (value && typeof value === "object") return JSON.stringify(value);
  return value;
}

export async function queryRows<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return getPool().query<T>(text, values);
}

export async function upsertRow(table: string, row: Record<string, unknown>, conflictCols: string[]) {
  const cols = Object.keys(row);
  const values = cols.map((col) => serializeValue(row[col]));
  const placeholders = cols.map((_, index) => `$${index + 1}`).join(", ");
  const updateCols = cols
    .filter((col) => !conflictCols.includes(col))
    .map((col) => `${col} = EXCLUDED.${col}`)
    .join(", ");

  const sql = `
    INSERT INTO ${table} (${cols.join(", ")})
    VALUES (${placeholders})
    ON CONFLICT (${conflictCols.join(", ")})
    DO UPDATE SET ${updateCols};
  `;

  await queryRows(sql, values);
}

export async function deleteWhere(table: string, column: string, value: unknown) {
  await queryRows(`DELETE FROM ${table} WHERE ${column} = $1`, [value]);
}

export async function updateWhere(
  table: string,
  matchColumn: string,
  matchValue: unknown,
  payload: Record<string, unknown>,
) {
  const cols = Object.keys(payload);
  const assignments = cols.map((col, index) => `${col} = $${index + 1}`).join(", ");
  const values = cols.map((col) => serializeValue(payload[col]));
  values.push(matchValue);
  await queryRows(`UPDATE ${table} SET ${assignments} WHERE ${matchColumn} = $${cols.length + 1}`, values);
}
