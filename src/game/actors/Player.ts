import * as ex from 'excalibur';
import { Resources } from '../config/resources';
import { Config } from '../config/config';
import { updateSupabasePlayerState } from '@/utils/api';
import { UPDATE_INTERVAL } from '@/utils/utils';

export class Player extends ex.Actor {
    private label?: ex.Label; // Reference to the label
    public userId: string;
    private lastUpdateTime: number = 0;
    private lastSentPosition: ex.Vector = ex.vec(0, 0);
    private currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';
    public roomId: string;
    public name: string;

    constructor(args: ex.ActorArgs & { userId: string, roomId: string, name: string}) {
        super({
            ...args,
            collisionType: ex.CollisionType.Active
        });

        this.userId = args.userId;
        this.roomId = args.roomId;
        this.name = args.name;
    }

    onInitialize(): void {
        const sheet = ex.SpriteSheet.fromImageSource({
            image: Resources.CharacterSpriteSheet,
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

        const now = Date.now();
        const distanceMoved = this.pos.distance(this.lastSentPosition);

        if (now - this.lastUpdateTime > UPDATE_INTERVAL && distanceMoved > 0.5) {
            this.lastUpdateTime = now;
            this.lastSentPosition = this.pos.clone();
            updateSupabasePlayerState(this.userId, this.pos.x, this.pos.y, this.name, this.currentDirection, this.roomId);
        }
    }
}
