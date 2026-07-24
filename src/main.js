import { loadConfig } from './config/index.js';
import { Logger } from './utils/logger.js';
import { showMainMenu } from './cli/menu.js';

async function main() {
  try {
    // 1. Load system configurations
    await loadConfig();

    // 2. Initialize loggers and directories
    await Logger.init();

    // 3. Launch CLI interface
    await showMainMenu();
  } catch (error) {
    console.error('Fatal Application Error:', error);
    process.exit(1);
  }
}

main();
