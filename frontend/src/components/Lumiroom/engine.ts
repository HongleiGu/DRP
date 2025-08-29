// components/Game/engine.ts
import * as ex from 'excalibur';
import { MainScene } from '@/game/scenes/MainScene'
import { Player } from '@/game/actors/Player'
import { Resources } from '@/game/config/resources'
// import { Television } from '@/game/actors/Television';
import { SceneCallbacks, SupabaseUser } from '@/types/datatypes';
// import { Calendar } from '@/game/actors/Calendar';

// load assets
export const initializeGame = (game: ex.Engine, callbacks: SceneCallbacks, user: SupabaseUser, roomId: string) => {
  // Initialize scenes
  const mainScene = new MainScene(callbacks, user, roomId)

  
  game.add('main', mainScene)

  // Set initial scene
  game.goToScene('main')

  Resources.LdtkResource.registerEntityIdentifierFactory('PlayerStart', (props) => {
    const player = new Player({
      name: user.username,
      anchor: ex.vec(props.entity.__pivot[0],props.entity.__pivot[1]),
      width: props.entity.width,
      height: props.entity.height,
      pos: props.worldPos,
      z: props.layer.order + 10,
      userId: user.id,
      roomId: roomId,
      avatarId: user.avatar_id,
    });
    return player;
  });
}