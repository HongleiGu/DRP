// eslint-disable

export async function writeFile(filePath: string, content: string): Promise<void> {
  const response = await window.electronApi.writeFile(filePath, content);
  if (!response.success) throw new Error(response.error || 'Failed to write file');
}

export async function readFile(filePath: string): Promise<string> {
  const response = await window.electronApi.readFile(filePath);
  if (response.success && typeof response.data === 'string') {
    return response.data;
  }
  throw new Error(response.error || 'Failed to read file');
}

export async function deleteFile(filePath: string): Promise<void> {
  const response = await window.electronApi.deleteFile(filePath);
  if (!response.success) throw new Error(response.error || 'Failed to delete file');
}

export async function createFile(filePath: string): Promise<void> {
  const response = await window.electronApi.createFile(filePath);
  // console.log("creata file", response)
  if (!response.success) throw new Error(response.error || 'Failed to create file');
}

export async function getFiles(directory: string): Promise<string[]> {
  const response = await window.electronApi.getFiles(directory);
  if (response.success && Array.isArray(response.data)) {
    return response.data;
  }
  throw new Error(response.error || 'Failed to get files');
}

export async function existsFile(filePath: string): Promise<boolean> {
  const response = await window.electronApi.existsFile(filePath);
  // if (response.success && typeof response.data === 'boolean') {
  //   return response.data;
  // }
  // throw new Error(response.error || 'Failed to check file existence');
  return response.success // we dont throw an error here
}
