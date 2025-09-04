/* eslint-disable @typescript-eslint/no-unused-vars */

import { Resources } from "@/game/config/resources";
import { SupabaseUser } from "@/types/datatypes";
import * as ex from "excalibur";
import { ReactNode } from "react";

// Define Plugin base class first
export type PluginArgs = ex.ActorArgs & { currentPlayer: ex.Actor, currentUser: SupabaseUser, openPanel: (panel: ReactNode) => void }

export abstract class Plugin extends ex.Actor {
  protected label?: ex.Label; 
  protected currentPlayer: ex.Actor;
  protected currentUser: SupabaseUser;
  protected openPanel: (panel: ReactNode) => void;

  constructor(args: PluginArgs) {
    super({
      ...args,
      collisionType: ex.CollisionType.Fixed
    });
    this.currentPlayer = args.currentPlayer;
    this.currentUser = args.currentUser;
    this.openPanel = args.openPanel
  }

  /**
   * Each subclass must provide its own sprite
   */
  protected abstract get sprite(): ex.ImageSource;
  protected abstract get panel(): ReactNode;


  /**
   * Optional hooks for subclasses
   */
  protected onPlayerClose?(player: ex.Actor, engine: ex.Engine): void;
  protected onClick?(engine: ex.Engine): void;
  protected playerDetectionDistance = 32;

  onInitialize(engine: ex.Engine): void {
    const sprite = new ex.Sprite({
      image: this.sprite,
      sourceView: { x: 0, y: 0, width: this.sprite.width, height: this.sprite.height },
      destSize: { width: 16, height: 16 }
    });
    this.graphics.add(sprite);

    this.label = new ex.Label({
      text: this.name,
      font: Resources.DeliusFont.toFont(),
      color: ex.Color.Black,
      pos: ex.vec(0, -12)
    });
    this.label.pos = ex.vec(0, -sprite.height / 2);
    this.label.anchor = ex.vec(0.5, 0.5);
    this.addChild(this.label);
  }

  onPostUpdate(engine: ex.Engine, delta: number): void {
    if (this.label) {
      this.label.pos = ex.vec(0, -this.height / 2 - 8);
    }

    // Automatically trigger onPlayerClose if implemented
    const distance = this.pos.distance(this.currentPlayer.pos);
    // console.log(distance)
    if (distance < this.playerDetectionDistance) { // example threshold for "close"
      this.openPanel(this.panel);
      if (this.onPlayerClose) this.onPlayerClose(this.currentPlayer, engine);
    }

  }

  // Helper for click detection
  handleClick(engine: ex.Engine): void {
    if (this.onClick) {
      this.onClick(engine);
    }
  }
}
