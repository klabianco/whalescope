/**
 * Watch for incoming USDC payments and activate subscriptions
 * Looks for email addresses in transaction memos
 * 
 * Run: npx tsx scripts/watch-payments.ts
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Config
const WALLET = process.env.WHALESCOPE_WALLET || 'hyTku9MYUuBtCWPxqmeyWcBvYuUbVKfXtafjBr7eAh3';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const SUBSCRIPTION_PRICE = 10;
const SUBSCRIPTION_DAYS = 30;

// Files
const DATA_DIR = join(process.cwd(), 'data');
const SUBSCRIBERS_FILE = join(DATA_DIR, 'subscribers.json');
const PROCESSED_FILE = join(DATA_DIR, 'processed-payments.json');

interface Subscriber {
  email: string;
  walletAddress: string;
  subscribedAt: string;
  expiresAt: string;
  paymentSignature: string;
}

function loadJson<T>(file: string, defaultValue: T): T {
  if (!existsSync(file)) return defaultValue;
  try {
    return JSON.parse(readFileSync(file, 'utf-8'));
  } catch {
    return defaultValue;
  }
}

function saveJson(file: string, data: unknown) {
  writeFileSync(file, JSON.stringify(data, null, 2));
}

function isValidEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

function sendWelcomeEmail(email: string) {
  const subject = 'Welcome to WhaleScope Pro! 🐋';
  const body = `Your subscription is now active!

You'll receive email alerts whenever Congress members make stock trades.

Your subscription is valid for 30 days.

View trades: https://whalescope.app/congress

Questions? Reply to this email.

- WhaleScope`;

  try {
    execSync(`gog gmail send --to "${email}" --subject "${subject}" --body "${body.replace(/"/g, '\\"')}"`, {
      stdio: 'pipe'
    });
    console.log(`  ✉️  Welcome email sent to ${email}`);
    return true;
  } catch (err) {
    console.error(`  ❌ Failed to send email to ${email}`);
    return false;
  }
}

async function main() {
  console.log('🐋 WhaleScope Payment Watcher\n');
  console.log(`Wallet: ${WALLET}`);
  console.log(`Looking for $${SUBSCRIPTION_PRICE}+ USDC with email memos...\n`);

  const connection = new Connection(RPC_URL);
  const walletPubkey = new PublicKey(WALLET);

  const subscribers = loadJson<Subscriber[]>(SUBSCRIBERS_FILE, []);
  const processed = loadJson<string[]>(PROCESSED_FILE, []);

  // Get recent transactions
  let signatures;
  try {
    signatures = await connection.getSignaturesForAddress(walletPubkey, { limit: 50 });
  } catch (err) {
    console.error('Failed to fetch transactions:', err);
    return;
  }

  let newSubscribers = 0;

  for (const sig of signatures) {
    if (processed.includes(sig.signature)) continue;

    try {
      const tx = await connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!tx?.meta || tx.meta.err) {
        processed.push(sig.signature);
        continue;
      }

      // Look for memo instruction
      let memo = '';
      for (const ix of tx.transaction.message.instructions) {
        if ((ix as any).program === 'spl-memo' || 
            (ix as any).programId?.toString() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr') {
          memo = (ix as any).parsed || '';
          break;
        }
      }

      // Check if memo is a valid email
      if (!memo || !isValidEmail(memo)) {
        processed.push(sig.signature);
        continue;
      }

      const email = memo.trim().toLowerCase();

      // Check if already subscribed
      const existing = subscribers.find(s => s.email === email);
      if (existing && new Date(existing.expiresAt) > new Date()) {
        console.log(`⏭️  ${email} already subscribed (expires ${existing.expiresAt})`);
        processed.push(sig.signature);
        continue;
      }

      // Check for USDC transfer
      const preBalances = tx.meta.preTokenBalances || [];
      const postBalances = tx.meta.postTokenBalances || [];
      
      const postUSDC = postBalances.find(
        (b: any) => b.mint === USDC_MINT && b.owner === WALLET
      );
      const preUSDC = preBalances.find(
        (b: any) => b.mint === USDC_MINT && b.owner === WALLET
      );

      const received = (postUSDC?.uiTokenAmount?.uiAmount || 0) - 
                       (preUSDC?.uiTokenAmount?.uiAmount || 0);

      if (received >= SUBSCRIPTION_PRICE) {
        const now = new Date();
        const expires = new Date(now.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

        // Remove old subscription if exists
        const idx = subscribers.findIndex(s => s.email === email);
        if (idx >= 0) subscribers.splice(idx, 1);

        subscribers.push({
          email,
          walletAddress: '',
          subscribedAt: now.toISOString(),
          expiresAt: expires.toISOString(),
          paymentSignature: sig.signature
        });

        console.log(`✅ New subscriber: ${email}`);
        console.log(`   Amount: $${received.toFixed(2)} USDC`);
        console.log(`   Expires: ${expires.toLocaleDateString()}`);

        sendWelcomeEmail(email);
        newSubscribers++;
      }

      processed.push(sig.signature);
    } catch (err) {
      // Skip failed parsing
    }
  }

  saveJson(SUBSCRIBERS_FILE, subscribers);
  saveJson(PROCESSED_FILE, processed);

  const activeCount = subscribers.filter(s => new Date(s.expiresAt) > new Date()).length;
  console.log(`\n✅ Done! ${newSubscribers} new subscriber(s)`);
  console.log(`Total active: ${activeCount}`);
}

main().catch(console.error);
