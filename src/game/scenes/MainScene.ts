import { Scene, vec } from "excalibur";
import { Resources } from "../config/resources";
import { Player } from "../actors/Player";
import { Television } from "../actors/Television";
import { SceneCallbacks } from "@/types/datatypes";
// import InteractButton from "../components/InteractButton";

export class MainScene extends Scene {
    // the exclamation mark say we are going to assign some value afterward, might be rejected by eslint
    private player!: Player;
    private television!: Television;
    private readonly INTERACTION_DISTANCE = 30;
    private callbacks: SceneCallbacks;

    constructor(callbacks: SceneCallbacks = {}) {
        super();
        this.callbacks = callbacks;
    }
    // private interactButton!: InteractButton
    
    // Store reference to the engine
    // private engineRef: Engine;

    onInitialize(): void {
        // this.engineRef = engine;
        // this.interactButton = new InteractButton(engine)
        
        // Add LDTK level to the scene
        Resources.LdtkResource.addToScene(this, {
            pos: vec(0, 0),
            levelFilter: ['Level_0']
        });
    }

    onPostAdd() {
        // Ensure entities are available after scene initialization
        this.findEntities();
        this.setupCamera();
    }

    onActivate(): void {
        // Re-find entities in case scene is reactivated
        this.findEntities();
        
        if (this.player) {
            this.camera.strategy.lockToActor(this.player);
            const bounds = Resources.LdtkResource.getLevelBounds(['Level_0']);
            this.camera.strategy.limitCameraBounds(bounds);
        }
    }

    private findEntities() {
        // Find player and television by name
        const players = this.world.entityManager.getByName('Player');
        const televisions = this.world.entityManager.getByName('Television');

        if (players.length > 0) {
            this.player = players[0] as Player;
        } else {
            console.warn("Player entity not found in LDTK level");
        }

        if (televisions.length > 0) {
            this.television = televisions[0] as Television;
        } else {
            console.warn("Television entity not found in LDTK level");
        }
    }

    private setupCamera() {
        if (this.player) {
            this.camera.strategy.lockToActor(this.player);
            const bounds = Resources.LdtkResource.getLevelBounds(['Level_0']);
            this.camera.strategy.limitCameraBounds(bounds);
        }
    }

    private isPlayerNearTV() {
        const distance = this.player.globalPos.distance(this.television.globalPos)
        return distance <= this.INTERACTION_DISTANCE
    }

    onPreUpdate() {
        // Toggle button visibility based on distance
        const isNear = this.isPlayerNearTV();
        
        // Notify React component via callback
        if (this.callbacks.showInteractButton) {
            this.callbacks.showInteractButton(isNear);
        }
    }
}