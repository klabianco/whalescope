import TokenClient from './TokenClient';

// Pre-render popular tokens
export function generateStaticParams() {
  return [
    { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' }, // BONK
    { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm' }, // WIF
    { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' }, // JUP
    { mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3' }, // PYTH
    { mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R' }, // RAY
  ];
}

export default function TokenPage({ params }: { params: { mint: string } }) {
  return <TokenClient mint={params.mint} />;
}
