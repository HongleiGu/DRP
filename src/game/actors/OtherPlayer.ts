import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { Config } from '../config/config';

export class OtherPlayer extends ex.Actor {
    private label?: ex.Label; // Reference to the label
    public userId: string
    private currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';
    private currentState: 'idle' | 'walk' = 'idle';
    public roomId: string;
    public name: string;
    public avatarId: string;

    constructor(args: ex.ActorArgs & { userId: string, roomId: string, name: string, avatarId: string}) {
        super({
            ...args,
            collisionType: ex.CollisionType.PreventCollision
        });

        this.userId = args.userId;
        this.roomId = args.roomId;
        this.name = args.name;
        this.avatarId = args.avatarId
    }

  onInitialize(): void {
    const sheet = ex.SpriteSheet.fromImageSource({
        image: Resources.CharacterSpriteSheets[Number.parseInt(this.avatarId ?? "0")],
        grid: { spriteWidth: 16, spriteHeight: 20, rows: 4, columns: 3 }
    });

    const anims: Record<string, number> = {
        'left': 1,
        'right': 2,
        'up': 3,
        'down': 0
    };

    for (const [dir, row] of Object.entries(anims)) {
      // Idle: use middle frame
      this.graphics.add(`${dir}-idle`, new ex.Animation({
          frames: [
              { graphic: sheet.getSprite(1, row), duration: Config.PlayerFrameSpeed }
          ]
      }));

      // Walk: use 4-frame loop: 0 -> 1 -> 2 -> 1
      this.graphics.add(`${dir}-walk`, new ex.Animation({
          frames: [
              { graphic: sheet.getSprite(0, row), duration: Config.PlayerFrameSpeed },
              { graphic: sheet.getSprite(1, row), duration: Config.PlayerFrameSpeed },
              { graphic: sheet.getSprite(2, row), duration: Config.PlayerFrameSpeed },
              { graphic: sheet.getSprite(1, row), duration: Config.PlayerFrameSpeed }
          ]
      }));
    }

    this.graphics.use('down-idle');

    this.setDirection(this.currentDirection, this.currentState);
    // Create label as separate actor
    this.label = new ex.Label({
        text: this.name,
        font: Resources.DeliusFont.toFont(),
        color: ex.Color.Black
    });

    // Position label relative to television
    this.label.pos = ex.vec(0, -14);
    this.label.anchor = ex.vec(0.5, 0.5); // Center text

    // Add label as child actor
    this.addChild(this.label);
  }

  private getFrames(sheet: ex.SpriteSheet, row: number) {
    return [
      { graphic: sheet.getSprite(0, row), duration: Config.PlayerFrameSpeed },
      { graphic: sheet.getSprite(1, row), duration: Config.PlayerFrameSpeed },
      { graphic: sheet.getSprite(2, row), duration: Config.PlayerFrameSpeed },
      { graphic: sheet.getSprite(3, row), duration: Config.PlayerFrameSpeed },
    ];
  }

  public setDirection(direction: 'up' | 'down' | 'left' | 'right', state: 'idle' | 'walk') {
    const animationKey = `${direction}-${state}`;
    if (this.currentDirection !== direction || this.currentState !== state) {
      this.currentDirection = direction;
      this.currentState = state;
      this.graphics.use(animationKey);
    }
  }

  public walkTo(targetPos: ex.Vector, duration: number = 200) {
    const start = this.pos.clone();
    const delta = targetPos.sub(start);
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      this.pos = start.add(delta.scale(t));

      if (t < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }
}
