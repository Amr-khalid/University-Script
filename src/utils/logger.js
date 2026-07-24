import fs from 'fs/promises';
import path from 'path';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'screenshots');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

export class Logger {
  static async init() {
    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
  }

  static getTimestamp() {
    return new Date().toISOString();
  }

  static async log(message, level = 'INFO') {
    await this.init();
    const entry = `[${this.getTimestamp()}] [${level}] ${message}\n`;
    try {
      await fs.appendFile(LOG_FILE, entry, 'utf-8');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  static async error(message, err = null) {
    const errorDetails = err ? ` | Error: ${err.message || err}` : '';
    await this.log(`${message}${errorDetails}`, 'ERROR');
  }

  static async takeScreenshot(page, id) {
    try {
      await this.init();
      const filename = `error_${id}_${Date.now()}.png`;
      const filepath = path.join(SCREENSHOT_DIR, filename);
      if (page && !page.isClosed()) {
        await page.screenshot({ path: filepath, fullPage: true });
        await this.log(`Error screenshot saved to ${filepath}`, 'WARN');
      }
    } catch (error) {
      await this.error('Failed to take error screenshot', error);
    }
  }
}
