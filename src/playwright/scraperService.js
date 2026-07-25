import { chromium } from 'playwright';
import { Logger } from '../utils/logger.js';
import { randomDelay } from '../utils/delay.js';

export class ScraperService {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async init() {
    this.browser = await chromium.launch({
      headless: this.config.headless ?? false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.config.timeout || 30000);

    // Initial navigation to site once
    await this.navigateToSite();
  }

  async navigateToSite() {
    let attempts = 0;
    const maxAttempts = this.config.maxRetries || 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        await this.page.goto(this.config.websiteUrl, {
          waitUntil: 'domcontentloaded',
          timeout: this.config.timeout || 30000
        });
        await this.page.waitForSelector(this.config.inputSelector, { timeout: 10000 });
        return;
      } catch (err) {
        await Logger.error(`Initial page load failed (Attempt ${attempts}/${maxAttempts})`, err);
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to load target website (${this.config.websiteUrl}) after ${maxAttempts} attempts.`);
        }
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  /**
   * Submits student ID and extracts exam metadata after handling ASP.NET PostBack.
   */
  async searchStudent(studentId) {
    const minDelay = this.config.searchDelay?.min || 500;
    const maxDelay = this.config.searchDelay?.max || 1200;

    // Apply anti-bot randomized search delay
    await randomDelay(minDelay, maxDelay);

    let attempts = 0;
    const maxRetries = this.config.maxRetries || 3;

    while (attempts < maxRetries) {
      try {
        attempts++;
        
        // Ensure we are on the main form page
        const inputElement = await this.page.$(this.config.inputSelector);
        if (!inputElement) {
          await this.navigateToSite();
        }

        // Fill input ID
        await this.page.fill(this.config.inputSelector, String(studentId));

        // Click submit button & wait for ASP.NET PostBack execution
        await Promise.all([
          this.page.waitForLoadState('networkidle').catch(() => {}),
          this.page.click(this.config.submitSelector)
        ]);

        // Small grace period for DOM render after postback
        await this.page.waitForTimeout(400);

        // Check if student exists or result is found
        const studentData = await this.extractStudentData(studentId);
        return studentData;

      } catch (err) {
        await Logger.error(`Search error for ID ${studentId} (Attempt ${attempts}/${maxRetries})`, err);
        
        if (attempts >= maxRetries) {
          await Logger.takeScreenshot(this.page, studentId);
          // Try reloading page for next ID
          try {
            await this.navigateToSite();
          } catch {}
          return { found: false, error: err.message };
        }

        // Wait before retrying on failure (e.g. temporary network drop)
        await new Promise(r => setTimeout(r, 2000 * attempts));
      }
    }

    return { found: false };
  }

  /**
   * Scrapes result labels/tables dynamically based on config selectors and site HTML structure.
   */
  async extractStudentData(requestedId) {
    return await this.page.evaluate(({ requestedId }) => {
      // 1. Get student name from #Label3
      const nameEl = document.querySelector('#Label3');
      const studentName = nameEl ? nameEl.innerText.trim() : '';

      // 2. Get faculty from #Label4
      const facultyEl = document.querySelector('#Label4');
      const faculty = facultyEl ? facultyEl.innerText.trim() : '';

      // If student name is empty, the student record does not exist
      if (!studentName) {
        return { found: false };
      }

      // 3. Extract exam schedule details from #GridView1 table
      let committee = '';
      let hall = '';
      let location = '';
      let course = '';

      let examsList = [];

      const gridView = document.querySelector('#GridView1');
      if (gridView) {
        const rows = Array.from(gridView.querySelectorAll('tr'));
        // Skip header row (index 0)
        const dataRows = rows.slice(1);

        if (dataRows.length > 0) {
          const coursesList = [];
          const committeesList = [];
          const hallsList = [];
          const locationsList = [];

          for (const row of dataRows) {
            const cells = Array.from(row.querySelectorAll('td')).map(c => c.innerText.trim());
            if (cells.length >= 5) {
              const cName = cells[0] || '';
              const cComm = cells[2] || '';
              const cHall = cells[3] || '';
              const cLoc = cells[4] || '';

              if (cName) coursesList.push(cName);
              if (cComm) committeesList.push(cComm);
              if (cHall) hallsList.push(cHall);
              if (cLoc) locationsList.push(cLoc);

              if (cName) {
                examsList.push({
                  course: cName,
                  committee: cComm,
                  hall: cHall,
                  location: cLoc
                });
              }
            }
          }

          course = coursesList.join(' | ');
          committee = committeesList.join(' | ');
          hall = hallsList.join(' | ');
          location = locationsList.join(' | ');
        }
      }

      return {
        found: true,
        data: {
          id: String(requestedId),
          name: studentName,
          faculty: faculty,
          course: course || '-',
          committee: committee || '-',
          hall: hall || '-',
          location: location || '-',
          exams: examsList
        }
      };
    }, {
      requestedId: String(requestedId)
    });
  }

  async close() {
    try {
      if (this.context) await this.context.close();
      if (this.browser) await this.browser.close();
    } catch (err) {
      await Logger.error('Error closing browser session', err);
    }
  }
}
