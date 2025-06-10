import { Scene, vec, Vector } from "excalibur";
import { Resources } from "../config/resources";
import { Player } from "../actors/Player";
import { OtherPlayer } from "../actors/OtherPlayer";
import { Television } from "../actors/Television";
import { Calendar } from "../actors/Calendar";
import { PlayerData, SceneCallbacks } from "@/types/datatypes";
import { supabase } from "@/lib/supabase";
import { getPlayers } from "@/utils/api";
import { RealtimeChannel } from "@supabase/supabase-js";
import { UPDATE_INTERVAL } from "@/utils/utils";

export class MainScene extends Scene {
  private player!: Player;
  private television!: Television;
  private calendar!: Calendar;
  private otherPlayers: Record<string, OtherPlayer> = {};
  private readonly INTERACTION_DISTANCE = 30;
  private callbacks: SceneCallbacks;
  private roomId: string;
  private userId: string;
  private playerRealtimeChannel: RealtimeChannel | null = null;
  private username: string;

  constructor(callbacks: SceneCallbacks = {}, userId: string, roomId: string, username: string) {
    super();
    this.callbacks = callbacks;
    this.userId = userId;
    console.log("roomId:", roomId)
    this.roomId = roomId;
    this.username = username;
  }

  async onInitialize(): Promise<void> {
    Resources.LdtkResource.addToScene(this, {
      pos: vec(0, 0),
      levelFilter: ["Level_0"]
    });

    this.findEntities();
    console.log(this.roomId)
    this.subscribeToPlayerUpdates();
    await this.initPlayers(this.roomId);
  }

  onPostAdd() {
    this.findEntities();
  }

  onActivate(): void {
    this.findEntities();
    if (this.player) {
      this.camera.strategy.lockToActor(this.player);
      const bounds = Resources.LdtkResource.getLevelBounds(["Level_0"]);
      this.camera.strategy.limitCameraBounds(bounds);
    }
  }

  private findEntities() {
    const players = this.world.entityManager.getByName(this.username);
    const televisions = this.world.entityManager.getByName("Television");
    const calendars = this.world.entityManager.getByName("Calendar");

    if (players.length > 0) this.player = players[0] as Player;
    if (televisions.length > 0) this.television = televisions[0] as Television;
    if (calendars.length > 0) this.calendar = calendars[0] as Calendar;
  }

  onPreUpdate(): void {
    if (this.callbacks.showInteractButtonTV) {
      this.callbacks.showInteractButtonTV(this.isPlayerNearTV());
    }
    if (this.callbacks.showInteractButtonCalendar) {
      this.callbacks.showInteractButtonCalendar(this.isPlayerNearCalendar());
    }
  }

  private isPlayerNearTV() {
    return this.player
      ? this.player.globalPos.distance(this.television.globalPos) <= this.INTERACTION_DISTANCE
      : false;
  }

  private isPlayerNearCalendar() {
    return this.player
      ? this.player.globalPos.distance(this.calendar.globalPos) <= this.INTERACTION_DISTANCE
      : false;
  }

  private async initPlayers(roomId: string) {
    const players = await getPlayers(roomId);
    if (!players) return;

    for (const playerData of players) {
      const id = playerData.id;
      const position = vec(playerData.x, playerData.y);

      if (playerData.user_id === this.userId) {
        this.player.pos = position;
        this.setupCamera();
        continue;
      }

      if (!this.otherPlayers[id]) {
        const other = new OtherPlayer({
            pos: position,
            z: 15,
            width: 16,
            height: 16,
            anchor: new Vector(0.5, 0.5),
            userId: playerData.user_id,
            roomId: playerData.room_id,
            name: playerData.name,
        });
        other.setDirection(playerData.direction, 'idle');
        this.otherPlayers[id] = other;
        this.add(other);
      }
    }
  }

  private setupCamera() {
    if (!this.player) throw new Error("Player not found for camera");
    this.camera.strategy.lockToActor(this.player);
    const bounds = Resources.LdtkResource.getLevelBounds(["Level_0"]);
    this.camera.strategy.limitCameraBounds(bounds);
  }

  public updateOtherPlayers(playerData: PlayerData) {
    if (!playerData || playerData.user_id === this.userId) return;

    const id = playerData.id;
    const position = vec(playerData.x, playerData.y);

    if (this.otherPlayers[id]) {
      this.otherPlayers[id].walkTo(position, UPDATE_INTERVAL); // Smooth 200ms walk
      this.otherPlayers[id].setDirection(playerData.direction, 'walk');
    } else {
      const other = new OtherPlayer({
        pos: position,
        z: 15,
        width: 16,
        height: 16,
        anchor: new Vector(0.5, 0.5),
        userId: playerData.user_id,
        roomId: playerData.room_id,
        name: playerData.name,
      });
      other.setDirection(playerData.direction, 'walk');
      this.otherPlayers[id] = other;
      this.add(other);
    }
  }

  private subscribeToPlayerUpdates() {
    this.playerRealtimeChannel = supabase.channel(`realtime:players:${this.roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'players',
          filter: `room_id=eq.${this.roomId}`
        },
        (payload) => {
          const data = payload.new as PlayerData;
          this.updateOtherPlayers(data);
        }
      )
      .subscribe();
  }

  onDeactivate(): void {
    if (this.playerRealtimeChannel) {
      supabase.removeChannel(this.playerRealtimeChannel);
      this.playerRealtimeChannel = null;
    }
  }
}
