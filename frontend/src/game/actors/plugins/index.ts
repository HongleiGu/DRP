/* eslint-disable @typescript-eslint/no-unused-vars */

// Import PluginTest **after** Plugin is defined
import { PluginTest } from './PluginTest';
import { PluginArgs, Plugin } from './Plugin';
import { AIBot } from './AIBot';

export const allPlugins: Record<string, new (args: PluginArgs) => Plugin> = {
  pluginTest: PluginTest,
  aiBot: AIBot
};
