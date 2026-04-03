'use client';
import { useRouter } from 'next/navigation';
import TechDemo from '../TechDemo';

export default function TechPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-900">
      <TechDemo
        onBack={() => router.push('/')}
        voiceEnabled={true}
      />
    </div>
  );
}
