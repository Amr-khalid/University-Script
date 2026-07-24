import inquirer from 'inquirer';
import chalk from 'chalk';
import { getConfig, updateConfig } from '../config/index.js';

export async function openSettingsMenu() {
  let inSettings = true;

  while (inSettings) {
    const config = getConfig();

    console.log(chalk.cyan.bold('\n⚙️  APPLICATION SETTINGS'));
    console.log(chalk.gray(`1. Website URL   : ${config.websiteUrl}`));
    console.log(chalk.gray(`2. Search Delay  : ${config.searchDelay.min} - ${config.searchDelay.max} ms`));
    console.log(chalk.gray(`3. Headless Mode : ${config.headless ? 'Enabled (Hidden)' : 'Disabled (Visible Browser)'}`));
    console.log(chalk.gray(`4. Timeout       : ${config.timeout} ms`));
    console.log(chalk.gray(`5. Output Folder : ${config.outputFolder}`));
    console.log(chalk.gray(`6. Output File   : ${config.outputFile}`));
    console.log(chalk.gray('--------------------------------------------------'));

    const { option } = await inquirer.prompt([
      {
        type: 'list',
        name: 'option',
        message: 'Select setting to modify:',
        choices: [
          'Change Website URL',
          'Change Search Delay (Min ~ Max)',
          'Toggle Headless Mode',
          'Change Page Timeout',
          'Change Output Folder',
          'Change Output File Name',
          'Back to Main Menu'
        ]
      }
    ]);

    switch (option) {
      case 'Change Website URL': {
        const { url } = await inquirer.prompt([
          {
            type: 'input',
            name: 'url',
            message: 'Enter target Website URL:',
            default: config.websiteUrl,
            validate: input => input.startsWith('http') ? true : 'Please enter a valid URL (starting with http:// or https://)'
          }
        ]);
        await updateConfig({ websiteUrl: url.trim() });
        console.log(chalk.green('✓ Website URL updated.'));
        break;
      }

      case 'Change Search Delay (Min ~ Max)': {
        const { minDelay, maxDelay } = await inquirer.prompt([
          {
            type: 'number',
            name: 'minDelay',
            message: 'Enter Minimum Delay (ms):',
            default: config.searchDelay.min,
            validate: val => val >= 0 ? true : 'Must be >= 0'
          },
          {
            type: 'number',
            name: 'maxDelay',
            message: 'Enter Maximum Delay (ms):',
            default: config.searchDelay.max,
            validate: val => val >= 0 ? true : 'Must be >= 0'
          }
        ]);
        await updateConfig({ searchDelay: { min: minDelay, max: maxDelay } });
        console.log(chalk.green('✓ Search Delay updated.'));
        break;
      }

      case 'Toggle Headless Mode': {
        const { headless } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'headless',
            message: 'Run browser in Headless mode (hidden)?',
            default: config.headless
          }
        ]);
        await updateConfig({ headless });
        console.log(chalk.green(`✓ Headless mode set to ${headless}.`));
        break;
      }

      case 'Change Page Timeout': {
        const { timeout } = await inquirer.prompt([
          {
            type: 'number',
            name: 'timeout',
            message: 'Enter Timeout (ms):',
            default: config.timeout,
            validate: val => val >= 1000 ? true : 'Must be >= 1000 ms'
          }
        ]);
        await updateConfig({ timeout });
        console.log(chalk.green('✓ Page Timeout updated.'));
        break;
      }

      case 'Change Output Folder': {
        const { folder } = await inquirer.prompt([
          {
            type: 'input',
            name: 'folder',
            message: 'Enter Output Folder path:',
            default: config.outputFolder
          }
        ]);
        await updateConfig({ outputFolder: folder.trim() });
        console.log(chalk.green('✓ Output Folder updated.'));
        break;
      }

      case 'Change Output File Name': {
        const { file } = await inquirer.prompt([
          {
            type: 'input',
            name: 'file',
            message: 'Enter Output Excel File Name:',
            default: config.outputFile,
            validate: val => val.endsWith('.xlsx') ? true : 'File name must end with .xlsx'
          }
        ]);
        await updateConfig({ outputFile: file.trim() });
        console.log(chalk.green('✓ Output File Name updated.'));
        break;
      }

      case 'Back to Main Menu':
        inSettings = false;
        break;
    }
  }
}
