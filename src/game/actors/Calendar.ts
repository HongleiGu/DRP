import * as ex from 'excalibur';
import { Resources } from '../config/resources';

export class Calendar extends ex.Actor {
  constructor(args: ex.ActorArgs) {
      super({
          ...args,
          collisionType: ex.CollisionType.Fixed
      })
  }
  onInitialize(): void {
    const sprite = new ex.Sprite({
      image: Resources.TelevisionSprite, // need to be replaced
      sourceView: {
        x: 0, y: 0,
        width: Resources.TelevisionSprite.width,
        height: Resources.TelevisionSprite.height
      },
    });
    this.graphics.add(sprite);
  }
}