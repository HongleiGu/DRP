import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { Config } from '../config/config';
import { updateSupabasePlayerState } from '@/utils/api';

export class Player extends ex.Actor {
    public userId: string;
    private lastUpdateTime: number = 0;
    private lastSentPosition: ex.Vector = ex.vec(0, 0);
    private currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';

    constructor(args: ex.ActorArgs & { userId: string }) {
        super({
            ...args,
            collisionType: ex.CollisionType.Active
        });

        this.userId = args.userId;
    }

    onInitialize(): void {
        const sheet = ex.SpriteSheet.fromImageSource({
            image: Resources.HeroSpriteSheetPng,
            grid: { spriteWidth: 16, spriteHeight: 16, rows: 8, columns: 8 }
        });

        const anims: Record<string, number> = {
            'left-idle': 1, 'right-idle': 2, 'up-idle': 3, 'down-idle': 0,
            'left-walk': 5, 'right-walk': 6, 'up-walk': 7, 'down-walk': 4
        };

        for (const [name, row] of Object.entries(anims)) {
            this.graphics.add(name, new ex.Animation({
                frames: [
                    { graphic: sheet.getSprite(0, row), duration: Config.PlayerFrameSpeed },
                    { graphic: sheet.getSprite(1, row), duration: Config.PlayerFrameSpeed },
                    { graphic: sheet.getSprite(2, row), duration: Config.PlayerFrameSpeed },
                    { graphic: sheet.getSprite(3, row), duration: Config.PlayerFrameSpeed },
                ]
            }));
        }

        this.graphics.use('down-idle');
    }

    onPreUpdate(engine: ex.Engine): void {
        this.vel = ex.Vector.Zero;
        let direction: 'up' | 'down' | 'left' | 'right' | null = null;

        if (engine.input.keyboard.isHeld(ex.Keys.Right) || engine.input.keyboard.isHeld(ex.Keys.D)) {
            this.vel.x = Config.PlayerSpeed;
            direction = 'right';
        }
        if (engine.input.keyboard.isHeld(ex.Keys.Left) || engine.input.keyboard.isHeld(ex.Keys.A)) {
            this.vel.x = -Config.PlayerSpeed;
            direction = 'left';
        }
        if (engine.input.keyboard.isHeld(ex.Keys.Up) || engine.input.keyboard.isHeld(ex.Keys.W)) {
            this.vel.y = -Config.PlayerSpeed;
            direction = 'up';
        }
        if (engine.input.keyboard.isHeld(ex.Keys.Down) || engine.input.keyboard.isHeld(ex.Keys.S)) {
            this.vel.y = Config.PlayerSpeed;
            direction = 'down';
        }

        if (direction) {
            this.currentDirection = direction;
            this.graphics.use(`${direction}-walk`);
        } else {
            this.graphics.use(`${this.currentDirection}-idle`);
        }

        // 📦 Update Supabase only if moved significantly
        const now = Date.now();
        const distanceMoved = this.pos.distance(this.lastSentPosition);

        if (now - this.lastUpdateTime > 200 && distanceMoved > 1) {
            this.lastUpdateTime = now;
            this.lastSentPosition = this.pos.clone();
            updateSupabasePlayerState(this.userId, this.pos.x, this.pos.y, this.currentDirection);
        }
    }
}
