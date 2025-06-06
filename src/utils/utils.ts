// // Function to convert snake_case to camelCase
// function toCamelCase(snakeCase: string): string {
//   return snakeCase.replace(/(_\w)/g, (matches) => matches[1].toUpperCase());
// }

// // Generic function to convert all keys of an object from snake_case to camelCase, excluding arrays
// export function convertKeysToCamelCase<T extends object>(obj: T): {
//   [K in keyof T as K extends string ? (K extends `${infer P}_${infer R}` ? `${P}${Capitalize<R>}` : K) : K]: T[K]
// } {
//   // Check if the input is an object (not an array)
//   if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     return obj as any; // Return as is if it's not an object
//   }

//   return Object.keys(obj).reduce((acc, key) => {
//     const camelKey = toCamelCase(key);
//     acc[camelKey as keyof T] = obj[key as keyof T];
//     return acc;
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   }, {} as any); // Use 'any' to avoid type errors
// }

import { z } from 'zod';

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