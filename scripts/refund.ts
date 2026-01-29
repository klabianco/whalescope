// Refund USDC from treasury wallet back to a specified address
// Usage: npx tsx scripts/refund.ts <recipient_wallet> <amount_usdc>

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { Transaction } from '@solana/web3.js';

const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
const USDC_DECIMALS = 6;

async function refund() {
  const recipient = process.argv[2];
  const amount = parseFloat(process.argv[3]);

  if (!recipient || !amount) {
    console.error('Usage: npx tsx scripts/refund.ts <recipient_wallet> <amount_usdc>');
    process.exit(1);
  }

  // Load treasury keypair
  const wallets = require('/Users/kevinl/.config/wren-wallets/wallets.json');
  const secretKeyHex = wallets.solana.secretKey;
  const secretKeyBytes = Buffer.from(secretKeyHex, 'hex');
  const keypair = Keypair.fromSecretKey(secretKeyBytes);
  
  console.log(`Treasury: ${keypair.publicKey.toBase58()}`);
  console.log(`Recipient: ${recipient}`);
  console.log(`Amount: ${amount} USDC`);

  const connection = new Connection(
    process.env.SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=67cbeef9-62f1-4066-8db0-c0e4102a950c',
    'confirmed'
  );

  const recipientPubkey = new PublicKey(recipient);
  
  // Get token accounts
  const fromAta = await getAssociatedTokenAddress(USDC_MINT, keypair.publicKey);
  const toAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey);

  // Check balance
  try {
    const balance = await connection.getTokenAccountBalance(fromAta);
    console.log(`Treasury USDC balance: ${balance.value.uiAmount}`);
    
    if ((balance.value.uiAmount || 0) < amount) {
      console.error(`Insufficient balance: ${balance.value.uiAmount} < ${amount}`);
      process.exit(1);
    }
  } catch (e) {
    console.error('Could not check balance - treasury may not have a USDC token account yet');
    process.exit(1);
  }

  // Create transfer instruction
  const transferIx = createTransferInstruction(
    fromAta,
    toAta,
    keypair.publicKey,
    amount * Math.pow(10, USDC_DECIMALS),
    [],
    TOKEN_PROGRAM_ID
  );

  const tx = new Transaction().add(transferIx);
  tx.feePayer = keypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  tx.sign(keypair);

  console.log('Sending refund transaction...');
  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(sig, 'confirmed');
  
  console.log(`✅ Refund complete!`);
  console.log(`Signature: ${sig}`);
  console.log(`View: https://solscan.io/tx/${sig}`);
}

refund().catch(err => {
  console.error('Refund failed:', err.message);
  process.exit(1);
});
