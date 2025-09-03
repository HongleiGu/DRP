import { Player } from "@/game/actors/Player";

let globalPlayer: Player | null;

export function setGlobalPlayer(player: Player) {
  console.log("setGlobalPlayer", player)
  globalPlayer = player;
}

export function getGlobalPlayer(): Player | null {
  // if (!_globalPlayer) {
  //   throw new Error("Global player has not been initialized yet!");
  // }
  console.log("globalPlayer", globalPlayer)
  return globalPlayer;
}
