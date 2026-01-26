import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import PoliticianClient from './PoliticianClient';

interface Trade {
  politician: string;
}

// Generate static params for all politicians in the data
export function generateStaticParams() {
  try {
    const dataPath = join(process.cwd(), 'data', 'congress-trades.json');
    if (!existsSync(dataPath)) return [];
    
    const trades: Trade[] = JSON.parse(readFileSync(dataPath, 'utf-8'));
    const uniquePoliticians = new Set<string>();
    
    for (const trade of trades) {
      if (trade.politician) {
        const slug = trade.politician.toLowerCase().replace(/ /g, '-');
        uniquePoliticians.add(slug);
      }
    }
    
    return Array.from(uniquePoliticians).map(slug => ({ slug }));
  } catch {
    return [];
  }
}

export default function PoliticianPage({ params }: { params: { slug: string } }) {
  return <PoliticianClient slug={params.slug} />;
}
