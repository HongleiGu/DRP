// components/Game/engine.ts
import { Engine } from 'excalibur'
import * as ex from 'excalibur';
import { MainScene } from '@/game/scenes/MainScene'
import { Player } from '@/game/actors/Player'
import { Resources } from '@/game/config/resources'
import { Television } from '@/game/actors/Television';
import { SceneCallbacks } from '@/types/datatypes';

export const initializeGame = (game: Engine, callbacks: SceneCallbacks) => {
  // Initialize scenes
  const mainScene = new MainScene(callbacks)
  game.add('main', mainScene)

  // Set initial scene
  game.goToScene('main')

  Resources.LdtkResource.registerEntityIdentifierFactory('PlayerStart', (props) => {
    const player = new Player({
        name: 'Player',
        anchor: ex.vec(props.entity.__pivot[0],props.entity.__pivot[1]),
        width: props.entity.width,
        height: props.entity.height,
        pos: props.worldPos,
        z: props.layer.order
    });
    player.graphics.use(Resources.CharacterSpriteSheet.toSprite());
    return player;
  });

  Resources.LdtkResource.registerEntityIdentifierFactory('Television', (props) => {
    const player = new Television({
        name: 'Television',
        anchor: ex.vec(props.entity.__pivot[0],props.entity.__pivot[1]),
        width: props.entity.width,
        height: props.entity.height,
        pos: props.worldPos,
        z: props.layer.order
    });
    player.graphics.use(Resources.TelevisionSprite.toSprite());
    return player;
  });

  // Resources.LdtkResource.registerEntityIdentifierFactory('Door', (props) => {
  //   const trigger = new ex.Trigger({
  //       width: props.entity.width,
  //       height: props.entity.height,
  //       pos: props.worldPos.add(ex.vec(props.entity.width/2, props.entity.height/2)),
  //       filter: (entity) => {
  //           return entity instanceof Player
  //       },
  //       action: () => {
  //           game.goToScene(props.entity.fieldInstances[0].__value);
  //       }
  //   });
  //   return trigger;
  // });
}