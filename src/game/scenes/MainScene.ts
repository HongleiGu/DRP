import { Actor, Scene, vec } from "excalibur";
import { Resources } from "../config/resources";
import { Player } from "../actors/Player";


export class MainScene extends Scene {
    //engine: Engine<any>
    onInitialize(): void {
        Resources.LdtkResource.addToScene(this, {
            pos: vec(0, 0),
            levelFilter: ['Level_0']
        });
    }
//context: SceneActivationContext<unknown>
    onActivate(): void {
        const player = this.world.entityManager.getByName('Player')[0];
        if (player instanceof Player) {
            this.camera.strategy.lockToActor(player as Actor);
        }
        const bounds = Resources.LdtkResource.getLevelBounds(['Level_0']);
        this.camera.strategy.limitCameraBounds(bounds);
    }
}