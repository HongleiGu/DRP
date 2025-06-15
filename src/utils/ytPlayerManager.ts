/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// import { TVState } from "@/types/datatypes";

let ytPlayerInstance: any = null;

export const setYtPlayer = (player: any) => {
  ytPlayerInstance = player;
};

export const getYtPlayer = () => {
  return ytPlayerInstance;
};

export const clearYtPlayer = () => {
  ytPlayerInstance = null;
};

export const getCurrentVideoId = (): string => {
  return extractVideoId(ytPlayerInstance?.getVideoUrl?.());
};

export const getCurrentTime = (): number => {
  try {
    const time = ytPlayerInstance?.getCurrentTime()
    // console.log(time)
    return typeof time === "number" && !isNaN(time) ? Math.round(time) : 0;
  } catch {
    return 0;
  }
};

export const extractVideoId = (videoUrl: string): string => {
  if (!videoUrl) return "";
  try {
    const url = new URL(videoUrl);
    if (
      url.hostname.includes("youtube.com") ||
      url.hostname.includes("youtu.be")
    ) {
      return url.searchParams.get("v") || url.pathname.split("/").pop() || "";
    }
    return "";
  } catch (e) {
    return "";
  }
};
