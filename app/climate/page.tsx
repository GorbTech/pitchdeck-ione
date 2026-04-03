'use client';
import { useRouter } from 'next/navigation';
import ClimateImpact from '../ClimateImpact';

export default function ClimatePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <ClimateImpact
        onComplete={() => router.push('/')}
        voiceEnabled={true}
      />
    </div>
  );
}
