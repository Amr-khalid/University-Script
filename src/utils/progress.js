import fs from 'fs/promises';
import path from 'path';

const PROGRESS_PATH = path.resolve(process.cwd(), 'progress.json');

export class ProgressManager {
  static async load() {
    try {
      const data = await fs.readFile(PROGRESS_PATH, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  static async save(progressData) {
    try {
      await fs.writeFile(PROGRESS_PATH, JSON.stringify(progressData, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save progress.json:', err.message);
    }
  }

  static async clear() {
    try {
      await fs.unlink(PROGRESS_PATH);
    } catch {
      // file might not exist
    }
  }
}
