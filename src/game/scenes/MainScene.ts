import { Scene, vec, Vector } from "excalibur";
import { Resources } from "../config/resources";
import { Player } from "../actors/Player";
import { OtherPlayer } from "../actors/OtherPlayer";
import { Television } from "../actors/Television";
import { Calendar } from "../actors/Calendar";
import { PlayerData, SceneCallbacks } from "@/types/datatypes";
import { supabase } from "@/lib/supabase";
import { getPlayers } from "@/utils/api";

export class MainScene extends Scene {
  private player!: Player;
  private television!: Television;
  private calendar!: Calendar;
  private otherPlayers: Record<string, OtherPlayer> = {};
  private readonly INTERACTION_DISTANCE = 30;
  private callbacks: SceneCallbacks;
  private roomId: string;
  private userId: string;
  private username: string;
  private lastBroadcast = 0;
  private lastPersist = 0;
  private BROADCAST_INTERVAL = 100; // ms
  private PERSIST_INTERVAL = 1000;   // ms

  constructor(callbacks: SceneCallbacks = {}, userId: string, roomId: string, username: string) {
    super();
    this.callbacks = callbacks;
    this.userId = userId;
    this.roomId = roomId;
    this.username = username;
  }

  async onInitialize(): Promise<void> {
    Resources.LdtkResource.addToScene(this, {
      pos: vec(0, 0),
      levelFilter: ["Level_0"]
    });
    this.findEntities();
    await this.initPlayers(this.roomId);
    this.setupRealtimeChannel();
  }

  private findEntities() {
    this.player = this.world.entityManager.getByName(this.username)[0] as Player;
    this.television = this.world.entityManager.getByName("Television")[0] as Television;
    this.calendar = this.world.entityManager.getByName("Calendar")[0] as Calendar;
  }

  onPostAdd() {
    this.findEntities();
  }

  onActivate(): void {
    if (this.player) {
      this.camera.strategy.lockToActor(this.player);
      const bounds = Resources.LdtkResource.getLevelBounds(["Level_0"]);
      this.camera.strategy.limitCameraBounds(bounds);
    }
  }

  onPreUpdate(): void {
    if (this.callbacks.showInteractButtonTV) {
      this.callbacks.showInteractButtonTV(this.isPlayerNearTV());
    }
    if (this.callbacks.showInteractButtonCalendar) {
      this.callbacks.showInteractButtonCalendar(this.isPlayerNearCalendar());
    }

    const now = Date.now();
    if (this.player) {
      if (now - this.lastBroadcast > this.BROADCAST_INTERVAL) {
        supabase.channel(`realtime:room:${this.roomId}`)
          .send({
            type: "broadcast",
            event: "player_move",
            payload: {
              user_id: this.userId,
              room_id: this.roomId,
              name: this.username,
              avatarId: this.player.avatarId,
              x: this.player.pos.x,
              y: this.player.pos.y
            },
          });
        this.lastBroadcast = now;
      }

      if (now - this.lastPersist > this.PERSIST_INTERVAL) {
        supabase
          .from("players")
          .update({ x: this.player.pos.x, y: this.player.pos.y })
          .eq("user_id", this.userId)
          .eq("room_id", this.roomId);
        this.lastPersist = now;
      }
    }
  }

  private isPlayerNearTV(): boolean {
    if (!this.player || !this.television) return false;
    return this.player.globalPos.distance(this.television.globalPos) <= this.INTERACTION_DISTANCE;
  }

  private isPlayerNearCalendar(): boolean {
    if (!this.player || !this.calendar) return false;
    return this.player.globalPos.distance(this.calendar.globalPos) <= this.INTERACTION_DISTANCE;
  }

  private async initPlayers(roomId: string) {
    const players = await getPlayers(roomId);
    if (!players) return;

    players.forEach(playerData => {
      const pos = vec(playerData.x, playerData.y);
      if (playerData.user_id === this.userId) {
        this.player.pos = pos;
      } else {
        console.log(playerData.name)
        const other = new OtherPlayer({
          pos,
          z: 15,
          width: 16,
          height: 16,
          anchor: new Vector(0.5, 0.5),
          userId: playerData.user_id,
          roomId: playerData.room_id,
          name: playerData.name,
          avatarId: playerData.avatarId,
        });
        this.otherPlayers[playerData.user_id] = other;
        this.add(other);
      }
    });
  }

  private setupRealtimeChannel() {
    supabase
      .channel(`realtime:room:${this.roomId}`)
      .on("broadcast", { event: "player_move" }, ({ payload }) => {
        const data = payload as PlayerData;
        if (data.user_id === this.userId) return;
        console.log("player payload", payload, this.otherPlayers)

        const pos = vec(data.x, data.y);
        const other = this.otherPlayers[data.user_id];
        if (other) {
          other.walkTo(pos);
        }
        // } else {
        //   const newOther = new OtherPlayer({
        //     pos,
        //     z: 15,
        //     width: 16,
        //     height: 16,
        //     anchor: vec(0.5, 0.5),
        //     userId: data.user_id,
        //     roomId: data.room_id,
        //     name: data.name,
        //     avatarId: data.avatarId
        //   });
        //   this.otherPlayers[data.id] = newOther;
        //   this.add(newOther);
        // }
      })
      .subscribe();
  }

  onDeactivate(): void {
    supabase.removeAllChannels();
    this.otherPlayers = {};
  }
}
