import { ElectronResponse } from "@/types/datatypes";
import { createFile, existsFile, readFile, writeFile } from "./electronApi";

/**
 * Append a single object as a new line (JSONL format) to the specified file.
 */
export async function appendJsonl(filePath: string, data: object): Promise<ElectronResponse> {
  try {
    const originalContent = await readFile(filePath).catch(() => '');
    const newContent = originalContent + JSON.stringify(data) + '\n';
    await writeFile(filePath, newContent);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete the first JSONL line with a matching `id` field.
 */
export async function deleteJsonlById(filePath: string, id: string): Promise<ElectronResponse> {
  try {
    const content = await readFile(filePath);
    const lines = content.split('\n').filter(line => line.trim() !== '');

    let found = false;
    const updatedLines = lines.filter(line => {
      try {
        const obj = JSON.parse(line);
        if (!found && obj.id === id) {
          found = true;
          return false; // skip this line (delete it)
        }
        return true;
      } catch {
        throw new Error('Invalid JSON format in file');
      }
    });

    await writeFile(filePath, updatedLines.join('\n') + '\n');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Parse all lines from a JSONL file and cast them to a typed array of T.
 */
export async function parseJsonlToTypedObjects<T>(filePath: string): Promise<T[]> {
  try {
    if (!(await existsFile(filePath))) {
      await createFile(filePath)
      return []
    }
    const content = await readFile(filePath);
    const lines = content.split('\n').filter(line => line.trim() !== '');

    return lines.map(line => JSON.parse(line) as T);
  } catch (error) {
    console.error(`Failed to parse JSONL from ${filePath}:`, error);
    return [];
  }
}

/**
 * Replace a JSONL entry with a matching `id` while preserving line order.
 */
export async function replaceJsonlById(filePath: string, updatedObj: { id: string }): Promise<ElectronResponse> {
  try {
    const content = await readFile(filePath);
    const lines = content.split('\n').filter(line => line.trim() !== '');

    let replaced = false;
    const updatedLines = lines.map(line => {
      try {
        const obj = JSON.parse(line);
        if (!replaced && obj.id === updatedObj.id) {
          replaced = true;
          return JSON.stringify(updatedObj);
        }
        return line;
      } catch {
        throw new Error('Invalid JSON format in file');
      }
    });

    if (!replaced) {
      return { success: false, error: `No entry with id "${updatedObj.id}" found` };
    }

    await writeFile(filePath, updatedLines.join('\n') + '\n');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
