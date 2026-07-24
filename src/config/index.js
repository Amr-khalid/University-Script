import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.resolve(__dirname, '../../config.json');

let currentConfig = null;

export async function loadConfig() {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    currentConfig = JSON.parse(data);
    return currentConfig;
  } catch (error) {
    console.error('Failed to load config.json, using defaults.', error);
    currentConfig = {
      websiteUrl: 'http://applications.eelu.edu.eg/certificates/Gourmet_exams.aspx',
      inputSelector: '#txtIdentification',
      submitSelector: '#btnSubmit',
      searchDelay: { min: 500, max: 1200 },
      headless: false,
      timeout: 30000,
      maxRetries: 3,
      outputFolder: './output',
      outputFile: 'results.xlsx',
      inputExcelFile: 'ids.xlsx',
      selectors: {
        fields: {
          studentId: '#lblStudentID',
          studentName: '#lblName',
          committee: '#lblCommittee',
          hall: '#lblHall',
          location: '#lblLocation'
        }
      }
    };
    return currentConfig;
  }
}

export function getConfig() {
  if (!currentConfig) {
    throw new Error('Config not loaded yet. Call loadConfig() first.');
  }
  return currentConfig;
}

export async function updateConfig(newPartialConfig) {
  currentConfig = { ...currentConfig, ...newPartialConfig };
  await fs.writeFile(CONFIG_PATH, JSON.stringify(currentConfig, null, 2), 'utf-8');
  return currentConfig;
}
