import React, { ReactNode } from 'react';
import * as ex from 'excalibur';
import { ldtkPlayerConfig } from '../Lumiroom/engine';
import { allPlugins } from '@/game/actors/plugins';
import { Dropdown, Menu, Button } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { SupabaseUser } from '@/types/datatypes';
import { getGlobalPlayer } from '@/utils/globalPlayer';

interface PluginDropdownProps {
  gameRef: React.RefObject<ex.Engine | null>;
  user: SupabaseUser
  openPanel: (panel: ReactNode) => void
}

export default function PluginDropdown({ gameRef, user, openPanel }: PluginDropdownProps) {
  const handleSelect = (name: string) => {
    console.log(gameRef, user)
    if (!gameRef || !gameRef.current) return;
    const currentScene = gameRef.current.currentScene;
    if (!currentScene) return;

    const instance = new allPlugins[name]({
      name,
      width: ldtkPlayerConfig.entity.width,
      height: ldtkPlayerConfig.entity.height,
      pos: ldtkPlayerConfig.worldPos,
      z: ldtkPlayerConfig.layer.order + 10,
      currentPlayer: getGlobalPlayer()!,
      currentUser: user,
      openPanel: openPanel
    });

    currentScene.add(instance);
  };

  const menu = (
    <Menu>
      {Object.keys(allPlugins).map((name) => (
        <Menu.Item
          key={name}
          className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          onClick={() => handleSelect(name)}
        >
          {name}
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded shadow-md flex items-center gap-2">
        Add Plugin <DownOutlined />
      </Button>
    </Dropdown>
  );
}
