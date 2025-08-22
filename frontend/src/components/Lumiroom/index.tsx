/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useEffect, useRef, useState } from "react";
import { Engine, DisplayMode, Color, FadeInOut, Loader } from "excalibur";
import { initializeGame } from "./engine";
import { Resources } from "@/game/config/resources";
import { Alert, Button, Card } from "antd";
// import { CalendarOutlined, YoutubeOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
// import MarkdownCalendar from "../Calendar";
import { resetPlayerToDefault } from "@/utils/api";
import globalStore from "@/store";
import { SceneCallbacks, SupabaseUser } from "@/types/datatypes";
// import { useGlobalStore } from "@/store";

export default function Game({
  chatroomId,
  chatPanelVisible,
  setChatPanelVisible,
}: any) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Engine | null>(null);
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
        chatroomId,
        u?.username as string,
        u?.avatar_id.toString() ?? "0"
      );


      game = new Engine({
        resolution: { width: 256, height: 256 },
        suppressPlayButton: true,
        canvasElement: canvasRef.current,
        displayMode: DisplayMode.FitContainerAndFill,
        pixelArt: true,
        pixelRatio: 4,
      });

      gameRef.current = game;

      // Initialize game with callbacks
      // console.log("inited room", chatroomId);
      const sceneCallbacks: SceneCallbacks = {
        showInteractButtonCalendar: () => {},
        showInteractButtonTV: () => {}
      }
      initializeGame(
        game,
        sceneCallbacks,
        u?.id ?? "unknown",
        u?.username ?? "Player",
        chatroomId,
        u?.avatar_id?.toString() ?? "0",
      );

      const loader = new Loader();
      for (const resource of Object.values(Resources)) {
        if (Array.isArray(resource)) {
          for (const res of resource) {
            loader.addResource(res);
          }
        } else {
          loader.addResource(resource);
        }
      }

      const inTransition = new FadeInOut({
        duration: 1000,
        direction: "in",
        color: Color.ExcaliburBlue,
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
      game.stop();
      gameRef.current = null;
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
