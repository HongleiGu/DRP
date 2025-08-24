import fileService from "./fileService";

/**
 * Append a single object as a new line (JSONL format) to the specified file.
 */
export async function appendJsonl(filePath: string, data: object): Promise<void> {
  const originalContent = await fileService.readFile(filePath).catch(() => '');
  const newContent = originalContent + JSON.stringify(data) + '\n';
  await fileService.writeFile(filePath, newContent);
}

/**
 * Append multiple objects as new lines (JSONL format) to the specified file.
 */
export async function appendJsonls(filePath: string, data: object[]): Promise<void> {
  const originalContent = await fileService.readFile(filePath).catch(() => '');
  const newContent = originalContent + data.map(it => JSON.stringify(it)).join('\n') + '\n';
  await fileService.writeFile(filePath, newContent);
}

/**
 * Delete the first JSONL line with a matching `id` field.
 */
export async function deleteJsonlById(filePath: string, id: string): Promise<void> {
  const content = await fileService.readFile(filePath);
  const lines = content.split('\n').filter(line => line.trim() !== '');

  let found = false;
  const updatedLines = lines.filter(line => {
    const obj = JSON.parse(line);
    if (!found && obj.id === id) {
      found = true;
      return false;
    }
    return true;
  });

  await fileService.writeFile(filePath, updatedLines.join('\n') + '\n');
}

/**
 * Replace a JSONL entry with a matching `id` while preserving line order.
 */
export async function replaceJsonlById(filePath: string, updatedObj: { id: string }): Promise<void> {
  const content = await fileService.readFile(filePath);
  const lines = content.split('\n').filter(line => line.trim() !== '');

  let replaced = false;
  const updatedLines = lines.map(line => {
    const obj = JSON.parse(line);
    if (!replaced && obj.id === updatedObj.id) {
      replaced = true;
      return JSON.stringify(updatedObj);
    }
    return line;
  });

  if (!replaced) {
    throw new Error(`No entry with id "${updatedObj.id}" found in ${filePath}`);
  }

  await fileService.writeFile(filePath, updatedLines.join('\n') + '\n');
}

/**
 * Find the first JSONL entry with a matching `id` field.
 */
export async function findJsonlById<T extends { id: string }>(filePath: string, id: string): Promise<T | null> {
  const content = await fileService.readFile(filePath);
  const lines = content.split('\n').filter(line => line.trim() !== '');

  for (const line of lines) {
    const obj = JSON.parse(line) as T;
    if (obj.id === id) return obj;
  }

  return null; // not found
}

/**
 * Parse all lines from a JSONL file and return a typed array.
 */
export async function parseJsonlToTypedObjects<T>(filePath: string): Promise<T[]> {
  if (!(await fileService.existsFile(filePath))) {
    await fileService.createFile(filePath);
    return [];
  }

  const content = await fileService.readFile(filePath);
  const lines = content.split('\n').filter(line => line.trim() !== '');
  return lines.map(line => JSON.parse(line) as T);
}
