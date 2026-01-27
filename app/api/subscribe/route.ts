import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const PENDING_FILE = join(process.cwd(), 'data', 'pending-subscriptions.json');
const WALLET = process.env.WHALESCOPE_WALLET || 'hyTku9MYUuBtCWPxqmeyWcBvYuUbVKfXtafjBr7eAh3';

function generateCode(): string {
  // 6 character alphanumeric code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function loadPending(): Record<string, { email: string; createdAt: string }> {
  if (!existsSync(PENDING_FILE)) return {};
  try {
    return JSON.parse(readFileSync(PENDING_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function savePending(data: Record<string, { email: string; createdAt: string }>) {
  writeFileSync(PENDING_FILE, JSON.stringify(data, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const pending = loadPending();
    
    // Check if email already has a pending code
    const existingCode = Object.entries(pending).find(([_, v]) => v.email === email)?.[0];
    if (existingCode) {
      return NextResponse.json({ code: existingCode, wallet: WALLET });
    }

    // Generate new unique code
    let code = generateCode();
    while (pending[code]) {
      code = generateCode();
    }

    pending[code] = { email, createdAt: new Date().toISOString() };
    savePending(pending);

    return NextResponse.json({ code, wallet: WALLET });
  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
