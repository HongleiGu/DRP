import * as ex from 'excalibur';
import { Resources } from '../config/resources';

export class Television extends ex.Actor {
  constructor(args: ex.ActorArgs) {
      super({
          ...args,
          collisionType: ex.CollisionType.Fixed
      })
  }
  onInitialize(): void {
    const sprite = new ex.Sprite({
      image: Resources.TelevisionSprite,
      sourceView: {
        x: 0, y: 0,
        width: 32, //Resources.TelevisionSprite.width,
        height: 20// Resources.TelevisionSprite.height
      },
    });
    this.graphics.add(sprite);
  }
}