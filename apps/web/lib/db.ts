import { neon } from '@neondatabase/serverless';

export interface Entry {
  id: number;
  handle: string;
  score: number;
  profile: string;
  parallelism_score: number | null;
  delegation_score: number | null;
  hands_off_score: number | null;
  run_length_score: number | null;
  client_type: string | null;
  username: string | null;
  created_at: string;
}

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  return neon(url, { fetchOptions: { cache: 'no-store' } });
}

// Run once at server startup via instrumentation.ts — not in request handlers.
export async function ensureSchema(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS entries (
      id SERIAL PRIMARY KEY,
      handle TEXT NOT NULL,
      score NUMERIC(5,2) NOT NULL,
      profile TEXT NOT NULL,
      device_hash TEXT,
      parallelism_score NUMERIC(5,2),
      delegation_score NUMERIC(5,2),
      hands_off_score NUMERIC(5,2),
      run_length_score NUMERIC(5,2),
      client_type TEXT,
      username TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE entries ADD COLUMN IF NOT EXISTS client_type TEXT`;
  await sql`ALTER TABLE entries ADD COLUMN IF NOT EXISTS username TEXT`;
  // Add UNIQUE constraint on device_hash if not already present
  await sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'entries_device_hash_key' AND conrelid = 'entries'::regclass
      ) THEN
        ALTER TABLE entries ADD CONSTRAINT entries_device_hash_key UNIQUE (device_hash);
      END IF;
    END $$
  `;
}

type EntryData = {
  handle: string;
  score: number;
  profile: string;
  device_hash?: string | null;
  parallelism_score?: number | null;
  delegation_score?: number | null;
  hands_off_score?: number | null;
  run_length_score?: number | null;
  client_type?: string | null;
  username?: string | null;
};

async function upsertByDeviceHash(data: EntryData): Promise<void> {
  const sql = getSql();
  // Atomic upsert — no TOCTOU race between SELECT and INSERT/UPDATE
  await sql`
    INSERT INTO entries
      (handle, score, profile, device_hash, parallelism_score, delegation_score,
       hands_off_score, run_length_score, client_type, username)
    VALUES
      (${data.handle}, ${data.score}, ${data.profile}, ${data.device_hash ?? null},
       ${data.parallelism_score ?? null}, ${data.delegation_score ?? null},
       ${data.hands_off_score ?? null}, ${data.run_length_score ?? null},
       ${data.client_type ?? null}, ${data.username ?? null})
    ON CONFLICT (device_hash) DO UPDATE SET
      handle            = EXCLUDED.handle,
      score             = EXCLUDED.score,
      profile           = EXCLUDED.profile,
      parallelism_score = EXCLUDED.parallelism_score,
      delegation_score  = EXCLUDED.delegation_score,
      hands_off_score   = EXCLUDED.hands_off_score,
      run_length_score  = EXCLUDED.run_length_score,
      client_type       = EXCLUDED.client_type,
      username          = EXCLUDED.username,
      created_at        = NOW()
  `;
}

export async function insertEntry(data: {
  handle: string;
  score: number;
  profile: string;
  device_hash?: string | null;
  parallelism_score?: number | null;
  delegation_score?: number | null;
  hands_off_score?: number | null;
  run_length_score?: number | null;
  client_type?: string | null;
  username?: string | null;
}): Promise<void> {
  const sql = getSql();

  if (data.device_hash) {
    try {
      await upsertByDeviceHash(data);
    } catch (err) {
      // If the UNIQUE constraint isn't there yet (cold DB before instrumentation
      // ran), Postgres throws 42P10. Create the schema/constraint once, then retry —
      // so a missing constraint can never surface as a 500.
      const code = (err as { code?: string })?.code;
      if (code === '42P10') {
        await ensureSchema();
        await upsertByDeviceHash(data);
      } else {
        throw err;
      }
    }
  } else {
    await sql`
      INSERT INTO entries
        (handle, score, profile, parallelism_score, delegation_score,
         hands_off_score, run_length_score, client_type, username)
      VALUES
        (${data.handle}, ${data.score}, ${data.profile},
         ${data.parallelism_score ?? null}, ${data.delegation_score ?? null},
         ${data.hands_off_score ?? null}, ${data.run_length_score ?? null},
         ${data.client_type ?? null}, ${data.username ?? null})
    `;
  }
}

export async function getLeaderboard(): Promise<Entry[]> {
  const sql = getSql();
  // device_hash intentionally excluded — it is an internal identity key, not for clients
  const rows = await sql`
    SELECT id, handle, score, profile,
           parallelism_score, delegation_score, hands_off_score, run_length_score,
           client_type, username, created_at
    FROM entries
    ORDER BY score DESC, created_at ASC
    LIMIT 100
  `;
  return rows as unknown as Entry[];
}
