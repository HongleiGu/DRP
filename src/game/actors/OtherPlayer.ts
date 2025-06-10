import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { Config } from '../config/config';

export class OtherPlayer extends ex.Actor {
  private currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';
  private currentState: 'idle' | 'walk' = 'idle';

  constructor(args: ex.ActorArgs) {
    super({
      ...args,
      collisionType: ex.CollisionType.PreventCollision
    });

    this.pos = args.pos ?? new ex.Vector(0, 0);
  }

  onInitialize(): void {
    const playerSpriteSheet = ex.SpriteSheet.fromImageSource({
      image: Resources.HeroSpriteSheetPng,
      grid: {
        spriteWidth: 16,
        spriteHeight: 16,
        rows: 8,
        columns: 8
      }
    });

    const animationMap: Record<string, ex.Animation> = {
      'left-idle': new ex.Animation({ frames: this.getFrames(playerSpriteSheet, 1) }),
      'right-idle': new ex.Animation({ frames: this.getFrames(playerSpriteSheet, 2) }),
      'up-idle': new ex.Animation({ frames: this.getFrames(playerSpriteSheet, 3) }),
      'down-idle': new ex.Animation({ frames: this.getFrames(playerSpriteSheet, 0) }),
      'left-walk': new ex.Animation({ frames: this.getFrames(playerSpriteSheet, 5) }),
      'right-walk': new ex.Animation({ frames: this.getFrames(playerSpriteSheet, 6) }),
      'up-walk': new ex.Animation({ frames: this.getFrames(playerSpriteSheet, 7) }),
      'down-walk': new ex.Animation({ frames: this.getFrames(playerSpriteSheet, 4) }),
    };

    for (const [key, anim] of Object.entries(animationMap)) {
      this.graphics.add(key, anim);
    }

    this.setDirection(this.currentDirection, this.currentState);
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
