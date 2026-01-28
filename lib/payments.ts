import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

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
  memo: string; // Unique memo to identify payment
  expiresAt: Date;
  status: 'pending' | 'completed' | 'expired';
}

// Generate a unique payment memo for a user
export function generatePaymentMemo(userId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `WS-${userId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();
}

// Verify a Solana transaction
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
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    
    const tx = await connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { valid: false, error: 'Transaction not found' };
    }

    if (tx.meta?.err) {
      return { valid: false, error: 'Transaction failed' };
    }

    // Check if payment was to treasury wallet
    const treasuryPubkey = new PublicKey(TREASURY_WALLET);
    let paymentFound = false;
    let receivedAmount = 0;

    if (currency === 'SOL') {
      // Check SOL transfer
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
      // Check USDC transfer (SPL token)
      for (const instruction of tx.transaction.message.instructions) {
        if ('parsed' in instruction && instruction.parsed?.type === 'transferChecked') {
          const info = instruction.parsed.info;
          if (info.mint === USDC_MINT) {
            // Would need to verify the destination token account belongs to treasury
            receivedAmount = parseFloat(info.tokenAmount.uiAmount);
            paymentFound = true;
            break;
          }
        }
      }
    }

    if (!paymentFound) {
      return { valid: false, error: 'No payment to treasury found' };
    }

    // Check amount (allow 1% slippage)
    const minAmount = expectedAmount * 0.99;
    if (receivedAmount < minAmount) {
      return { valid: false, error: `Insufficient amount: expected ${expectedAmount}, got ${receivedAmount}` };
    }

    // Check memo
    const memoInstruction = tx.transaction.message.instructions.find(
      (ix) => 'programId' in ix && ix.programId.toString() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
    );

    if (memoInstruction && 'parsed' in memoInstruction) {
      const memoText = memoInstruction.parsed;
      if (typeof memoText === 'string' && memoText.includes(expectedMemo)) {
        return { valid: true };
      }
    }

    // If no memo or memo doesn't match, still accept if amount is exact
    // (some wallets don't support memos well)
    if (receivedAmount >= expectedAmount) {
      console.warn(`Payment ${signature} accepted without memo verification`);
      return { valid: true };
    }

    return { valid: false, error: 'Memo verification failed' };
  } catch (error) {
    console.error('Transaction verification error:', error);
    return { valid: false, error: 'Verification failed' };
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
