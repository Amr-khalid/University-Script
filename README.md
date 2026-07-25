# 🎓 University Exam & Student Data Finder (نظام استخراج بيانات ومواعيد امتحانات الطلاب)

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green?logo=node.js)](https://nodejs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-v1.45-blue?logo=playwright)](https://playwright.dev/)
[![Express](https://img.shields.io/badge/Express-v4.21-000000?logo=express)](https://expressjs.com/)
[![ExcelJS](https://img.shields.io/badge/ExcelJS-v4.4-brightgreen)](https://github.com/exceljs/exceljs)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Theme Support](https://img.shields.io/badge/Themes-8%20Palettes-violet)](#-8-dynamic-aesthetic-themes-منظومة-الثيمات-التفاعلية)

نظام أتمتة وتنقيب شامل ومستقل لاستخراج بيانات الطلاب ومواعيد اللجان والقاعات والمواد من البوابات الإلكترونية للجامعات (ASP.NET WebForms). يأتي النظام مجهّزاً بـ **لوحة تحكم جرافيكية عبر المتصفح (Web UI Dashboard)** إضافة إلى **واجهة أوامر تفاعلية (CLI)**، مع دعم رفع ملفات Excel بالسحب والإفلات، وإدارة إعدادات ومحددات الحقول ورابط الموقع ديناميكياً بدون تعديل كود.

---

## 📸 معاينة النظام والخصائص الرئيسية (Overview & Features)

### 🌟 أبرز الخصائص والوظائف:

- 🌐 **لوحة تحكم تفاعلية عبر المتصفح (Web UI Dashboard)**:
  - واجهة أصلية أحادية الصفحة (SPA) سريعة للغاية بدعم كامل للغة العربية والـ RTL.
  - متابعة حية ومباشرة لنسبة الانجاز (Progress Bar)، والوقت المستغرق، وإحصائيات الطلاب (الإجمالي، المكتشفين، غير الموجودين).
  - شاشة سجل عمليات فورية (Live Console Output) لخطوات الفحص لحظة بلحظة.
  - بطاقة استخراج فورية تظهر بيانات آخر طالب تم الوصول لجدول امتحاناته.

- 🎨 **منظومة ثيمات يابانية تفاعلية (8 Themes System)**:
  - دعم التبديل الفوري بنقرة واحدة بين **4 سمات داكنة** و **4 سمات فاتحة** مع حفظ الاختيار تلقائياً في المتصفح.

- 📂 **رفع ملفات Excel بالسحب والإفلات (Drag & Drop)**:
  - إمكانية سحب ملف `.xlsx` وإسقاطه في الواجهة لقراءة أكواد الطلاب فوراً.
  - معاينة قائمة الأكواد على هيئة بطاقات تفاعلية (Chips) قبل بدء الفحص.

- ⚙️ **مُحرر ومُخطط محددات الحقول ورابط الموقع (Settings & Field Selectors Mapper)**:
  - امكانية تعديل **رابط الموقع (Website URL)** بسهولة إذا تم تغيير دومين الجامعة.
  - تعديل **محدد مربع النص (Input Selector)** ومحدد **زر البحث (Submit Selector)**.
  - تعديل محددات استخراج البيانات (اسم الطالب، الكلية، الجدول).
  - ميزة **اختبار الاتصال (URL Tester)** للتحقق من وصول المتصفح وتواجد الحقل قبل العمل.

- 📚 **فصل وتقسيم جدول المواد والامتحانات (Smart Course Schedule Card Splitting)**:
  - التعرف التلقائي على الأكواد والمواد المدمجة بفاصل `|` وتفكيكها إلى بطاقات امتحانات مستقلة (Course Cards) تعرض اسم المادة، رقم اللجنة، رقم القاعة، والموقع بشكل منظم جداً.

- 🤖 **محركPlaywright وأتمتة الـ ASP.NET PostBack**:
  - التعامل الذكي مع إعادة التحميل الإجبارية لصفحات ASP.NET (`networkidle`).
  - آليات حماية وتأخير عشوائي (Anti-Bot Delays) تتراوح بين `500ms` و `1200ms` بين الطلبات لتفادي الحظر.

- 🔄 **استعادة الاستئناف التلقائي (`progress.json`)**:
  - حفظ تلقائي فوري بعد كل طالب. في حال انقطاع النت أو توقف الجهاز، يمكنك استكمال الفحص من حيث توقفت.

- 📊 **جدول نتائج تفاعلي وتصدير لملفات Excel**:
  - جدول مدمج في الواجهة مع ميزة البحث والفلترة الفورية باسم الطالب أو الكود أو الكلية.
  - تنزيل ملف النتائج النهائي `results.xlsx` بضغطة زر واحدة.

---

## 🎨 8 Dynamic Aesthetic Themes (منظومة الثيمات التفاعلية)

يحتوي النظام على 8 ثيمات بصرية مصممة بعناية فائقة مستوحاة من لوحات ألوان يابانية:

### 🌙 السمات الداكنة (Dark Themes)
1. 🌿 **朝露のフィルム (Morning Dew - Pine & Moss)**: خلفية صنوبرية داكنة مع لمسات الطين الصباحي والأخضر الضبابي.
2. 🍷 **黒鍵の祈り (Blood Wine - Gothic Noir)**: خلفية جرافيت سوداء مع لمسات العنابي والنبيذي الملكي.
3. ❄️ **蒼闇に沈む森 (Winter Navy - Frost Sky)**: خلفية كحلية شتوية داكنة مع درجات الأزرق الجليدي.
4. 🔮 **深紫の夢路 (Violet Nightfall - Lilac Mist)**: خلفية بنفسجية داكنة مع لمسات اللافندر الحبري.

### ☀️ السمات الفاتحة العصرية (Light Themes)
5. ☀️ **الأبيض الناصع (Snow Minimalist)**: تصميم ناصع البياض حاد التباين مريح جداً للعمل النهاري.
6. 🌸 **زهر الكرز (Sakura Blossom)**: تصميم كريمي وردي هادئ مستوحى من أشجار الكرز اليابانية.
7. 🌊 **نسيم المحيط (Ocean Breeze)**: تصميم سماوي جليدي ناعم بألوان المحيط والتركواز.
8. 🍵 **ماتشا كريم (Matcha Cream)**: تصميم عشبي هادئ بألوان شاي الماتشا والزيتوني الدافئ.

---

## 📁 هيكلية المشروع (Project Architecture)

```
university-exam-finder/
├── package.json              # ES Modules definition & project dependencies
├── config.json               # Configuration settings & CSS selectors mapping
├── .gitignore                # Excluded build files & logs
├── README.md                 # Complete system documentation
├── make_commits.js           # Git automation utility
├── public/                   # Web Dashboard Frontend (Single Page Application)
│   ├── index.html            # SPA Structural HTML5 with RTL & Tabbed layout
│   ├── css/
│   │   └── style.css         # 8-Theme Japanese Aesthetic Design System
│   └── js/
│       └── app.js            # Client-side state, Drag-Drop Excel, polling & filtering
├── src/
│   ├── main.js               # CLI Application entry point
│   ├── config/
│   │   └── index.js          # Dynamic configuration reader & persistent writer
│   ├── excel/
│   │   └── excelHandler.js   # ExcelJS reader and append engine
│   ├── playwright/
│   │   └── scraperService.js # Chromium automation & DOM PostBack scraping
│   ├── server/
│   │   └── index.js          # Express REST Web API & static server
│   ├── services/
│   │   └── runner.js         # Core batch runner orchestrator with event emitters
│   ├── utils/
│   │   ├── logger.js         # Error screenshot capturer & file logger
│   │   ├── delay.js          # Anti-bot randomized delay generator
│   │   └── progress.js       # Auto-recovery state saver & reader
│   └── cli/
│       ├── menu.js           # CLI main menu
│       └── settingsMenu.js   # CLI interactive settings menu
```

---

## 🚀 التثبيت والتشغيل (Installation & Quick Start)

### 1. متطلبات التشغيل
- **Node.js**: الإصدار `v18.0.0` أو أحدث.
- **Git**: لتنزيل المشروع.

### 2. تنزيل المشروع وتثبيت الحزم
```bash
# clone repository
git clone https://github.com/Amr-khalid/University-Script.git
cd University-Script

# install dependencies
npm install

# install Playwright browser binaries
npx playwright install chromium
```

---

## 💻 طريقة الاستخدام بالتفصيل (Detailed Usage Guide)

### 🌟 الخيار الأول: تشغيل لوحة التحكم عبر المتصفح (Web UI Dashboard) [موصى به]

لتشغيل السيرفر المحلي وفتح الواجهة الجرافيكية مباشرة:
```bash
npm run web
```
ثم قم بفتح الرابط التالي في متصفحك:
👉 **`http://localhost:3000`**

#### 📋 خطوات البحث من الواجهة:
1. **طريقة رفع ملف Excel**:
   - اسحب ملف Excel (`.xlsx`) واسقطه في مربع الرفع، أو انقر لاختيار الملف.
   - سيقوم النظام بقراءة الأكواد وعرض معاينة تفاعلية لكافة الأكواد المكتشفة.
   - انقر على **`بدء الفحص الآن 🚀`**.
2. **طريقة البحث بالنطاق (Range)**:
   - اختر تبويب **`بحث بالنطاق`**.
   - أدخل كود البداية (مثال: `2300501`) وكود النهاية (مثال: `2300550`).
   - انقر على **`بدء الفحص الآن 🚀`**.
3. **تخصيص الموقع والحقول**:
   - انتقل إلى تبويب **`إعدادات الموقع والحقول`**.
   - يمكنك تعديل رابط الموقع، ومحدد حقل الكود، وزر الاستعلام، والضغط على **`حفظ الإعدادات 💾`**.

---

### 💻 الخيار الثاني: تشغيل واجهة الأوامر النصية (CLI Mode)

إذا كنت تفضل العمل من خلال موجه الأوامر (Terminal):
```bash
npm start
```
ستظهر لك القائمة التفاعلية التالية:
1. **Search by Range**: للبحث عن نطاق أرقام جامعية محدد.
2. **Search by Excel File**: لقراءة الأكواد من ملف `ids.xlsx` في المجلد الرئيسي أو اختيار مسار ملف آخر.
3. **Launch Web Dashboard UI**: لتشغيل سيرفر الواجهة الجرافيكية وفتح المتصفح تلقائياً.
4. **Settings**: لتعديل الإعدادات من الـ CLI.
5. **Exit**: للخروج.

---

## 📊 هيكلية ملف النتائج النهائي (`results.xlsx`)

يتم حفظ وتحديث نتائج الفحص تلقائياً وبشكل فوري داخل مجلد `./output/results.xlsx`:

| ID | Name | Faculty | Course Name | Committee | Hall | Location |
|---|---|---|---|---|---|---|
| 2300501 | أحمد محمد علي | كلية الحاسبات والمعلومات | Information Computer Networks Security Midterm-PBT | Room01 | 1 | المبنى الرئيسي/الدور الأول |
| 2300502 | سارة محمود حسن | كلية الذكاء الاصطناعي | Artificial Intelligence-Old and New Midterm CBT | lab1 | 3 | المعمل المركزي |

---

## ⚙️ ملف التكوين (`config.json`)

يحتوي ملف `config.json` على كافة المحددات والإعدادات التي يمكن تعديلها من الواجهة أو يدوياً:

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
  "outputFile": "results.xlsx",
  "inputExcelFile": "ids.xlsx",
  "selectors": {
    "resultContainer": "#GridView1",
    "notFoundText": ["Not Found", "غير موجود", "لا يوجد بيانات", "No data found"],
    "fields": {
      "studentId": "#txtIdentification",
      "studentName": "#Label3",
      "faculty": "#Label4"
    }
  }
}
```

---

## 🛠️ حل المشكلات الشائعة (Troubleshooting & FAQ)

#### 1. المتصفح لا يفتح أو هناك خطأ في Playwright؟
قم بتشغيل الأمر التالي لتأكيد تنزيل متصفح Chromium:
```bash
npx playwright install chromium
```

#### 2. ملف النتائج مفتوح في برامج مثل Excel ويعطي خطأ كتابة؟
تأكد من إغلاق ملف `output/results.xlsx` في برنامج Excel أثناء تشغيل عملية الفحص، حيث يقوم النظام بحفظ وتحديث البيانات فورياً.

#### 3. تغير رابط موقع امتحانات الجامعة أو أسماء الحقول؟
لا داعي لتعديل الكود! افتح الواجهة الجرافيكية وانتقل لتبويب **`إعدادات الموقع والحقول`** وقم بتحديث الرابط أو الـ Selectors واضغط **`حفظ`**.

---

## 📄 الترخيص (License)

هذا المشروع مرخص بموجب رخصة **[MIT License](LICENSE)**.
