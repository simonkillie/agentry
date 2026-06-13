import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Metrics } from './metrics';
import { Profile } from './profiles';

export interface SubmitPayload {
  handle: string;
  scores: {
    parallelism: number;
    delegationDepth: number;
    handsOffRatio: number;
    runLength: number;
    composite: number;
  };
  profile: Profile;
  deviceHash: string;
  sessionCount: number;
  clientType: string;
}

// A random, install-local identifier. Stored once in ~/.agentry/install-id.
// device_hash is derived from THIS — never from hostname/username/platform —
// so it cannot be reconstructed or correlated to the user's machine identity.
function getInstallId(): string {
  const dir = path.join(os.homedir(), '.agentry');
  const file = path.join(dir, 'install-id');
  try {
    const existing = fs.readFileSync(file, 'utf-8').trim();
    if (existing) return existing;
  } catch {
    // not created yet
  }
  const id = crypto.randomUUID();
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, id, { mode: 0o600 });
  } catch {
    // if we can't persist, fall back to an ephemeral id (dedup just won't persist)
  }
  return id;
}

export function getDeviceHash(): string {
  return crypto.createHash('sha256').update(getInstallId()).digest('hex').slice(0, 16);
}

// Anonymous, stable-per-install display name. Never contains the OS username.
export function getDefaultHandle(): string {
  return `dev-${getDeviceHash().slice(0, 6)}`;
}

export function buildPayload(opts: {
  metrics: Metrics;
  profile: Profile;
  handle?: string;
  clientType?: string;
}): SubmitPayload {
  const { metrics, profile, handle = getDefaultHandle(), clientType = 'Claude Code' } = opts;

  // Payload carries only numeric scores plus an anonymous handle/device hash —
  // no session content, no prompt text, no message body, no timestamps, no paths.
  return {
    handle,
    scores: {
      parallelism: Math.round(metrics.parallelism * 10) / 10,
      delegationDepth: Math.round(metrics.delegationDepth * 10) / 10,
      handsOffRatio: Math.round(metrics.handsOffRatio * 10) / 10,
      runLength: Math.round(metrics.runLength * 10) / 10,
      composite: Math.round(metrics.composite * 10) / 10,
    },
    profile,
    deviceHash: getDeviceHash(),
    sessionCount: metrics.sessionCount,
    clientType,
  };
}

export async function submitPayload(
  payload: SubmitPayload,
  endpoint = 'https://agentry-cli.vercel.app/api/submit',
): Promise<{ ok: boolean; message: string }> {
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        handle: payload.handle,
        score: payload.scores.composite,
        profile: payload.profile,
        device_hash: payload.deviceHash,
        parallelism_score: payload.scores.parallelism,
        delegation_score: payload.scores.delegationDepth,
        hands_off_score: payload.scores.handsOffRatio,
        run_length_score: payload.scores.runLength,
        client_type: payload.clientType,
      }),
    });
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Network error' };
  }

  if (!response.ok) {
    return { ok: false, message: `Server returned ${response.status}` };
  }

  return response.json() as Promise<{ ok: boolean; message: string }>;
}
