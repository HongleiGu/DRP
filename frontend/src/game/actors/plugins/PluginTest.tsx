import { Resources } from '@/game/config/resources';
import { Plugin } from './Plugin';
import { ImageSource } from 'excalibur';
import { ReactNode } from 'react';

export class PluginTest extends Plugin {
  protected get panel(): ReactNode {
    return (
      <span>test</span>
    )
  }
  protected get sprite(): ImageSource {
    return Resources.CalendarSprite
  }
}