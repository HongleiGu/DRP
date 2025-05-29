import * as Phaser from "phaser";

export class GridWorld extends Phaser.Scene
{
    preload ()
    {
        // load asests
    }

    create ()
    {
        const map = this.make.tilemap({ key: 'map', tileWidth: 32, tileHeight: 32 });
        const createTileLayer = () => {
            const tileset = map.addTilesetImage('tiles', 'gridworld', 32, 32, 1, 2);
            
            if (!tileset) {
                console.error('Tileset missing. Using fallback tiles');
                // we dont have the tileset now, this actually should throw an error
                return map.createBlankLayer('fallback-layer', '', 32, 32, 64, 64);
            }

            return map.createLayer(0, tileset, 0, 0);
        }

        const layer = createTileLayer();

        const player = this.add.image(32 + 16, 32 + 16, 'car');

        //  Left
        this.input.keyboard?.on('keydown-A', () =>
        {

            const tile = layer?.getTileAtWorldXY(player.x - 32, player.y, true);

            if (tile?.index === 2)
            {
                //  Blocked, we can't move
            }
            else
            {
                player.x -= 32;
                player.angle = 180;
            }

        });

        //  Right
        this.input.keyboard?.on('keydown-D', () =>
        {

            const tile = layer?.getTileAtWorldXY(player.x + 32, player.y, true);

            if (tile?.index === 2)
            {
                //  Blocked, we can't move
            }
            else
            {
                player.x += 32;
                player.angle = 0;
            }

        });

        //  Up
        this.input.keyboard?.on('keydown-W', () =>
        {

            const tile = layer?.getTileAtWorldXY(player.x, player.y - 32, true);

            if (tile?.index === 2)
            {
                //  Blocked, we can't move
            }
            else
            {
                player.y -= 32;
                player.angle = -90;
            }

        });

        //  Down
        this.input.keyboard?.on('keydown-S', () =>
        {

            const tile = layer?.getTileAtWorldXY(player.x, player.y + 32, true);

            if (tile?.index === 2)
            {
                //  Blocked, we can't move
            }
            else
            {
                player.y += 32;
                player.angle = 90;
            }

        });

        this.add.text(8, 8, 'Move with WASD', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#000000'
        });
    }
}

export const gridWorldConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    pixelArt: true,
    backgroundColor: '#1a1a2d',
    scene: GridWorld
};