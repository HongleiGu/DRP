"use client"

import dynamic from 'next/dynamic';
import { Button } from "antd";
import { useRouter } from "next/navigation";

// Disable SSR for the Phaser component
const PhaserGame = dynamic(() => import('@/components/PhaserGame'), {
  ssr: false,
  loading: () => <p>Loading game...</p>
});

export default function GamePage() {
  const router = useRouter();
  return (
    <div>
      <PhaserGame />
      <Button
        onClick={() => router.push("/")}
      >Homepage</Button>
    </div>
  );
}