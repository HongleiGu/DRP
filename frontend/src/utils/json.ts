import { ElectronResponse } from "@/types/datatypes";

// jsonl format:
// Each line is a valid JSON object, not an array.
// eg.
// {"key1": "value1", "key2": "value2"}
// {"key1": "value3", "key2": "value4"}


// append data to jsonl files
export function appendJsonl(filePath: string, data: object): Promise<ElectronResponse> {
  return new Promise((resolve, reject) => {
    // read the existing content of the file
    // original should be a array of objects
    const original = window.electronApi.readFile(filePath)
    // Convert the data to JSON and append a newline
    const content = JSON.stringify(data) + '\n';
    // write the new content to the file
    
    window.electronApi.writeFile(filePath, original + content)
      .then((response: ElectronResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to append to file'));
        }
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
}

// assumption, every line has a id field
// the deletion only delete the first occurrence of the id
export function deleteJsonlById(filePath: string, id: string): Promise<ElectronResponse> {
  return new Promise((resolve, reject) => {
    // read the existing content of the file
    window.electronApi.readFile(filePath)
      .then((response: ElectronResponse) => {
        if (!response.success) {
          return reject(new Error(response.error || 'Failed to read file'));
        }
        
        const lines = (response.data ?? "").split('\n').filter((line: string) => line.trim() !== '');
        const updatedLines = lines.filter((line: string) => {
          try {
            const obj = JSON.parse(line);
            return obj.id !== id; // filter out the line with the matching id
          } catch {
            // throw error if the line is not a valid JSON
            reject(new Error('Invalid JSON format in file'));
          }
        });

        // write the updated content back to the file
        const updatedContent = updatedLines.join('\n');
        return window.electronApi.writeFile(filePath, updatedContent);
      })
      .then((response: ElectronResponse) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.error || 'Failed to delete from file'));
        }
      })
      .catch((error: Error) => {
        reject(error);
      });
  });
}