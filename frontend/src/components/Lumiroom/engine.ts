// components/Game/engine.ts
import { Engine } from 'excalibur'
import * as ex from 'excalibur';
import { MainScene } from '@/game/scenes/MainScene'
import { Player } from '@/game/actors/Player'
import { Resources } from '@/game/config/resources'
// import { Television } from '@/game/actors/Television';
import { SceneCallbacks } from '@/types/datatypes';
// import { Calendar } from '@/game/actors/Calendar';

// load assets
export const initializeGame = (game: Engine, callbacks: SceneCallbacks, userId: string, username: string, roomId: string, avatarId: string) => {
  // Initialize scenes
  // console.log("init room", roomId)
  const mainScene = new MainScene(callbacks, userId, roomId, username)

  
  game.add('main', mainScene)

  // Set initial scene
  game.goToScene('main')

  Resources.LdtkResource.registerEntityIdentifierFactory('PlayerStart', (props) => {
    const player = new Player({
        name: username,
        anchor: ex.vec(props.entity.__pivot[0],props.entity.__pivot[1]),
        width: props.entity.width,
        height: props.entity.height,
        pos: props.worldPos,
        z: props.layer.order + 10,
        userId: userId,
        roomId: roomId,
        avatarId: avatarId,
    });
    return player;
  });
}