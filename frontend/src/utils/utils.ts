import globalStore from '@/store';
import { CapacitorHttp } from '@capacitor/core';
import { z } from 'zod';
import { isCapacitor } from './env';

// Function to convert snake_case to camelCase
function toCamelCase(snakeCase: string): string {
  return snakeCase.replace(/(_\w)/g, (matches) => matches[1].toUpperCase());
}

// Generic function to convert all keys of an object from snake_case to camelCase, excluding arrays
export function convertKeysToCamelCase<T extends object>(obj: T): {
  [K in keyof T as K extends string ? (K extends `${infer P}_${infer R}` ? `${P}${Capitalize<R>}` : K) : K]: T[K]
} {
  // Check if the input is an object (not an array)
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return obj as any; // Return as is if it's not an object
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = toCamelCase(key);
    acc[camelKey as keyof T] = obj[key as keyof T];
    return acc;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as any); // Use 'any' to avoid type errors
}

// Zod schema for UUID validation
const uuidSchema = z.string().uuid();

// Type guard function
export function isUUID(str: string): str is string {
  return uuidSchema.safeParse(str).success;
}


// Alternative version that returns boolean
export function isValidUUID(str: string): boolean {
  return uuidSchema.safeParse(str).success;
}

export function isEmoji (str: string): boolean {
  const emojiRegex = /([\u203C-\u3299]|[\uD83C][\uDFFB-\uFFFF]|[\uD83D][\uDC00-\uDE4F]|[\uD83E][\uDD00-\uDE7F]|[\u2700-\u27BF])/g;
  return emojiRegex.test(str);
};

export function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const UPDATE_INTERVAL = 200 // 100ms = 0.1s

export const ALL_EMOJIS = [
    {
      name: "Smileys & People",
      emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "🥲", "☺️", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘"]
    },
    {
      name: "Animals & Nature",
      emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🦄", "🐝", "🦋", "🐞"]
    },
    {
      name: "Food & Drink",
      emojis: ["🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆"]
    },
    {
      name: "Activity",
      emojis: ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅"]
    },
    {
      name: "Travel & Places",
      emojis: ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🛵", "🏍", "🛺", "✈️", "🚀"]
    },
    {
      name: "Objects",
      emojis: ["💡", "🔦", "📱", "📲", "💻", "⌨️", "🖥", "🖨", "🖱", "🖲", "📞", "📟", "📠", "📺", "📷", "🎥", "📽", "🎞", "📀"]
    },
    {
      name: "Symbols",
      emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"]
    },
    {
      name: "Flags",
      emojis: ["🏳️", "🏴", "🏁", "🚩", "🏳️‍🌈", "🏴‍☠️", "🇦🇫", "🇦🇽", "🇦🇱", "🇩🇿", "🇦🇸", "🇦🇩", "🇦🇴", "🇦🇮", "🇦🇶", "🇦🇬", "🇦🇷", "🇦🇲", "🇦🇼"]
    }
  ]

export const YOUTUBE_CATEGORIES: Record<string, string> = {
  '1': 'Film & Animation',
  '2': 'Autos & Vehicles',
  '10': 'Music',
  '15': 'Pets & Animals',
  '17': 'Sports',
  '18': 'Short Movies',
  '19': 'Travel & Events',
  '20': 'Gaming',
  '21': 'Videoblogging',
  '22': 'People & Blogs',
  '23': 'Comedy',
  '24': 'Entertainment',
  '25': 'News & Politics',
  '26': 'Howto & Style',
  '27': 'Education',
  '28': 'Science & Technology',
  '29': 'Nonprofits & Activism',
} as const;

export type YouTubeCategoryId = keyof typeof YOUTUBE_CATEGORIES;

export const getCategoryName = (id: string): string => {
  return YOUTUBE_CATEGORIES[id] || `Category ${id}`;
};

// timezone utils

const rawTimeZones = Intl.supportedValuesOf("timeZone");

const cascaderTimeZones = rawTimeZones.reduce((acc, tz) => {
  const parts = tz.split("/");

  if (parts.length < 2) return acc; // Skip root-level or malformed zones

  const [region, ...cityParts] = parts;
  const city = cityParts.join(" ").replace(/_/g, " "); // Convert to "New York", "Los Angeles"

  if (!acc[region]) {
    acc[region] = [];
  }

  acc[region].push({
    value: tz,
    label: city,
  });

  return acc;
}, {} as Record<string, { value: string; label: string }[]>);

export const cascaderOptions = Object.entries(cascaderTimeZones).map(([region, cities]) => ({
  value: region,
  label: region,
  children: cities.sort((a, b) => a.label.localeCompare(b.label)),
}));


export const PROJECT_NAME = "togethere"
export const PROJECT_NAME_CAPITALIZED = "Togethere"

export const formatDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const placeholderId = '00000000-0000-0000-0000-000000000000';  // Static UUID for placeholder

export const STORAGE_PATH = process.env.STORAGE_PATH || "D:/Desktop/study/projects/DRP/storage";

export const veryOldDate = "1970-01-01T00:00:00.000Z";

export const BASE_URL = process.env.NEXT_PUBLIC_SPRINGBOOT_URL || 'http://localhost:8080';

export interface FetchOptions extends RequestInit {
  skipAuth?: boolean; // skip JWT token injection
}

export async function fetchJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const url = typeof input === 'string' ? input : input.url;
  console.log('[fetchJson] fetching', url, init);

  // Always check for JWT (skip for auth endpoints)
  let token: string = '';
  if (!url.startsWith(`${BASE_URL}/api/auth`)) {
    token = (await globalStore.getItem<string>('jwt-token')) ?? '';
    if (!token) throw new Error('you have not logged in yet');
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = token;

  try {
    if (isCapacitor()) {
      // ✅ Native Capacitor HTTP request
      const response = await CapacitorHttp.request({
        url,
        method: (init?.method || 'GET').toUpperCase(),
        headers,
        data: init?.body ? JSON.parse(init.body as string) : undefined,
      });

      if (response.status !== 200) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const payload = response.data as { code: number; msg: string; data?: T };
      if (payload.code !== 200) {
        throw new Error(payload.msg || `API error: ${payload.code}`);
      }
      return payload.data as T;
    } else {
      // ✅ Browser/Electron fetch
      const res = await fetch(url, { ...init, headers });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const payload = (await res.json()) as { code: number; msg: string; data?: T };
      if (payload.code !== 200) {
        throw new Error(payload.msg || `API error: ${payload.code}`);
      }
      return payload.data as T;
    }
  } catch (err) {
    console.error('[fetchJson] Failed:', err);
    throw err;
  }
}