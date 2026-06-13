import { NextRequest, NextResponse } from 'next/server';
import { insertEntry } from '../../../lib/db';
import { validateSubmitPayload, ValidationError } from '../../../lib/validation';

const MAX_BODY_BYTES = 4096; // numeric-aggregate payloads are tiny; reject anything larger

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Reject oversized bodies before parsing (cheap parser-DoS guard)
    const contentLength = request.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false, error: 'Payload too large' }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }

    const data = validateSubmitPayload(body);
    await insertEntry(data);
    return NextResponse.json({ ok: true, message: 'Score submitted successfully' });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
    }
    console.error('Submit error:', err);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
