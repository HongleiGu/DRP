/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useEffect, useRef, useState } from "react";
import { Engine, DisplayMode, Color, FadeInOut, Loader } from "excalibur";
import { initializeGame } from "./engine";
import { Resources } from "@/game/config/resources";
import { Alert, Button, Card } from "antd";
// import { CalendarOutlined, YoutubeOutlined } from "@ant-design/icons";
import { useParams, useRouter } from "next/navigation";
import MarkdownCalendar from "../Calendar";
import { resetPlayerToDefault } from "@/utils/api";
import globalStore from "@/store";
import { SupabaseUser } from "@/types/datatypes";
// import { useGlobalStore } from "@/store";

export default function Game({
  sendMessage,
  addReceiver,
  chatroomId,
  chatPanelVisible,
  setChatPanelVisible,
}: any) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showButtonTV, setShowButtonTV] = useState(false);
  const [showButtonCalendar, setShowButtonCalendar] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const gameRef = useRef<Engine | null>(null);
  // const params = useParams<{ id: string }>()
  // const { user } = useGlobalStore.getState();
  // const user = JSON.parse(globalStore.getItem('lumiroom-user') ?? "") as SupabaseUser
  const [user, setUser] = useState<SupabaseUser>(null!)
  const isInCalendarAreaRef = useRef(false);
  const hasPromptedCalendarRef = useRef(false);
  const isInTVAreaRef = useRef(false);
  const hasPromptedTVRef = useRef(false);

  useEffect(() => {
    let game: ex.Engine;
    const helper = async () => {
      if (!canvasRef.current) return;
      const u = JSON.parse(await globalStore.getItem('lumiroom-user') ?? "{}") as SupabaseUser
      setUser(u)
      if (!u?.id) {
        alert("you have not logged in yet");
        router.push("/");
        return;
      }
      if (!u?.username) {
        alert("you are not onboard yet");
        router.push("/onboarding");
        return;
      }
      await resetPlayerToDefault(
        u?.id,
        u?.username as string,
        chatroomId,
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

      // Create callbacks object
      const sceneCallbacks = {
        showInteractButtonTV: (visible: boolean) => {
          if (visible) {
            if (!isInTVAreaRef.current) {
              isInTVAreaRef.current = true;

              if (!hasPromptedTVRef.current) {
                setShowButtonTV(true);
                hasPromptedTVRef.current = true;
              }
            }
          } else {
            isInTVAreaRef.current = false;
            hasPromptedTVRef.current = false;
            setShowButtonTV(false);
          }
        },

        showInteractButtonCalendar: (visible: boolean) => {
          if (visible) {
            if (!isInCalendarAreaRef.current) {
              isInCalendarAreaRef.current = true;

              if (!hasPromptedCalendarRef.current) {
                setShowButtonCalendar(true);
                hasPromptedCalendarRef.current = true;
              }
            }
          } else {
            isInCalendarAreaRef.current = false;
            hasPromptedCalendarRef.current = false;
            setShowButtonCalendar(false);
          }
        },
      };

      // Initialize game with callbacks
      // console.log("inited room", chatroomId);
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
  }, [])

  const handleTVButtonClick = () => {
    hasPromptedTVRef.current = true; // 确保不回到页面时误弹
    router.push(`/television/${chatroomId}`);
  };

  const handleCalendarButtonClick = () => {
    // router.push(`/television/${chatroomId}`)
    setIsCalendarOpen(true);
  };

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />

      {showButtonCalendar && (
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            width: "14%", // 屏幕大约1/7
            minWidth: 180,
          }}
        >
          <Card
            size="small"
            style={{
              backgroundColor: "#fffbe6",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              📅 Calendar
            </div>
            <div style={{ fontSize: 12, marginBottom: 12, color: "#555" }}>
              Do you want to check schedule?
            </div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <Button
                size="small"
                type="primary"
                onClick={handleCalendarButtonClick}
              >
                Enter
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setShowButtonCalendar(false); // 仅隐藏提示，不重置进入状态
                  hasPromptedCalendarRef.current = true;
                }}
              >
                Skip
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showButtonTV && (
  <div
    style={{
      position: "absolute",
      top: "20%",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 20,
      width: "14%", // 屏幕大约1/7
      minWidth: 180,
    }}
  >
    <Card
      size="small"
      style={{
        // backgroundColor: "#e6f7ff",
        borderRadius: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
        📺 Television
      </div>
      <div style={{ fontSize: 12, marginBottom: 12, color: "#555" }}>
        Do you want to enter the TV room?
      </div>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <Button
          size="small"
          type="primary"
          onClick={handleTVButtonClick}
        >
          Enter
        </Button>
        <Button
          size="small"
          onClick={() => {
            setShowButtonTV(false);
            hasPromptedTVRef.current = true;
          }}
        >
          Skip
        </Button>
      </div>
    </Card>
  </div>
)}


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
        {/* <Button
        type="default"
        onClick={handleButtonClickChat}
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: '8px',
          padding: '10px 20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        Open Chatroom
      </Button> */}
        <Alert message="Use WASD or arrow keys to move" type="info" showIcon />
      </div>
      <MarkdownCalendar
        isOpen={isCalendarOpen}
        roomId={chatroomId}
        onClose={() => setIsCalendarOpen(false)}
      />
    </div>
  );
}
