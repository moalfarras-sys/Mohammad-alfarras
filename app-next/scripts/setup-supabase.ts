import { config } from "dotenv";
import { Client } from "pg";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { defaultSnapshot } from "../src/data/default-content";

config({ path: path.resolve(process.cwd(), ".env.local") });
config();

type Row = Record<string, unknown>;

const conflictMap: Record<string, string[]> = {
  pages: ["id"],
  page_translations: ["page_id", "locale"],
  sections: ["id"],
  section_translations: ["section_id", "locale"],
  navigation_items: ["id"],
  navigation_translations: ["nav_item_id", "locale"],
  theme_tokens: ["mode", "token_key"],
  media_assets: ["id"],
  youtube_videos: ["id"],
  site_settings: ["key"],
  audit_logs: ["id"],
};

function getDatabaseUrl() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DIRECT_URL or DATABASE_URL in environment");
  return url;
}

function serializeValue(value: unknown) {
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return JSON.stringify(value);
  }
  return value;
}

async function upsertRows(client: Client, table: string, rows: Row[]) {
  if (!rows.length) return;
  const conflict = conflictMap[table];
  const cols = Object.keys(rows[0]);

  for (const row of rows) {
    const values = cols.map((col) => serializeValue(row[col]));
    const placeholders = cols.map((_, index) => `$${index + 1}`).join(", ");
    const updateCols = cols
      .filter((col) => !conflict.includes(col))
      .map((col) => `${col} = EXCLUDED.${col}`)
      .join(", ");

    const query = `
      INSERT INTO ${table} (${cols.join(", ")})
      VALUES (${placeholders})
      ON CONFLICT (${conflict.join(", ")})
      DO UPDATE SET ${updateCols};
    `;

    await client.query(query, values);
  }
}

async function main() {
  const migrationPath = path.resolve(process.cwd(), "supabase/migrations/001_init.sql");
  const migrationSql = await readFile(migrationPath, "utf8");

  const client = new Client({
    connectionString: getDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    await client.query("BEGIN");
    await client.query(migrationSql);

    await upsertRows(client, "pages", defaultSnapshot.pages);
    await upsertRows(client, "page_translations", defaultSnapshot.page_translations);
    await upsertRows(client, "sections", defaultSnapshot.sections);
    await upsertRows(client, "section_translations", defaultSnapshot.section_translations);
    await upsertRows(client, "navigation_items", defaultSnapshot.navigation_items);
    await upsertRows(client, "navigation_translations", defaultSnapshot.navigation_translations);
    await upsertRows(client, "theme_tokens", defaultSnapshot.theme_tokens);
    await upsertRows(client, "media_assets", defaultSnapshot.media_assets);
    await upsertRows(client, "youtube_videos", defaultSnapshot.youtube_videos);
    await upsertRows(client, "site_settings", defaultSnapshot.site_settings);

    await client.query("COMMIT");
    console.log("Supabase setup complete: migration + seed finished.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
