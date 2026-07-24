import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { ScraperService } from '../playwright/scraperService.js';
import { ExcelHandler } from '../excel/excelHandler.js';
import { ProgressManager } from '../utils/progress.js';
import { Logger } from '../utils/logger.js';

export class SearchRunner {
  constructor(config) {
    this.config = config;
    this.scraper = null;
    this.isInterrupted = false;
  }

  formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
  }

  async run(idList, searchType = 'Range', resumeIndex = 0, initialStats = null) {
    const total = idList.length;
    let foundCount = initialStats?.foundCount || 0;
    let skippedCount = initialStats?.skippedCount || 0;
    const startTime = initialStats?.startTime || Date.now();

    const outputFilePath = path.resolve(
      process.cwd(),
      this.config.outputFolder || './output',
      this.config.outputFile || 'results.xlsx'
    );

    console.log(chalk.cyan.bold(`\n🚀 Initializing University Exam Finder...`));
    console.log(chalk.gray(`Target URL: ${this.config.websiteUrl}`));
    console.log(chalk.gray(`Output Path: ${outputFilePath}`));
    console.log(chalk.gray(`Total items to process: ${total - resumeIndex}`));
    if (resumeIndex > 0) {
      console.log(chalk.yellow(` Resuming from previous session at index #${resumeIndex + 1}`));
    }
    console.log(chalk.cyan(`--------------------------------------------------\n`));

    this.scraper = new ScraperService(this.config);
    
    // Set up interrupt handler for graceful shutdown
    const onSIGINT = async () => {
      this.isInterrupted = true;
      console.log(chalk.yellow('\n\n⚠️ Process interrupted by user (Ctrl+C). Saving current state...'));
    };
    process.on('SIGINT', onSIGINT);

    const spinner = ora({
      text: 'Starting browser session...',
      color: 'cyan'
    }).start();

    try {
      await this.scraper.init();
      spinner.succeed('Browser session initialized successfully.');
    } catch (err) {
      spinner.fail(`Failed to initialize browser session: ${err.message}`);
      await Logger.error('Browser initialization failed', err);
      process.removeListener('SIGINT', onSIGINT);
      return;
    }

    const allFoundStudents = [];

    for (let i = resumeIndex; i < total; i++) {
      if (this.isInterrupted) {
        break;
      }

      const currentId = idList[i];
      const stepNum = i + 1;

      console.log(chalk.blue.bold(`\n[${stepNum}/${total}]`));
      console.log(chalk.white(`Searching: ${chalk.cyan(currentId)}`));

      let result;
      try {
        result = await this.scraper.searchStudent(currentId);
      } catch (err) {
        await Logger.error(`Unexpected search exception for ID ${currentId}`, err);
        result = { found: false, error: err.message };
      }

      if (result && result.found && result.data) {
        foundCount++;
        const student = result.data;
        allFoundStudents.push(student);

        console.log(chalk.green.bold(`✓ ${student.name || 'Found'}`));
        console.log(chalk.gray(`  Course: ${student.course || '-'}`));
        console.log(chalk.gray(`  Committee: ${student.committee || '-'} | Hall: ${student.hall || '-'} | Location: ${student.location || '-'}`));

        // Save immediately to Excel
        try {
          await ExcelHandler.appendResult(outputFilePath, student);
        } catch (excelErr) {
          console.log(chalk.red(`  ⚠️ Excel write warning: ${excelErr.message}`));
          await Logger.error(`Excel append error for ID ${currentId}`, excelErr);
        }
      } else {
        skippedCount++;
        console.log(chalk.red(`✗ Not Found`));
      }

      console.log(chalk.gray(`---------------------`));

      // Save state to progress.json
      await ProgressManager.save({
        searchType,
        total,
        currentIndex: i + 1, // Next index to process
        foundCount,
        skippedCount,
        startTime,
        idList
      });
    }

    // Ensure all accumulated results are saved to Excel before exit
    if (allFoundStudents.length > 0) {
      try {
        await ExcelHandler.saveAllResults(outputFilePath, allFoundStudents, true);
      } catch (excelErr) {
        console.log(chalk.red(`⚠️ Final Excel save warning: ${excelErr.message}`));
      }
    }

    // Cleanup scraper
    await this.scraper.close();
    process.removeListener('SIGINT', onSIGINT);

    const elapsedTime = Date.now() - startTime;
    const formattedTime = this.formatTime(elapsedTime);

    if (this.isInterrupted) {
      console.log(chalk.yellow(`\n==================================================`));
      console.log(chalk.yellow.bold(`⏸️ Search paused. You can resume anytime from the CLI menu.`));
      console.log(chalk.gray(`Processed: ${idList.length > 0 ? (resumeIndex + foundCount + skippedCount) : 0}/${total}`));
      console.log(chalk.green(`Found: ${foundCount}`));
      console.log(chalk.red(`Skipped: ${skippedCount}`));
      console.log(chalk.cyan(`Elapsed Time: ${formattedTime}`));
      console.log(chalk.yellow(`==================================================\n`));
      return;
    }

    // Complete scan - clear progress file
    await ProgressManager.clear();

    console.log(chalk.green.bold(`\n==================================================`));
    console.log(chalk.green.bold(`🎉 Search Completed Successfully!`));
    console.log(chalk.white(`Total Processed : ${chalk.bold(total)}`));
    console.log(chalk.green(`Found           : ${chalk.bold(foundCount)}`));
    console.log(chalk.yellow(`Skipped         : ${chalk.bold(skippedCount)}`));
    console.log(chalk.cyan(`Elapsed Time    : ${chalk.bold(formattedTime)}`));
    console.log(chalk.white(`Results File    : ${chalk.underline(outputFilePath)}`));
    console.log(chalk.green.bold(`==================================================\n`));
  }
}
