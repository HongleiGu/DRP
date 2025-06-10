/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import * as ex from 'excalibur';
import { Resources } from '../config/resources';
// import { pixelFont } from '@/utils/utils';

export class Calendar extends ex.Actor {
  private label?: ex.Label; // Reference to the label

  constructor(args: ex.ActorArgs) {
    super({
      ...args,
      collisionType: ex.CollisionType.Fixed
    });
  }
  
  onInitialize(engine: ex.Engine): void {
    const sprite = new ex.Sprite({
      image: Resources.CalendarSprite,
      sourceView: {
        x: 0, y: 0,
        width: Resources.CalendarSprite.width,
        height: Resources.CalendarSprite.height
      },
      destSize: {
        width: 16,
        height: 16
      }
    });
    
    // Add sprite to main actor
    this.graphics.add(sprite);
    
    // Create label as separate actor
    this.label = new ex.Label({
      text: 'CALENDAR',
      font: Resources.DeliusFont.toFont(),
      color: ex.Color.Black
    });
    
    // Position label relative to Calendar
    this.label.pos = ex.vec(0, -sprite.height / 2);
    this.label.anchor = ex.vec(0.5, 0.5); // Center text
    
    // Add label as child actor
    this.addChild(this.label);
    
    // // Set collision area to match sprite only (not text)
    // this.collider.set(ex.Shape.Box(
    //   sprite.width, 
    //   sprite.height, 
    //   ex.Vector.Zero
    // ));
  }
  
  // Optional: Update position when Calendar moves
  onPostUpdate(engine: ex.Engine, delta: number): void {
    if (this.label) {
      // Keep label positioned above Calendar
      this.label.pos = ex.vec(0, -this.height / 2 - 8);
    }
  }
}