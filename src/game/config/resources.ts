import { ImageSource } from 'excalibur'
import { LdtkResource } from '@excaliburjs/plugin-ldtk'

const paths = {
  Sprites: {
    CharacterSpritePath: "/game/assets/tilemaps/sprout/Characters/Basic Charakter Spritesheet.png",
    Hero01: "/game/assets/Hero 01.png",
    Television: "/game/assets/television.png"
  },
  Ldtk: {
    LdtkResourcePath: "/game/example.ldtk",
    Level0LdtklPath: "/game/example/Level_0.ldtkl",
  },
  Tilesets: {
    WoodenHouseRoofs: "/game/assets/tilemaps/sprout/Tilesets/Wooden_House_Roof_Tilset.png",
    Fruits: "/game/assets/tilemaps/sprout/Objects/Basic_Plants.png",
    Paths: "/game/assets/tilemaps/sprout/Objects/Paths.png",
    Fences: "/game/assets/tilemaps/sprout/Tilesets/Fences.png",
    Doors: "/game/assets/tilemaps/sprout/Tilesets/Doors.png",
    Furniture: "/game/assets/tilemaps/sprout/Objects/Basic_Furniture.png",
    Plants: "/game/assets/tilemaps/sprout/Objects/Basic_Grass_Biom_things.png",
    WoodenHouseWalls: "/game/assets/tilemaps/sprout/Tilesets/Wooden_House_Walls_Tilset.png",
    Dirt: "/game/assets/tilemaps/sprout/Tilesets/Tilled_Dirt.png",
    Grass: "/game/assets/tilemaps/sprout/Tilesets/Grass.png",
    Water: "/game/assets/tilemaps/sprout/Tilesets/Water.png"
  }
}

export const Resources = {
    CharacterSpriteSheet: new ImageSource(paths.Sprites.CharacterSpritePath),
    HeroSpriteSheetPng: new ImageSource(paths.Sprites.Hero01),
    TelevisionSprite: new ImageSource(paths.Sprites.Television),
    LdtkResource: new LdtkResource(paths.Ldtk.LdtkResourcePath, {
        useTilemapCameraStrategy: true,
        useMapBackgroundColor: true,
        // Path map intercepts and redirects to work around parcel's static bundling
        pathMap: [
            { path: 'Level_0.ldtkl', output: paths.Ldtk.Level0LdtklPath },
            { path: 'Basic_Plants.png', output: paths.Tilesets.Fruits },
            { path: 'Paths.png', output: paths.Tilesets.Paths },
            { path: 'Fences.png', output: paths.Tilesets.Fences },
            { path: 'Doors.png', output: paths.Tilesets.Doors },
            { path: 'Basic_Furniture.png', output: paths.Tilesets.Furniture },
            { path: 'Basic_Grass_Biom_things.png', output: paths.Tilesets.Plants },
            { path: 'Wooden_House_Walls_Tilset.png', output: paths.Tilesets.WoodenHouseWalls },
            { path: 'Dirt.png', output: paths.Tilesets.Dirt },
            { path: 'Grass.png', output: paths.Tilesets.Grass },
            { path: 'Water.png', output: paths.Tilesets.Water },
            { path: 'Wooden_House_Roof_Tilset.png', output: paths.Tilesets.WoodenHouseRoofs }
        ]
    })
} as const;

// export const loader = new Loader();
// for (const resource of Object.values(Resources)) {
//     loader.addResource(resource);
// }