import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { getConfig } from '../config/index.js';
import { SearchRunner } from '../services/runner.js';
import { openSettingsMenu } from './settingsMenu.js';
import { ProgressManager } from '../utils/progress.js';
import { ExcelHandler } from '../excel/excelHandler.js';

export async function showMainMenu() {
  let running = true;

  while (running) {
    console.clear();
    console.log(chalk.cyan.bold(`
==================================================
           🎓 UNIVERSITY EXAM FINDER 🎓
                 Playwright CLI
==================================================
    `));

    // Check for previous saved progress state
    const savedProgress = await ProgressManager.load();
    if (savedProgress) {
      console.log(chalk.yellow.bold(`⚠️  UNFINISHED SEARCH DETECTED!`));
      console.log(chalk.yellow(`Type: ${savedProgress.searchType} | Progress: ${savedProgress.currentIndex}/${savedProgress.total}`));

      const { shouldResume } = await inquirer.prompt([
        {
          type: 'list',
          name: 'shouldResume',
          message: 'What would you like to do with the saved session?',
          choices: [
            'Resume Unfinished Search',
            'Discard Saved Progress and Start New'
          ]
        }
      ]);

      if (shouldResume === 'Resume Unfinished Search') {
        const config = getConfig();
        const runner = new SearchRunner(config);
        await runner.run(
          savedProgress.idList,
          savedProgress.searchType,
          savedProgress.currentIndex,
          {
            foundCount: savedProgress.foundCount,
            skippedCount: savedProgress.skippedCount,
            startTime: savedProgress.startTime
          }
        );
        await pressEnterToContinue();
        continue;
      } else {
        await ProgressManager.clear();
        console.log(chalk.gray('Previous progress cleared.'));
      }
    }

    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'Select an option:',
        choices: [
          '1. Search by Range',
          '2. Search by Excel File',
          '3. Launch Web Dashboard UI (لوحة التحكم على المتصفح)',
          '4. Settings',
          '5. Exit'
        ]
      }
    ]);

    switch (choice) {
      case '1. Search by Range':
        await handleRangeSearch();
        break;
      case '2. Search by Excel File':
        await handleExcelSearch();
        break;
      case '3. Launch Web Dashboard UI (لوحة التحكم على المتصفح)':
        await handleLaunchWebUI();
        break;
      case '4. Settings':
        await openSettingsMenu();
        break;
      case '5. Exit':
        running = false;
        console.log(chalk.cyan('\nGoodbye! 👋\n'));
        break;
    }
  }
}

async function handleLaunchWebUI() {
  console.log(chalk.cyan.bold('\n🚀 Launching Web Dashboard Server...'));
  console.log(chalk.gray('Opening http://localhost:3000 in your default browser...\n'));

  // Import server or start process
  try {
    const { exec } = await import('child_process');
    exec('start http://localhost:3000');
    await import('../server/index.js');
  } catch (err) {
    console.log(chalk.red(`Failed to launch Web UI: ${err.message}`));
  }

  await pressEnterToContinue();
}

async function handleRangeSearch() {
  console.log(chalk.blue.bold('\n--- SEARCH BY RANGE ---'));

  const { startIdInput, endIdInput } = await inquirer.prompt([
    {
      type: 'input',
      name: 'startIdInput',
      message: 'Enter Start ID (e.g. 2300001):',
      validate: val => !isNaN(val) && val.trim() !== '' ? true : 'Please enter a valid numeric ID'
    },
    {
      type: 'input',
      name: 'endIdInput',
      message: 'Enter End ID (e.g. 2300500):',
      validate: (val, answers) => {
        if (isNaN(val) || val.trim() === '') return 'Please enter a valid numeric ID';
        if (BigInt(val) < BigInt(answers.startIdInput)) return 'End ID must be greater than or equal to Start ID';
        return true;
      }
    }
  ]);

  const startId = BigInt(startIdInput.trim());
  const endId = BigInt(endIdInput.trim());
  const idList = [];

  // Handle standard or zero-padded string format preservation
  const padLength = startIdInput.trim().length;

  for (let current = startId; current <= endId; current++) {
    idList.push(String(current).padStart(padLength, '0'));
  }

  const config = getConfig();
  const runner = new SearchRunner(config);
  await runner.run(idList, 'Range');

  await pressEnterToContinue();
}

async function handleExcelSearch() {
  console.log(chalk.blue.bold('\n--- SEARCH BY EXCEL FILE ---'));

  const config = getConfig();
  const defaultFilePath = path.resolve(process.cwd(), config.inputExcelFile || 'ids.xlsx');

  const { fileOption } = await inquirer.prompt([
    {
      type: 'list',
      name: 'fileOption',
      message: 'Which Excel file would you like to search from?',
      choices: [
        `Default file in project folder (${config.inputExcelFile || 'ids.xlsx'})`,
        'Enter custom Excel file path from my computer',
        'Cancel'
      ]
    }
  ]);

  if (fileOption === 'Cancel') return;

  let targetPath = defaultFilePath;

  if (fileOption === 'Enter custom Excel file path from my computer') {
    const { customPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customPath',
        message: 'Enter full path to your Excel file (e.g. C:\\Users\\Name\\Desktop\\students.xlsx):',
        validate: async input => {
          const cleanPath = input.trim().replace(/^["']|["']$/g, '');
          try {
            await fs.access(cleanPath);
            return true;
          } catch {
            return 'File does not exist at this path. Please check the path and try again.';
          }
        }
      }
    ]);
    targetPath = customPath.trim().replace(/^["']|["']$/g, '');
  } else {
    try {
      await fs.access(defaultFilePath);
    } catch {
      console.log(chalk.yellow(`\nDefault Excel file not found at: ${defaultFilePath}`));
      const { createSample } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createSample',
          message: 'Would you like to create a sample ids.xlsx file now?',
          default: true
        }
      ]);
      if (createSample) {
        await ExcelHandler.createSampleInputFile(defaultFilePath);
        console.log(chalk.green(`✓ Sample file created at ${defaultFilePath}. Add your student IDs under column "ID" and run again.`));
      }
      await pressEnterToContinue();
      return;
    }
  }

  try {
    const ids = await ExcelHandler.readIdsFromExcel(targetPath);
    if (!ids || ids.length === 0) {
      console.log(chalk.red('No valid IDs found in column "ID" of Excel file.'));
      await pressEnterToContinue();
      return;
    }

    console.log(chalk.green(`\nLoaded ${ids.length} ID(s) from file: ${targetPath}`));
    console.log(chalk.gray(`IDs to search: ${ids.join(', ')}\n`));
    const runner = new SearchRunner(config);
    await runner.run(ids, 'Excel File');
  } catch (err) {
    console.log(chalk.red(`Error processing Excel file: ${err.message}`));
  }

  await pressEnterToContinue();
}

async function pressEnterToContinue() {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message: chalk.gray('Press ENTER to return to main menu...')
    }
  ]);
}
