import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';
import { chromium } from 'playwright';
import { getConfig, updateConfig, loadConfig } from '../config/index.js';
import { ExcelHandler } from '../excel/excelHandler.js';
import { SearchRunner } from '../services/runner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads');

// Ensure uploads folder exists
await fs.mkdir(UPLOADS_DIR, { recursive: true });

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

// Global execution state tracker
let activeRunner = null;
let currentStatus = {
  isSearching: false,
  status: 'idle', // 'idle', 'running', 'paused', 'completed', 'error'
  searchType: '',
  currentId: '',
  stepNum: 0,
  total: 0,
  foundCount: 0,
  skippedCount: 0,
  startTime: null,
  elapsedMs: 0,
  lastFoundStudent: null,
  logs: []
};

function addLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('ar-EG', { hour12: false });
  currentStatus.logs.push({ timestamp, message, type });
  if (currentStatus.logs.length > 200) {
    currentStatus.logs.shift();
  }
}

// 1. GET Current Configuration
app.get('/api/config', async (req, res) => {
  try {
    const config = await loadConfig();
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. UPDATE Configuration
app.post('/api/config', async (req, res) => {
  try {
    const newConfig = req.body;
    const updated = await updateConfig(newConfig);
    addLog('تم تحديث الإعدادات ورابط الموقع بنجاح', 'success');
    res.json({ success: true, config: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. UPLOAD Excel File & Extract IDs
app.post('/api/upload-excel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'لم يتم اختيار ملف Excel.' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;

    // Read IDs using ExcelHandler
    const ids = await ExcelHandler.readIdsFromExcel(filePath);

    addLog(`تم تحميل الملف ${originalName} واستخراج ${ids.length} كود طالب.`, 'info');

    res.json({
      success: true,
      filename: originalName,
      filePath: filePath,
      count: ids.length,
      ids: ids
    });
  } catch (err) {
    res.status(500).json({ success: false, error: `فشل قراءة ملف Excel: ${err.message}` });
  }
});

// 4. START Search Process
app.post('/api/search/start', async (req, res) => {
  if (currentStatus.isSearching) {
    return res.status(400).json({ success: false, error: 'يوجد بحث يعمل حالياً بالفعل.' });
  }

  const { searchType, startId, endId, idsList } = req.body;
  let idsToProcess = [];

  if (searchType === 'Range') {
    if (!startId || !endId) {
      return res.status(400).json({ success: false, error: 'يرجى إدخال بداية ونهاية النطاق.' });
    }
    const start = BigInt(startId.trim());
    const end = BigInt(endId.trim());
    const padLength = startId.trim().length;

    for (let cur = start; cur <= end; cur++) {
      idsToProcess.push(String(cur).padStart(padLength, '0'));
    }
  } else if (searchType === 'Excel') {
    if (!Array.isArray(idsList) || idsList.length === 0) {
      return res.status(400).json({ success: false, error: 'لم يتم توفير قائمة الأكواد من ملف Excel.' });
    }
    idsToProcess = idsList;
  }

  if (idsToProcess.length === 0) {
    return res.status(400).json({ success: false, error: 'قائمة البحث فارغة.' });
  }

  // Reset status
  currentStatus = {
    isSearching: true,
    status: 'running',
    searchType,
    currentId: '',
    stepNum: 0,
    total: idsToProcess.length,
    foundCount: 0,
    skippedCount: 0,
    startTime: Date.now(),
    elapsedMs: 0,
    lastFoundStudent: null,
    logs: []
  };

  addLog(`بدء عملية البحث (${searchType}) لعدد ${idsToProcess.length} طالب...`, 'info');

  const config = await loadConfig();

  activeRunner = new SearchRunner(config, (progress) => {
    currentStatus.status = progress.status;
    currentStatus.total = progress.total;
    currentStatus.foundCount = progress.foundCount;
    currentStatus.skippedCount = progress.skippedCount;

    if (progress.status === 'running') {
      currentStatus.currentId = progress.currentId;
      currentStatus.stepNum = progress.stepNum;

      if (progress.isFound && progress.student) {
        currentStatus.lastFoundStudent = progress.student;
        addLog(`✓ تم العثور على: ${progress.student.name} (كود: ${progress.currentId})`, 'success');
      } else {
        addLog(`✗ لم يتم العثور على بيانات للكود: ${progress.currentId}`, 'warning');
      }
    } else if (progress.status === 'completed') {
      currentStatus.isSearching = false;
      addLog(`🎉 اكتملت عملية البحث بنجاح! إجمالي المستخرج: ${progress.foundCount}`, 'success');
    } else if (progress.status === 'paused') {
      currentStatus.isSearching = false;
      addLog(`⏸️ تم إيقاف البحث مؤقتاً.`, 'warning');
    }
  });

  // Execute asynchronously
  activeRunner.run(idsToProcess, searchType).catch(err => {
    currentStatus.isSearching = false;
    currentStatus.status = 'error';
    addLog(`خطأ غير متوقع أثناء البحث: ${err.message}`, 'error');
  });

  res.json({ success: true, message: 'بدأت عملية البحث بنجاح', total: idsToProcess.length });
});

// 5. STOP Search Process
app.post('/api/search/stop', (req, res) => {
  if (activeRunner) {
    activeRunner.stop();
    currentStatus.isSearching = false;
    currentStatus.status = 'paused';
    addLog('جاري إيقاف عملية البحث...', 'warning');
    res.json({ success: true, message: 'تم إرسال إشارة الإيقاف.' });
  } else {
    res.status(400).json({ success: false, error: 'لا يوجد بحث شغال حالياً.' });
  }
});

// 6. GET Search Status
app.get('/api/search/status', (req, res) => {
  if (currentStatus.startTime && currentStatus.isSearching) {
    currentStatus.elapsedMs = Date.now() - currentStatus.startTime;
  }
  res.json({ success: true, status: currentStatus });
});

// 7. GET Results Table
app.get('/api/results', async (req, res) => {
  try {
    const config = await loadConfig();
    const outputFilePath = path.resolve(
      PROJECT_ROOT,
      config.outputFolder || './output',
      config.outputFile || 'results.xlsx'
    );

    try {
      await fs.access(outputFilePath);
    } catch {
      return res.json({ success: true, results: [], message: 'ملف النتائج غير موجود بعد.' });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(outputFilePath);
    const worksheet = workbook.getWorksheet('Results') || workbook.worksheets[0];

    if (!worksheet) {
      return res.json({ success: true, results: [] });
    }

    const results = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      const values = row.values;
      results.push({
        id: values[1] || '',
        name: values[2] || '',
        faculty: values[3] || '',
        course: values[4] || '',
        committee: values[5] || '',
        hall: values[6] || '',
        location: values[7] || ''
      });
    });

    res.json({ success: true, results, count: results.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. DOWNLOAD Results File
app.get('/api/results/download', async (req, res) => {
  try {
    const config = await loadConfig();
    const outputFilePath = path.resolve(
      PROJECT_ROOT,
      config.outputFolder || './output',
      config.outputFile || 'results.xlsx'
    );

    res.download(outputFilePath, 'exam_results.xlsx');
  } catch (err) {
    res.status(400).send(`تعذر تحميل الملف: ${err.message}`);
  }
});

// 9. TEST Target URL Connectivity
app.post('/api/test-url', async (req, res) => {
  const { url, inputSelector } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال الرابط للتجربة.' });
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const status = response.status();
    const title = await page.title();

    let selectorFound = false;
    if (inputSelector) {
      const el = await page.$(inputSelector);
      selectorFound = !!el;
    }

    await browser.close();
    res.json({
      success: true,
      httpStatus: status,
      pageTitle: title,
      selectorFound
    });
  } catch (err) {
    if (browser) await browser.close();
    res.json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Web Dashboard Server is running at: http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
