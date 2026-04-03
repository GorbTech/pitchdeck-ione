'use client';
import { useRouter } from 'next/navigation';
import ProductLine from '../ProductLine';

export default function ProductsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <ProductLine
        onComplete={() => router.push('/')}
        voiceEnabled={true}
      />
    </div>
  );
}
