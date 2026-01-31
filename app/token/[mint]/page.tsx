import TokenClient from './TokenClient';

// Pre-render popular tokens (others handled by catch-all in not-found)
export function generateStaticParams() {
  return [
    { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' }, // BONK
    { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' }, // WIF
    { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' }, // JUP
    { mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3' }, // PYTH
    { mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' }, // RAY
    { mint: 'So11111111111111111111111111111111111111112' }, // SOL
    { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' }, // USDC
    { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' }, // USDT
    { mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So' }, // mSOL
    { mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn' }, // jitoSOL
    { mint: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs' }, // ETHER (Wormhole)
    { mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof' }, // RNDR
    { mint: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux' }, // HNT
    { mint: 'TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6' }, // TNSR
    { mint: 'WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p3LCpk' }, // WEN
    { mint: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5' }, // MEW
  ];
}

export default async function TokenPage({ params }: { params: Promise<{ mint: string }> }) {
  const { mint } = await params;
  return <TokenClient mint={mint} />;
}
