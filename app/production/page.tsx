'use client';
import { useRouter } from 'next/navigation';
import ImplementationImpact from '../ImplementationImpact';

export default function ProductionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <ImplementationImpact
        onComplete={() => router.push('/')}
        voiceEnabled={true}
      />
    </div>
  );
}
