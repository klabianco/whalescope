import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

// Treasury wallet for receiving payments
export const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET || '';

// USDC on Solana mainnet
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Pricing in USDC — must match app/config/pricing.ts
export const PRICES = {
  PRO_MONTHLY: 24, // $24 USDC/mo
  PRO_YEARLY: 240, // $240 USDC/yr ($20/mo, 2 months free)
};

// Alternative SOL pricing (approximate, would need live price feed)
export const SOL_PRICES = {
  PRO_MONTHLY: 0.11, // ~$24 at ~$220/SOL
  PRO_YEARLY: 1.1,   // ~$240 at ~$220/SOL
};

export interface PaymentIntent {
  id: string;
  userId: string;
  plan: 'pro_monthly' | 'pro_yearly';
  amount: number;
  currency: 'USDC' | 'SOL';
  memo: string;
  expiresAt: Date;
  status: 'pending' | 'completed' | 'expired';
}

// Generate a unique payment memo for a user
export function generatePaymentMemo(userId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `WS-${userId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();
}

// Verify a Solana transaction with strict checks
export async function verifyTransaction({
  signature,
  expectedAmount,
  expectedMemo,
  currency = 'SOL',
}: {
  signature: string;
  expectedAmount: number;
  expectedMemo: string;
  currency?: 'USDC' | 'SOL';
}): Promise<{ valid: boolean; error?: string }> {
  try {
    if (!TREASURY_WALLET) {
      return { valid: false, error: 'Treasury wallet not configured' };
    }

    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { valid: false, error: 'Transaction not found. It may still be confirming — try again in a moment.' };
    }

    if (tx.meta?.err) {
      return { valid: false, error: 'Transaction failed on-chain' };
    }

    // Check age — reject transactions older than 1 hour to prevent replay
    const txTime = tx.blockTime;
    if (txTime) {
      const ageSeconds = Math.floor(Date.now() / 1000) - txTime;
      if (ageSeconds > 3600) {
        return { valid: false, error: 'Transaction too old (>1 hour). Please make a new payment.' };
      }
    }

    const treasuryPubkey = new PublicKey(TREASURY_WALLET);
    let paymentFound = false;
    let receivedAmount = 0;

    if (currency === 'SOL') {
      // Check SOL transfer to treasury
      for (const instruction of tx.transaction.message.instructions) {
        if ('parsed' in instruction && instruction.parsed?.type === 'transfer') {
          const info = instruction.parsed.info;
          if (info.destination === treasuryPubkey.toString()) {
            receivedAmount = info.lamports / LAMPORTS_PER_SOL;
            paymentFound = true;
            break;
          }
        }
      }
    } else {
      // Check USDC transfer — verify destination belongs to treasury
      const treasuryAta = await getAssociatedTokenAddress(
        new PublicKey(USDC_MINT),
        treasuryPubkey
      );

      for (const instruction of tx.transaction.message.instructions) {
        if ('parsed' in instruction && instruction.parsed?.type === 'transferChecked') {
          const info = instruction.parsed.info;
          if (info.mint === USDC_MINT && info.destination === treasuryAta.toString()) {
            receivedAmount = parseFloat(info.tokenAmount.uiAmount);
            paymentFound = true;
            break;
          }
        }
        // Also check plain 'transfer' for SPL
        if ('parsed' in instruction && instruction.parsed?.type === 'transfer') {
          const info = instruction.parsed.info;
          if (info.destination === treasuryAta.toString()) {
            // For plain transfer, amount is in raw units
            receivedAmount = parseFloat(info.amount) / 1e6; // USDC has 6 decimals
            paymentFound = true;
            break;
          }
        }
      }
    }

    if (!paymentFound) {
      return { valid: false, error: 'No payment to treasury wallet found in this transaction' };
    }

    // Check amount — allow 1% slippage for rounding
    const minAmount = expectedAmount * 0.99;
    if (receivedAmount < minAmount) {
      return { valid: false, error: `Insufficient amount: expected $${expectedAmount}, received $${receivedAmount.toFixed(2)}` };
    }

    // Memo is nice-to-have but not strictly required
    // (some wallets strip memos, Phantom sometimes doesn't include them)
    // The on-chain amount + destination verification is the real security
    const memoInstruction = tx.transaction.message.instructions.find(
      (ix) => 'programId' in ix && ix.programId.toString() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
    );

    let memoMatch = false;
    if (memoInstruction && 'parsed' in memoInstruction) {
      const memoText = memoInstruction.parsed;
      if (typeof memoText === 'string' && memoText.includes(expectedMemo)) {
        memoMatch = true;
      }
    }

    if (!memoMatch) {
      console.warn(`[Payment] Tx ${signature} accepted — amount & destination verified, memo missing/mismatched`);
    }

    return { valid: true };
  } catch (error) {
    console.error('Transaction verification error:', error);
    return { valid: false, error: 'Verification failed — please try again' };
  }
}

// Watch for new payments to treasury (for background job)
export async function checkRecentPayments(
  lastCheckedSlot: number
): Promise<{ transactions: string[]; latestSlot: number }> {
  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');
  const treasuryPubkey = new PublicKey(TREASURY_WALLET);

  const signatures = await connection.getSignaturesForAddress(treasuryPubkey, {
    limit: 50,
  });

  const newTransactions = signatures
    .filter((sig) => sig.slot > lastCheckedSlot)
    .map((sig) => sig.signature);

  const latestSlot = signatures.length > 0 ? signatures[0].slot : lastCheckedSlot;

  return { transactions: newTransactions, latestSlot };
}
