import { Suspense } from 'react';
import FirehoseClient from './FirehoseClient';

export default function FirehosePage() {
  return (
    <Suspense>
      <FirehoseClient />
    </Suspense>
  );
}
