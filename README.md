# 🎓 University Exam Finder CLI

![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?logo=node.js)
![Playwright](https://img.shields.io/badge/Playwright-v1.45-blue?logo=playwright)
![ExcelJS](https://img.shields.io/badge/ExcelJS-v4.4-brightgreen)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

A complete, modular Node.js CLI application powered by **Playwright** and **ExcelJS** to automate searching student exam committees, locations, halls, courses, and schedules from university web portals (ASP.NET WebForms) and export all structured student records directly to Microsoft Excel (`results.xlsx`).

---

## 🌟 Key Features

- ⚡ **Interactive CLI Interface**: Built using `inquirer`, `chalk`, and live `ora` spinners.
- 🔍 **Multiple Search Modes**:
  - **Search by Range**: Specify start and end IDs (e.g. `2300001` to `2300500`).
  - **Search by Excel File**: Batch load specific student IDs from `ids.xlsx` or any custom Excel file path.
- 🛡️ **ASP.NET WebForms PostBack Handling**: Wait strategies (`waitForLoadState('networkidle')`) to guarantee DOM updates finish before reading student data.
- 🔄 **Auto Recovery (`progress.json`)**: Real-time state persistence after every ID search. If interrupted or crashed, seamlessly resume right where you left off.
- 🤖 **Anti-Bot Avoidance**: Randomized search delays (500ms–1200ms) between requests to avoid detection.
- 📊 **Rich Excel Export**: Outputs `ID`, `Student Name`, `Faculty`, `Course Name`, `Committee`, `Hall`, and `Exam Location` to `results.xlsx`.
- 📸 **Automatic Error Screenshots & Logs**: Captures full-page error PNG screenshots into `./screenshots/` and logs operations in `./logs/app.log`.

---

## 📁 Project Architecture

```
university-exam-finder/
├── package.json              # Project dependencies & ES Module definition
├── config.json               # Configurable selectors, delays, URLs, and paths
├── .gitignore                # Excluded build artifacts & logs
├── README.md                 # Complete documentation
├── src/
│   ├── main.js               # Main entry point
│   ├── config/
│   │   └── index.js          # Dynamic configuration manager
│   ├── excel/
│   │   └── excelHandler.js   # ExcelJS read & append engine
│   ├── playwright/
│   │   └── scraperService.js # Playwright browser & form postback automation
│   ├── services/
│   │   └── runner.js         # Batch orchestrator with live terminal display
│   ├── utils/
│   │   ├── logger.js         # Error screenshot & disk logger
│   │   ├── delay.js          # Randomized timing generator
│   │   └── progress.js       # Auto-recovery state manager
│   └── cli/
│       ├── menu.js           # Main CLI menu
│       └── settingsMenu.js   # Interactive settings tweaking menu
```

---

## 🚀 Quick Start & Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/YOUR_USERNAME/university-exam-finder.git
cd university-exam-finder
npm install
npx playwright install chromium
```

### 2. Run the Application
```bash
npm start
```

---

## 💻 Usage Instructions

### Option 1: Search by Range
1. Run `npm start`.
2. Select **`1. Search by Range`**.
3. Input **Start ID** (e.g. `2300001`) and **End ID** (e.g. `2300500`).
4. The scraper will process each ID sequentially and append found students to `output/results.xlsx`.

### Option 2: Search by Excel File
1. Place an Excel file named `ids.xlsx` inside the project root (or choose a custom file path).
2. Ensure the first row contains a column titled **`ID`** (or `Student ID` / `كود الطالب`).
3. Add target student IDs in the column.
4. Select **`2. Search by Excel File`**.

### Option 3: Settings
Modify target website URL, randomized search delay intervals, headless mode, page timeouts, or output directories dynamically without modifying code.

---

## 📊 Sample Excel Output (`results.xlsx`)

| ID | Name | Faculty | Course Name | Committee | Hall | Location |
|---|---|---|---|---|---|---|
| 2300007 | Mahmoud Mohamed AbdelSattar | Faculty of Computers & IT | Operating Systems \| Pattern Recognition | 10:30 AM | 11:30 AM | Menoufia/floor00/CBT lab1 |
| 2300016 | Mohamed Abdelfattah Attia | Faculty of Computers & IT | Computer Graphics \| Digital Signal Processing | 10:30 AM | 11:30 AM | Alexandria/floor01/Room01 |

---

## ⚙️ Configuration (`config.json`)

```json
{
  "websiteUrl": "http://applications.eelu.edu.eg/certificates/Gourmet_exams.aspx",
  "inputSelector": "#txtIdentification",
  "submitSelector": "#btnSubmit",
  "searchDelay": {
    "min": 500,
    "max": 1200
  },
  "headless": false,
  "timeout": 30000,
  "maxRetries": 3,
  "outputFolder": "./output",
  "outputFile": "results.xlsx"
}
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
