import * as ex from "excalibur";
import { Resources } from "../config/resources";
import { Config } from "../config/config";

export class OtherPlayer extends ex.Actor {
  public userId: string;
  public roomId: string;
  public name: string;
  public avatarId: string;
  private label?: ex.Label;

  private currentDirection: "up" | "down" | "left" | "right" = "down";
  private currentState: "idle" | "walk" = "idle";
  private targetPos: ex.Vector;
  private moveSpeed = 40; // px/sec

  constructor(args: ex.ActorArgs & { userId: string; roomId: string; name: string; avatarId: string }) {
    super({ ...args, collisionType: ex.CollisionType.PreventCollision });
    this.userId = args.userId;
    this.roomId = args.roomId;
    this.name = args.name;
    this.avatarId = args.avatarId;
    this.targetPos = (args.pos ?? new ex.Vector(200,300)).clone();
  }

  onInitialize(): void {
    const sheet = ex.SpriteSheet.fromImageSource({
      image: Resources.CharacterSpriteSheets[Number(this.avatarId) || 0],
      grid: { spriteWidth: 16, spriteHeight: 20, rows: 4, columns: 3 }
    });

    const animMap: Record<string, number> = { down: 0, left: 1, right: 2, up: 3 };
    for (const dir in animMap) {
      const row = animMap[dir];
      this.graphics.add(`${dir}-idle`, new ex.Animation({
        frames: [{ graphic: sheet.getSprite(1, row), duration: Config.PlayerFrameSpeed }]
      }));
      this.graphics.add(`${dir}-walk`, new ex.Animation({
        frames: [
          { graphic: sheet.getSprite(0, row), duration: Config.PlayerFrameSpeed },
          { graphic: sheet.getSprite(1, row), duration: Config.PlayerFrameSpeed },
          { graphic: sheet.getSprite(2, row), duration: Config.PlayerFrameSpeed },
          { graphic: sheet.getSprite(1, row), duration: Config.PlayerFrameSpeed }
        ]
      }));
    }

    this.graphics.use("down-idle");

    this.label = new ex.Label({
      text: this.name,
      font: Resources.DeliusFont.toFont(),
      anchor: ex.vec(1, 0.5),
      pos: ex.vec(0, -Math.round(14)),
      color: ex.Color.Black
    });
    this.addChild(this.label);
  }

  public walkTo(position: ex.Vector) {
    this.targetPos = position.clone();
  }

  onPreUpdate(_engine: ex.Engine, delta: number) {
    const deltaSec = delta / 1000;
    const toTarget = this.targetPos.sub(this.pos);
    const dist = toTarget.magnitude;
    this.pos = ex.vec(Math.round(this.pos.x), Math.round(this.pos.y));

    if (dist > 0.5) {
      const step = toTarget.normalize().scale(this.moveSpeed * deltaSec);
      if (step.magnitude >= dist) {
        this.pos = this.pos.add(step.clampMagnitude(dist));
      } else {
        this.pos = this.pos.add(step);
      }

      const dir = Math.abs(toTarget.x) > Math.abs(toTarget.y)
        ? (toTarget.x > 0 ? "right" : "left")
        : (toTarget.y > 0 ? "down" : "up");

      this.setDirection(dir, "walk");
    } else {
      this.pos = this.targetPos.clone(); // snap to stop cleanly
      this.setDirection(this.currentDirection, "idle");
    }

  }

  private setDirection(dir: "up" | "down" | "left" | "right", state: "idle" | "walk") {
    if (dir !== this.currentDirection || state !== this.currentState) {
      this.currentDirection = dir;
      this.currentState = state;
      this.graphics.use(`${dir}-${state}`);
    }
  }
}
