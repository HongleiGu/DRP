"use client"

import dynamic from 'next/dynamic';

// Disable SSR for the Phaser component
const PhaserGame = dynamic(() => import('@/components/PhaserGame'), {
  ssr: false,
  loading: () => <p>Loading game...</p>
});

export default function GamePage() {
  return (
    <div>
      <PhaserGame />
    </div>
  );
}