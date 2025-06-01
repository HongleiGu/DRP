// game/actors/Collectible.ts
import { Actor, Vector, CollisionType } from 'excalibur'
// import ex from 'excalibur'
import * as ex from 'excalibur';

export class Collectible extends Actor {
  constructor(x: number, y: number) {
    super({
      pos: new Vector(x, y),
      width: 20,
      height: 20,
      color: ex.Color.Yellow,
      collisionType: CollisionType.Passive
    })
  }
}