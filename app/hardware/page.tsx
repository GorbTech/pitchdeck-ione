'use client';
import { useRouter } from 'next/navigation';
import HardwareDeepDive from '../HardwareDeepDive';

export default function HardwarePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#111113]">
      <HardwareDeepDive
        onComplete={() => router.push('/')}
        voiceEnabled={true}
      />
    </div>
  );
}
