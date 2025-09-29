import * as ex from "excalibur";
import { Resources } from "../config/resources";
import { Player } from "../actors/Player";
import { OtherPlayer } from "../actors/OtherPlayer";
import { PlayerData, SceneCallbacks, SupabaseUser } from "@/types/datatypes";
import { getPlayers } from "@/utils/api";
import { getGameWebsocket, setGameWebsocket, StompService, Subscription } from "@/hooks/StompService";
import { IMessage } from "@stomp/stompjs";
import { setGlobalPlayer } from "@/utils/globalPlayer";

export class MainScene extends ex.Scene {
  private player!: Player;
  private otherPlayers: Record<string, OtherPlayer> = {};
  // eslint-disable-line @typescript-eslint/no-unused-vars
  private callbacks: SceneCallbacks;
  private gameWebsocket: StompService;
  private roomId: string;
  private user: SupabaseUser;
  private lastBroadcast = 0;
  private BROADCAST_INTERVAL = 5000; // ms


  private subscriptionId?: string;

  constructor(callbacks: SceneCallbacks = {}, user: SupabaseUser, roomId: string) {
    super();
    this.callbacks = callbacks;
    this.user = user;
    this.roomId = roomId;
    setGameWebsocket();
    this.gameWebsocket = getGameWebsocket()!;
  }

  public getPlayer() {
    return this.player
  }

  async onInitialize(): Promise<void> {
    Resources.LdtkResource.addToScene(this, {
      pos: ex.vec(0, 0),
      levelFilter: ["Level_0"]
    });
    this.findEntities();
    await this.initPlayers(this.roomId);
    this.setupSubscription();
    console.log("set player", this.player)
    setGlobalPlayer(this.player);
  }

  private findEntities() {
    this.player = this.world.entityManager.getByName(this.user.username)[0] as Player;
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
    const now = Date.now();
    if (this.player && this.gameWebsocket.connected) {
      if (now - this.lastBroadcast > this.BROADCAST_INTERVAL) {
        const positionMessage: PlayerData = {
          user_id: this.user.id,
          room_id: this.roomId,
          name: this.user.username,
          avatarId: this.player.avatarId,
          x: this.player.pos.x,
          y: this.player.pos.y,
          id: "", // the id is not needed, in the backend, we need to let psql generate this
          direction: this.player.currentDirection
        };
        this.gameWebsocket.publish({
          destination: "/app/game/broadcastPosition",
          body: JSON.stringify(positionMessage),
        });
        console.log("broadcasted", positionMessage)
        this.lastBroadcast = now;
      }
    }
  }

  private async initPlayers(roomId: string) {
    const players = await getPlayers(roomId);
    if (!players) return;

    players.forEach(playerData => {
      const pos = ex.vec(playerData.x, playerData.y);
      if (playerData.user_id === this.user.id) {
        this.player.pos = pos;
      } else {
        const other = new OtherPlayer({
          pos,
          z: 15,
          width: 16,
          height: 16,
          anchor: ex.vec(0.5, 0.5),
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

  private setupSubscription() {
    if (!this.gameWebsocket) {
      console.error("Game STOMP client not initialized!");
      return;
    }

    this.gameWebsocket.connect(this.user, {roomId: this.roomId},
      {
        endpoint: `topic/game/${this.roomId}`,
        callback: () => async (message: IMessage) => {
          const data: PlayerData = JSON.parse(message.body); 
          if (data.user_id === this.user.id) return; // ignore own message 
          const pos = ex.vec(data.x, data.y); 
          let other = this.otherPlayers[data.user_id] 
          if (other) { 
            other.walkTo(pos); 
          } else { 
            other = new OtherPlayer({ 
              pos, 
              z: 15, 
              width: 16, 
              height: 16, 
              anchor: ex.vec(0.5, 0.5), 
              userId: data.user_id, 
              roomId: data.room_id, 
              name: data.name, 
              avatarId: data.avatarId, 
            }); 
            this.otherPlayers[data.user_id] = other
            this.add(other); 
          } 
        }
      } as Subscription
    )
    // gameWebsocket.subscribe()
  }

  onDeactivate(): void {
    if (this.gameWebsocket && this.subscriptionId) {
      this.gameWebsocket.disconnect()
    }
    this.otherPlayers = {};
  }

  public getOtherPlayers(id: string) {
    try {
      return this.otherPlayers[id]
    } catch {
      return null
    }
  }

  public setOtherPlayer(id: string, data: OtherPlayer) {
    this.otherPlayers[id] = data
  }
}
