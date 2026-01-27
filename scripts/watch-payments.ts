/**
 * Watch for incoming USDC payments and activate subscriptions
 * 
 * Run: npx tsx scripts/watch-payments.ts
 * Or add to cron to check every few minutes
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Config
const WALLET = process.env.WHALESCOPE_WALLET || '';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // Solana USDC
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const SUBSCRIPTION_PRICE = 10; // $10 USDC
const SUBSCRIPTION_DAYS = 30;

// Files
const DATA_DIR = join(process.cwd(), 'data');
const PENDING_FILE = join(DATA_DIR, 'pending-subscriptions.json');
const SUBSCRIBERS_FILE = join(DATA_DIR, 'subscribers.json');
const PROCESSED_FILE = join(DATA_DIR, 'processed-payments.json');

interface PendingEntry {
  email: string;
  createdAt: string;
}

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

function sendWelcomeEmail(email: string) {
  const subject = 'Welcome to WhaleScope Pro! 🐋';
  const body = `Your subscription is now active!

You'll receive email alerts whenever Congress members make stock trades.

Your subscription is valid for 30 days.

Questions? Reply to this email.

- WhaleScope`;

  try {
    // Using gog CLI to send via Gmail
    execSync(`gog gmail send --to "${email}" --subject "${subject}" --body "${body}"`, {
      stdio: 'inherit'
    });
    console.log(`  ✉️  Welcome email sent to ${email}`);
  } catch (err) {
    console.error(`  ❌ Failed to send email to ${email}:`, err);
  }
}

async function main() {
  if (!WALLET) {
    console.error('❌ Set WHALESCOPE_WALLET environment variable');
    process.exit(1);
  }

  console.log('🐋 WhaleScope Payment Watcher\n');
  console.log(`Wallet: ${WALLET}`);
  console.log(`Checking for $${SUBSCRIPTION_PRICE} USDC payments...\n`);

  const connection = new Connection(RPC_URL);
  const walletPubkey = new PublicKey(WALLET);

  // Load data
  const pending = loadJson<Record<string, PendingEntry>>(PENDING_FILE, {});
  const subscribers = loadJson<Subscriber[]>(SUBSCRIBERS_FILE, []);
  const processed = loadJson<string[]>(PROCESSED_FILE, []);

  if (Object.keys(pending).length === 0) {
    console.log('No pending subscriptions to match.');
    return;
  }

  console.log(`Pending codes: ${Object.keys(pending).join(', ')}\n`);

  // Get recent transactions
  const signatures = await connection.getSignaturesForAddress(walletPubkey, { limit: 50 });
  
  let newSubscribers = 0;

  for (const sig of signatures) {
    if (processed.includes(sig.signature)) continue;

    try {
      const tx = await connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0
      });

      if (!tx?.meta || tx.meta.err) continue;

      // Check memo for payment code
      const memoInstruction = tx.transaction.message.instructions.find(
        (ix: any) => ix.program === 'spl-memo' || ix.programId?.toString() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
      );

      const memo = (memoInstruction as any)?.parsed || '';
      const code = memo.trim().toUpperCase();

      if (!pending[code]) continue;

      // Check if it's a USDC transfer of correct amount
      const preBalances = tx.meta.preTokenBalances || [];
      const postBalances = tx.meta.postTokenBalances || [];
      
      // Simple check: look for USDC transfer to our wallet
      const usdcTransfer = postBalances.find(
        (b: any) => b.mint === USDC_MINT && b.owner === WALLET
      );

      if (usdcTransfer) {
        const preBalance = preBalances.find(
          (b: any) => b.mint === USDC_MINT && b.owner === WALLET
        );
        const received = ((usdcTransfer.uiTokenAmount?.uiAmount || 0) - 
                         (preBalance?.uiTokenAmount?.uiAmount || 0));

        if (received >= SUBSCRIPTION_PRICE) {
          // Payment confirmed!
          const { email } = pending[code];
          const now = new Date();
          const expires = new Date(now.getTime() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000);

          const subscriber: Subscriber = {
            email,
            walletAddress: '', // Could extract from tx if needed
            subscribedAt: now.toISOString(),
            expiresAt: expires.toISOString(),
            paymentSignature: sig.signature
          };

          subscribers.push(subscriber);
          delete pending[code];
          processed.push(sig.signature);

          console.log(`✅ New subscriber: ${email}`);
          console.log(`   Code: ${code}`);
          console.log(`   Expires: ${expires.toLocaleDateString()}`);

          sendWelcomeEmail(email);
          newSubscribers++;
        }
      }
    } catch (err) {
      // Skip failed tx parsing
    }
  }

  // Save updated data
  saveJson(PENDING_FILE, pending);
  saveJson(SUBSCRIBERS_FILE, subscribers);
  saveJson(PROCESSED_FILE, processed);

  console.log(`\n✅ Done! ${newSubscribers} new subscriber(s)`);
  console.log(`Total active subscribers: ${subscribers.filter(s => new Date(s.expiresAt) > new Date()).length}`);
}

main().catch(console.error);
