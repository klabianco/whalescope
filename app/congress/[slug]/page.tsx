import PoliticianClient from './PoliticianClient';

// Pre-render top politicians
export function generateStaticParams() {
  return [
    { slug: 'nancy-pelosi' },
    { slug: 'tommy-tuberville' },
    { slug: 'dan-crenshaw' },
    { slug: 'josh-gottheimer' },
    { slug: 'mark-green' },
  ];
}

export default function PoliticianPage({ params }: { params: { slug: string } }) {
  return <PoliticianClient slug={params.slug} />;
}
