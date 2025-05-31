import * as Phaser from "phaser";

const GRID_SIZE = 16;

export class GridWorld extends Phaser.Scene {
    private layers: Phaser.Tilemaps.TilemapLayer[] = [];
    private player!: Phaser.GameObjects.Image;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private tilemap!: Phaser.Tilemaps.Tilemap;
    private tilesets: Map<string, Phaser.Tilemaps.Tileset> = new Map();

    constructor() {
        super({ key: 'GridWorld' });
        // this.resize(new Phaser.Structs.Size(1600,1200)) // temp for larger display
        // const camera1 = this.cameras.add(0, 0, 400, 300).setZoom(1.5);
    }

    preload() {
        // Fixed typo in 'character' asset key
        this.load.image('character', '/game/assets/tilemaps/sprout/Characters/character.png');
        
        // Corrected file extension for Tiled JSON map
        // this is a problem with the ldtk exported tmx data, need to pass this to Tiled to let it export json
        this.load.tilemapTiledJSON('map', '/game/example/tiled/Level_0.json');
        
        // Other assets
        this.load.image('Dirt', '/game/assets/tilemaps/sprout/Tilesets/Tilled_Dirt_Wide_v2.png');
        this.load.image('Door', '/game/assets/tilemaps/sprout/Tilesets/Doors.png');
        this.load.image('WoodenHouseWalls', '/game/assets/tilemaps/sprout/Tilesets/Wooden_House_Walls_Tilset.png');
        this.load.image('Water', '/game/assets/tilemaps/sprout/Tilesets/Water.png');
        this.load.image('Fences', '/game/assets/tilemaps/sprout/Tilesets/Fences.png');
        this.load.image('Grass', '/game/assets/tilemaps/sprout/Tilesets/Grass.png');
        this.load.image('Furniture', '/game/assets/tilemaps/sprout/Objects/Basic_Furniture.png');
        this.load.image('Plants', '/game/assets/tilemaps/sprout/Objects/Basic_Grass_Biom_things.png');
        this.load.image('Fruits', '/game/assets/tilemaps/sprout/Objects/Basic_Plants.png');
        this.load.image('Paths', '/game/assets/tilemaps/sprout/Objects/Paths.png');
        // this.load.image('Grass', '/game/assets/tilemaps/sprout/Tilesets/Grass.png');

    }

    create() {
        // Create tilemap with proper grid size
        this.tilemap = this.make.tilemap({ 
            key: 'map', 
            tileWidth: GRID_SIZE, 
            tileHeight: GRID_SIZE 
        });

        // Create all tilesets
        this.createTilesets();
        
        // Create all layers
        this.createLayers();

        // Create player
        this.player = this.add.image(
            GRID_SIZE / 2, 
            GRID_SIZE / 2, 
            'character'
        );
        this.player.setOrigin(0.5, 0.5);
        this.player.setDisplaySize(GRID_SIZE * 2, GRID_SIZE * 2);

        // Setup input
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.setupKeyboardControls();

        // Debug text
        this.add.text(8, 8, `Move with WASD (Grid: ${GRID_SIZE}px)`, {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#000000'
        });

        // Enable camera follow with bounds
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(
            0, 
            0, 
            this.tilemap.widthInPixels, 
            this.tilemap.heightInPixels
        );
    }

    update() {
        // Handle continuous movement with cooldown
        if (this.cursors.left.isDown) {
            this.movePlayer(-1, 0, 180);
        } else if (this.cursors.right.isDown) {
            this.movePlayer(1, 0, 0);
        } else if (this.cursors.up.isDown) {
            this.movePlayer(0, -1, 0);
        } else if (this.cursors.down.isDown) {
            this.movePlayer(0, 1, 0);
        }
    }

    private createTilesets() {
        // Create tilesets for all required textures
        const tilesetConfig = [
            { tiledName: 'Water', textureKey: 'Water' },
            { tiledName: 'Dirt', textureKey: 'Dirt' },
            { tiledName: 'Grass', textureKey: 'Grass' },
            { tiledName: 'Doors', textureKey: 'Door' },
            { tiledName: 'Wooden_House_Walls', textureKey: 'WoodenHouseWalls' },
            { tiledName: 'Fences', textureKey: 'Fences' },
            { tiledName: 'Fruits', textureKey: 'Fruits' },
            { tiledName: 'Plants', textureKey: 'Plants' },
            { tiledName: 'Paths', textureKey: 'Paths' },
            { tiledName: 'Furniture', textureKey: 'Furniture' },
            // { tiledName: 'Wooden_House_Walls', textureKey: 'WoodenHouseWalls' },

        ];

        tilesetConfig.forEach(config => {
            const tileset = this.tilemap.addTilesetImage(
                config.tiledName,
                config.textureKey,
                GRID_SIZE,
                GRID_SIZE
            );
            
            if (tileset) {
                this.tilesets.set(config.tiledName, tileset);
            } else {
                console.error(`Failed to create tileset: ${config.tiledName}`);
            }
        });
    }

    private createLayers() {
        // Create all layers from the tilemap
        this.tilemap.layers.forEach(layerData => {
            const layer = this.tilemap.createLayer(
                layerData.name,
                Array.from(this.tilesets.values()),
                0,
                0
            );
            
            if (layer) {
                layer.setCollisionByProperty({ collides: true });
                this.layers.push(layer);
            }
        });

        // Fallback if no layers created
        if (this.layers.length === 0) {
            console.warn('Using fallback layer');
            const fallbackLayer = this.tilemap.createBlankLayer(
                'fallback', 
                '', 
                GRID_SIZE, 
                GRID_SIZE, 
                64, 
                64
            );
            if (fallbackLayer) this.layers.push(fallbackLayer);
        }
    }

    private setupKeyboardControls() {
        // Setup WASD controls
        this.input.keyboard?.on('keydown-A', () => this.movePlayer(-1, 0, 180));
        this.input.keyboard?.on('keydown-D', () => this.movePlayer(1, 0, 0));
        this.input.keyboard?.on('keydown-W', () => this.movePlayer(0, -1, 0));
        this.input.keyboard?.on('keydown-S', () => this.movePlayer(0, 1, 0));
    }

    private movePlayer(dx: number, dy: number, angle: number) {
        const targetX = this.player.x + dx * GRID_SIZE / 4;
        const targetY = this.player.y + dy * GRID_SIZE / 4;

        // Check collisions at destination tile
        let canMove = true;
        for (const layer of this.layers) {
            const tile = layer.getTileAtWorldXY(targetX, targetY, true);
            if (tile?.properties.collides) {
                canMove = false;
                break;
            }
        }

        // Move to new position if clear
        if (canMove) {
            this.player.setPosition(targetX, targetY);
            this.player.setAngle(angle);
        }
    }
    resize(gameSize: Phaser.Structs.Size) {
        // Scale the game to fit the container while maintaining aspect ratio
        const scale = Math.min(
            gameSize.width / 800,
            gameSize.height / 600
        );
        
        this.cameras.main.setZoom(scale);
        this.cameras.main.centerOn(400, 300);
    }
}

export const gridWorldConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    pixelArt: true,
    backgroundColor: '#1a1a2d',
    scene: GridWorld,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { x: 0, y: 0 }
        }
    }
};