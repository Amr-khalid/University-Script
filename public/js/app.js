// ==========================================================================
// UNIVERSITY EXAM FINDER - FRONTEND APPLICATION SCRIPT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  let uploadedExcelData = null;
  let statusPollInterval = null;
  let allResultsData = [];

  // Initialize App
  initThemeSwitcher();
  initTabs();
  initExcelDropZone();
  initSettings();
  initSearchControls();
  initResultsTable();
  startStatusPolling();

  // --------------------------------------------------
  // 0. THEME SWITCHER
  // --------------------------------------------------
  function initThemeSwitcher() {
    const themeSelect = document.getElementById('theme-selector');
    if (!themeSelect) return;

    const savedTheme = localStorage.getItem('user_theme') || 'dew';
    document.body.setAttribute('data-theme', savedTheme);
    themeSelect.value = savedTheme;

    themeSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      document.body.setAttribute('data-theme', selected);
      localStorage.setItem('user_theme', selected);
    });
  }

  // --------------------------------------------------
  // 1. TABS NAVIGATION
  // --------------------------------------------------
  function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.getAttribute('data-tab');

        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');

        if (tabName === 'results') {
          loadResultsTable();
        } else if (tabName === 'settings') {
          loadSettings();
        }
      });
    });
  }

  // --------------------------------------------------
  // 2. EXCEL DRAG & DROP UPLOAD
  // --------------------------------------------------
  function initExcelDropZone() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('excel-file-input');
    const fileInfoBar = document.getElementById('excel-file-info');
    const filenameEl = document.getElementById('uploaded-filename');
    const countEl = document.getElementById('uploaded-count');
    const removeBtn = document.getElementById('remove-file-btn');
    const previewContainer = document.getElementById('excel-preview-container');
    const chipsWrapper = document.getElementById('chips-wrapper');

    const searchModeRadios = document.querySelectorAll('input[name="searchMode"]');
    const excelArea = document.getElementById('mode-excel-area');
    const rangeArea = document.getElementById('mode-range-area');

    searchModeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.value === 'excel') {
          excelArea.classList.add('active');
          rangeArea.classList.remove('active');
        } else {
          rangeArea.classList.add('active');
          excelArea.classList.remove('active');
        }
      });
    });

    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleExcelUpload(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleExcelUpload(e.target.files[0]);
      }
    });

    removeBtn.addEventListener('click', () => {
      uploadedExcelData = null;
      fileInput.value = '';
      fileInfoBar.classList.add('hidden');
      previewContainer.classList.add('hidden');
      dropZone.classList.remove('hidden');
      chipsWrapper.innerHTML = '';
    });

    async function handleExcelUpload(file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('يرجى اختيار ملف صيغة Excel (.xlsx أو .xls) فقط.');
        return;
      }

      const formData = new FormData();
      formData.append('excelFile', file);

      dropZone.innerHTML = '<i class="fa-solid fa-spinner fa-spin drop-icon"></i><p class="drop-title">جاري قراءة الملف وتفسير الأكواد...</p>';

      try {
        const response = await fetch('/api/upload-excel', {
          method: 'POST',
          body: formData
        });
        const res = await response.json();

        if (res.success) {
          uploadedExcelData = res;
          filenameEl.textContent = res.filename;
          countEl.textContent = `${res.count} كود طالب`;

          dropZone.classList.add('hidden');
          fileInfoBar.classList.remove('hidden');

          // Render Chips preview
          chipsWrapper.innerHTML = '';
          const previewIds = res.ids.slice(0, 40);
          previewIds.forEach(id => {
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.textContent = id;
            chipsWrapper.appendChild(chip);
          });

          if (res.ids.length > 40) {
            const moreChip = document.createElement('span');
            moreChip.className = 'chip';
            moreChip.textContent = `+ ${res.ids.length - 40} أخرين...`;
            chipsWrapper.appendChild(moreChip);
          }

          previewContainer.classList.remove('hidden');
        } else {
          alert(`خطأ: ${res.error}`);
        }
      } catch (err) {
        alert(`فشل رفع الملف: ${err.message}`);
      } finally {
        dropZone.innerHTML = `
          <i class="fa-solid fa-cloud-arrow-up drop-icon"></i>
          <p class="drop-title">اسحب واسقط ملف Excel (.xlsx) هنا</p>
          <p class="drop-subtitle">أو انقر لاختيار ملف من جهازك</p>
        `;
      }
    }
  }

  // --------------------------------------------------
  // 3. SETTINGS & FIELD MAPPER
  // --------------------------------------------------
  function initSettings() {
    loadSettings();

    const saveBtn = document.getElementById('save-settings-btn');
    const testUrlBtn = document.getElementById('test-url-btn');

    saveBtn.addEventListener('click', async () => {
      const updatedConfig = {
        websiteUrl: document.getElementById('cfg-url').value.trim(),
        inputSelector: document.getElementById('cfg-input-selector').value.trim(),
        submitSelector: document.getElementById('cfg-submit-selector').value.trim(),
        headless: document.getElementById('cfg-headless').value === 'true',
        timeout: parseInt(document.getElementById('cfg-timeout').value) || 30000,
        searchDelay: {
          min: parseInt(document.getElementById('cfg-delay-min').value) || 500,
          max: parseInt(document.getElementById('cfg-delay-max').value) || 1200
        },
        outputFolder: document.getElementById('cfg-output-folder').value.trim(),
        outputFile: document.getElementById('cfg-output-file').value.trim(),
        selectors: {
          resultContainer: document.getElementById('cfg-field-grid').value.trim() || '#GridView1',
          fields: {
            studentName: document.getElementById('cfg-field-name').value.trim() || '#Label3',
            faculty: document.getElementById('cfg-field-faculty').value.trim() || '#Label4'
          }
        }
      };

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحفظ...';

      try {
        const response = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedConfig)
        });
        const res = await response.json();
        if (res.success) {
          alert('✓ تم حفظ كافة الإعدادات ومحددات الحقول بنجاح!');
        } else {
          alert(`فشل الحفظ: ${res.error}`);
        }
      } catch (err) {
        alert(`خطأ أثناء الحفظ: ${err.message}`);
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> حفظ كافة الإعدادات والمحددات';
      }
    });

    testUrlBtn.addEventListener('click', async () => {
      const url = document.getElementById('cfg-url').value.trim();
      const inputSel = document.getElementById('cfg-input-selector').value.trim();
      const resultBox = document.getElementById('test-url-result');

      if (!url) {
        alert('يرجى كتابة رابط الموقع أولاً.');
        return;
      }

      testUrlBtn.disabled = true;
      testUrlBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الاختبار...';
      resultBox.classList.add('hidden');

      try {
        const response = await fetch('/api/test-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, inputSelector: inputSel })
        });
        const res = await response.json();

        resultBox.classList.remove('hidden');
        if (res.success) {
          resultBox.className = 'alert alert-success';
          resultBox.innerHTML = `
            ✓ الاتصال بالموقع ناجح! (HTTP status: ${res.httpStatus}) <br>
            عنوان الصفحة: <strong>${res.pageTitle}</strong> <br>
            حالة حقل أدخال الكود (${inputSel}): <strong>${res.selectorFound ? 'موجود ومتوفر ✓' : 'لم يتم العثور عليه ⚠️'}</strong>
          `;
        } else {
          resultBox.className = 'alert alert-danger';
          resultBox.innerHTML = `✗ تعذر الوصول للموقع: ${res.error}`;
        }
      } catch (err) {
        resultBox.classList.remove('hidden');
        resultBox.className = 'alert alert-danger';
        resultBox.innerHTML = `✗ خطأ في الاختبار: ${err.message}`;
      } finally {
        testUrlBtn.disabled = false;
        testUrlBtn.innerHTML = '<i class="fa-solid fa-vial"></i> تجربة الرابط';
      }
    });
  }

  async function loadSettings() {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.success && data.config) {
        const cfg = data.config;
        document.getElementById('cfg-url').value = cfg.websiteUrl || '';
        document.getElementById('cfg-input-selector').value = cfg.inputSelector || '';
        document.getElementById('cfg-submit-selector').value = cfg.submitSelector || '';
        document.getElementById('cfg-headless').value = String(cfg.headless ?? false);
        document.getElementById('cfg-timeout').value = cfg.timeout || 30000;
        document.getElementById('cfg-delay-min').value = cfg.searchDelay?.min || 500;
        document.getElementById('cfg-delay-max').value = cfg.searchDelay?.max || 1200;
        document.getElementById('cfg-output-folder').value = cfg.outputFolder || './output';
        document.getElementById('cfg-output-file').value = cfg.outputFile || 'results.xlsx';

        if (cfg.selectors?.fields) {
          document.getElementById('cfg-field-name').value = cfg.selectors.fields.studentName || '#Label3';
          document.getElementById('cfg-field-faculty').value = cfg.selectors.fields.faculty || '#Label4';
        }
        if (cfg.selectors?.resultContainer) {
          document.getElementById('cfg-field-grid').value = cfg.selectors.resultContainer;
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  // --------------------------------------------------
  // 4. SEARCH CONTROLS & STATUS POLLING
  // --------------------------------------------------
  function initSearchControls() {
    const startBtn = document.getElementById('start-search-btn');
    const stopBtn = document.getElementById('stop-search-btn');
    const clearLogsBtn = document.getElementById('clear-logs-btn');

    startBtn.addEventListener('click', async () => {
      const selectedMode = document.querySelector('input[name="searchMode"]:checked').value;
      let payload = { searchType: selectedMode === 'excel' ? 'Excel' : 'Range' };

      if (selectedMode === 'excel') {
        if (!uploadedExcelData || !uploadedExcelData.ids || uploadedExcelData.ids.length === 0) {
          alert('يرجى رفع ملف Excel يحتوي على أرقام/أكواد الطلاب أولاً.');
          return;
        }
        payload.idsList = uploadedExcelData.ids;
      } else {
        const startId = document.getElementById('range-start-id').value.trim();
        const endId = document.getElementById('range-end-id').value.trim();

        if (!startId || !endId) {
          alert('يرجى إدخال كود البداية والنهاية لنطاق البحث.');
          return;
        }
        payload.startId = startId;
        payload.endId = endId;
      }

      startBtn.disabled = true;
      startBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري البدء...';

      try {
        const response = await fetch('/api/search/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const res = await response.json();

        if (res.success) {
          startBtn.classList.add('hidden');
          stopBtn.classList.remove('hidden');
        } else {
          alert(`تعذر البدء: ${res.error}`);
          startBtn.disabled = false;
          startBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> بدء الفحص الآن';
        }
      } catch (err) {
        alert(`خطأ: ${err.message}`);
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> بدء الفحص الآن';
      }
    });

    stopBtn.addEventListener('click', async () => {
      try {
        const response = await fetch('/api/search/stop', { method: 'POST' });
        const res = await response.json();
        if (res.success) {
          stopBtn.disabled = true;
          stopBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الإيقاف...';
        }
      } catch (err) {
        alert(`خطأ في الإيقاف: ${err.message}`);
      }
    });

    clearLogsBtn.addEventListener('click', () => {
      document.getElementById('console-logs').innerHTML = '';
    });
  }

  function startStatusPolling() {
    if (statusPollInterval) clearInterval(statusPollInterval);

    statusPollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/search/status');
        const data = await response.json();

        if (data.success && data.status) {
          updateUIWithStatus(data.status);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 1000);
  }

  function updateUIWithStatus(status) {
    const startBtn = document.getElementById('start-search-btn');
    const stopBtn = document.getElementById('stop-search-btn');
    const statusBadge = document.getElementById('status-badge');

    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressStepText = document.getElementById('progress-step-text');
    const currentIdDisplay = document.getElementById('current-id-display');

    const statTotal = document.getElementById('stat-total');
    const statFound = document.getElementById('stat-found');
    const statSkipped = document.getElementById('stat-skipped');
    const statTime = document.getElementById('stat-time');

    const latestCard = document.getElementById('latest-student-card');
    const latestName = document.getElementById('latest-student-name');
    const latestId = document.getElementById('latest-student-id');
    const latestFaculty = document.getElementById('latest-student-faculty');
    const latestCourse = document.getElementById('latest-student-course');
    const latestRoom = document.getElementById('latest-student-room');

    // UI Buttons Toggle
    if (status.isSearching) {
      startBtn.classList.add('hidden');
      stopBtn.classList.remove('hidden');
      stopBtn.disabled = false;
      stopBtn.innerHTML = '<i class="fa-solid fa-circle-pause"></i> إيقاف البحث مؤقتاً';
      statusBadge.className = 'badge badge-success';
      statusBadge.textContent = 'جاري الفحص المباشر ⚡';
    } else {
      startBtn.classList.remove('hidden');
      startBtn.disabled = false;
      startBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> بدء الفحص الآن';
      stopBtn.classList.add('hidden');

      if (status.status === 'completed') {
        statusBadge.className = 'badge badge-success';
        statusBadge.textContent = 'مكتمل بنجاح 🎉';
      } else if (status.status === 'paused') {
        statusBadge.className = 'badge badge-warning';
        statusBadge.textContent = 'متوقف مؤقتاً ⏸️';
      } else {
        statusBadge.className = 'badge badge-secondary';
        statusBadge.textContent = 'جاهز';
      }
    }

    // Counters
    statTotal.textContent = status.total || 0;
    statFound.textContent = status.foundCount || 0;
    statSkipped.textContent = status.skippedCount || 0;

    // Progress %
    const processed = (status.stepNum || 0);
    const total = (status.total || 0);
    const percent = total > 0 ? Math.round((processed / total) * 100) : 0;

    progressFill.style.width = `${percent}%`;
    progressPercentage.textContent = `${percent}%`;
    progressStepText.textContent = `${processed} / ${total}`;
    currentIdDisplay.textContent = status.currentId || '-';

    // Elapsed Time
    if (status.elapsedMs) {
      const sec = Math.floor((status.elapsedMs / 1000) % 60);
      const min = Math.floor((status.elapsedMs / (1000 * 60)) % 60);
      statTime.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }

    // Latest Student Found
    if (status.lastFoundStudent) {
      latestCard.classList.remove('hidden');
      latestName.textContent = status.lastFoundStudent.name || '-';
      latestId.textContent = `ID: ${status.lastFoundStudent.id || '-'}`;
      latestFaculty.textContent = status.lastFoundStudent.faculty || '-';
      
      const st = status.lastFoundStudent;
      latestCourse.innerHTML = formatCourseCardsHTML(st.course, st.committee, st.hall, st.location);
      latestRoom.innerHTML = ''; // Replaced by course card info tags
    }

    // Logs Rendering
    if (status.logs && status.logs.length > 0) {
      renderConsoleLogs(status.logs);
    }
  }

  function renderConsoleLogs(logs) {
    const consoleBox = document.getElementById('console-logs');
    consoleBox.innerHTML = '';
    logs.forEach(log => {
      const item = document.createElement('div');
      item.className = `log-item ${log.type || 'info'}`;
      item.innerHTML = `<span class="time">[${log.timestamp}]</span> <span class="msg">${log.message}</span>`;
      consoleBox.appendChild(item);
    });
    consoleBox.scrollTop = consoleBox.scrollHeight;
  }

  // Helper to split course/schedule by '|' and display as structured cards
  function formatCourseCardsHTML(courseStr, committeeStr = '', hallStr = '', locationStr = '') {
    if (!courseStr || courseStr === '-') {
      return '<span class="text-muted">-</span>';
    }

    const courses = courseStr.split('|').map(s => s.trim()).filter(Boolean);
    const committees = (committeeStr && committeeStr !== '-') ? committeeStr.split('|').map(s => s.trim()) : [];
    const halls = (hallStr && hallStr !== '-') ? hallStr.split('|').map(s => s.trim()) : [];
    const locations = (locationStr && locationStr !== '-') ? locationStr.split('|').map(s => s.trim()) : [];

    if (courses.length === 0) return `<span class="text-muted">${courseStr}</span>`;

    return `<div class="courses-container">` + courses.map((cName, idx) => {
      const comm = committees[idx] || (committees.length === 1 ? committees[0] : '');
      const hall = halls[idx] || (halls.length === 1 ? halls[0] : '');
      const loc = locations[idx] || (locations.length === 1 ? locations[0] : '');

      let tags = [];
      if (comm) tags.push(`<span class="pill-info-tag"><i class="fa-solid fa-users-rectangle"></i> لجنة: ${comm}</span>`);
      if (hall) tags.push(`<span class="pill-info-tag"><i class="fa-solid fa-door-open"></i> قاعة: ${hall}</span>`);
      if (loc) tags.push(`<span class="pill-info-tag"><i class="fa-solid fa-location-dot"></i> ${loc}</span>`);

      return `
        <div class="course-item-card">
          <div class="course-item-title"><i class="fa-solid fa-book-bookmark"></i> ${cName}</div>
          ${tags.length > 0 ? `<div class="course-sub-info">${tags.join('')}</div>` : ''}
        </div>
      `;
    }).join('') + `</div>`;
  }

  // --------------------------------------------------
  // 5. RESULTS TABLE VIEWER
  // --------------------------------------------------
  function initResultsTable() {
    const refreshBtn = document.getElementById('refresh-results-btn');
    const searchInput = document.getElementById('results-search-input');

    refreshBtn.addEventListener('click', () => loadResultsTable());

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = allResultsData.filter(row => {
        return (
          row.id.toLowerCase().includes(query) ||
          row.name.toLowerCase().includes(query) ||
          row.faculty.toLowerCase().includes(query) ||
          row.course.toLowerCase().includes(query)
        );
      });
      renderResultsTableRows(filtered);
    });
  }

  async function loadResultsTable() {
    const tbody = document.getElementById('results-tbody');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-muted"><i class="fa-solid fa-spinner fa-spin"></i> جاري تحميل النتائج من ملف Excel...</td></tr>';

    try {
      const response = await fetch('/api/results');
      const data = await response.json();

      if (data.success && Array.isArray(data.results)) {
        allResultsData = data.results;
        document.getElementById('results-rows-count').textContent = allResultsData.length;
        renderResultsTableRows(allResultsData);
      } else {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-warning">${data.message || 'لا توجد نتائج مسجلة حتى الآن.'}</td></tr>`;
      }
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center p-4 text-danger">فشل تحميل النتائج: ${err.message}</td></tr>`;
    }
  }

  function renderResultsTableRows(rows) {
    const tbody = document.getElementById('results-tbody');
    tbody.innerHTML = '';

    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center p-4 text-muted">لا توجد بيانات تطابق الفلتر المطلوب.</td></tr>';
      return;
    }

    rows.forEach((row, index) => {
      const tr = document.createElement('tr');
      const formattedCourses = formatCourseCardsHTML(row.course, row.committee, row.hall, row.location);

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td><span class="chip">${row.id}</span></td>
        <td><strong>${row.name}</strong></td>
        <td>${row.faculty || '-'}</td>
        <td colspan="4">${formattedCourses}</td>
      `;
      tbody.appendChild(tr);
    });
  }
});
