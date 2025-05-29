import { useRef, useEffect } from "react";
import { Game, Sound } from "phaser";
import { gridWorldConfig } from "@/utils/GridWorld";

const PhaserGame = () => {
  const gameContainer = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Game | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && gameContainer.current && !gameRef.current) {
      try {
        // Create game instance
        gameRef.current = new Game({
          ...gridWorldConfig,
          parent: gameContainer.current,
          audio: {
            // Add audio-specific config
            disableWebAudio: false,
            noAudio: false,
            context: audioContextRef.current || undefined
          }
        });

        // Store audio context reference
        gameRef.current.events.once('ready', () => {
          if (gameRef.current?.sound instanceof Sound.WebAudioSoundManager) {
            audioContextRef.current = gameRef.current.sound.context as AudioContext;
          }
        });
      } catch (error) {
        console.error("Phaser initialization failed:", error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        try {
          // Handle audio context properly
          if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
          }
          
          // Destroy game
          gameRef.current.destroy(true);
        } catch (cleanupError) {
          console.warn("Cleanup error:", cleanupError);
        } finally {
          gameRef.current = null;
          audioContextRef.current = null;
        }
      }
    };
  }, []);

  return <div ref={gameContainer} />;
};

export default PhaserGame;