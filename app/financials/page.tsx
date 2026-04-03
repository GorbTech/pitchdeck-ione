'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import GrantImpact from '../GrantImpact';
import VCImpact from '../VCImpact';

function FinancialsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'vc';

  if (type === 'grant') {
    return (
      <div className="min-h-screen bg-zinc-900">
        <GrantImpact
          onComplete={() => router.push('/')}
          voiceEnabled={true}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      <VCImpact
        onComplete={() => router.push('/')}
        voiceEnabled={true}
        focus="DEEP_TECH"
      />
    </div>
  );
}

export default function FinancialsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-900" />}>
      <FinancialsContent />
    </Suspense>
  );
}
