import { ImageSource } from 'excalibur';
import { Plugin } from './Plugin';
import { Resources } from '@/game/config/resources';
import { ReactNode } from 'react';
import AIBotPanel from './panels/AIBotPanel';

export class AIBot extends Plugin {
  protected get panel(): ReactNode {
    return (
      <AIBotPanel/>
    )
  }
  protected get sprite(): ImageSource {
    return Resources.CalendarSprite
  }
}