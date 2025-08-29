"use client";

import { useEffect, useRef, useState } from "react";
import * as ex from "excalibur";
import { initializeGame } from "./engine";
import { Resources } from "@/game/config/resources";
import { Alert, Button } from "antd";
import { useRouter } from "next/navigation";
import { resetPlayerToDefault } from "@/utils/api";
import globalStore from "@/store";
import { SceneCallbacks, SupabaseUser } from "@/types/datatypes";

export default function Game({
  chatroomId,
  chatPanelVisible,
  setChatPanelVisible,
}: {
  chatroomId: string,
  chatPanelVisible: boolean,
  setChatPanelVisible: (visible: boolean) => void
}) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<ex.Engine | null>(null);
  const [, setUser] = useState<SupabaseUser>(null!)

  useEffect(() => {
    let game: ex.Engine;
    const helper = async () => {
      if (!canvasRef.current) return;
      const u = await globalStore.getItem<SupabaseUser>('lumiroom-user')
      if (!u?.id) {
        alert("you have not logged in yet");
        router.push("/");
        return;
      }
      if (!u?.onboarding_complete) {
        alert("you are not onboard yet");
        router.push("/onboarding");
        return;
      }
      setUser(u)
      await resetPlayerToDefault(
        u?.id,
        chatroomId
      );


      game = new ex.Engine({
        resolution: { width: 256, height: 256 },
        suppressPlayButton: true,
        canvasElement: canvasRef.current,
        displayMode: ex.DisplayMode.FitContainerAndFill,
        pixelArt: true,
        pixelRatio: 4,
      });

      gameRef.current = game;

      // Initialize game with callbacks
      const sceneCallbacks: SceneCallbacks = {
        showInteractButtonCalendar: () => {},
        showInteractButtonTV: () => {}
      }
      initializeGame(
        game,
        sceneCallbacks,
        u,
        chatroomId
      );

      const loader = new ex.Loader();
      for (const resource of Object.values(Resources)) {
        if (Array.isArray(resource)) {
          for (const res of resource) {
            loader.addResource(res);
          }
        } else {
          loader.addResource(resource);
        }
      }

      const inTransition = new ex.FadeInOut({
        duration: 1000,
        direction: "in",
        color: ex.Color.ExcaliburBlue,
      });

      game
        .start("overworld", { loader, inTransition })
        .then(() => {
          console.log("Game started successfully");
        })
        .catch((err) => {
          console.error("Game failed to start:", err);
        });
    };
    helper();

    return () => {
      if (game) {
        game.stop();
        gameRef.current = null;
      }
    };
  }, [chatroomId, router]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Buttons container - positioned bottom right */}
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 16,
          display: "flex",
          flexDirection: "column",
          gap: "12px", // spacing between buttons
          zIndex: 10,
          width: 120,
        }}
      >
        <Button onClick={() => setChatPanelVisible(!chatPanelVisible)} block>
          {chatPanelVisible ? "Hide Chat" : "Show Chat"}
        </Button>
        <Alert message="Use WASD or arrow keys to move" type="info" showIcon />
      </div>
    </div>
  );
}
