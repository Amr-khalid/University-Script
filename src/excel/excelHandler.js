import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';

export class ExcelHandler {
  /**
   * Reads student IDs from an Excel file.
   * Finds column titled "ID" (case-insensitive) and collects non-empty rows.
   */
  static async readIdsFromExcel(filePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new Error('No worksheet found in Excel file.');
      }

      let idColIndex = -1;

      function getRawCellValue(cell) {
        if (!cell || cell.value === null || cell.value === undefined) return '';
        let val = cell.value;
        if (typeof val === 'object') {
          if (val.result !== undefined && val.result !== null) {
            val = val.result;
          } else if (val.text !== undefined && val.text !== null) {
            val = val.text;
          } else if (val.richText && Array.isArray(val.richText)) {
            val = val.richText.map(r => r.text).join('');
          } else {
            val = JSON.stringify(val);
          }
        }
        return String(val).trim();
      }

      // Find "ID" column index in row 1 (supports Arabic & English headers)
      const firstRow = worksheet.getRow(1);
      firstRow.eachCell((cell, colNumber) => {
        const value = getRawCellValue(cell).toUpperCase();
        if (
          value === 'ID' ||
          value === 'STUDENT ID' ||
          value === 'STUDENTID' ||
          value.includes('كود') ||
          value.includes('رقم') ||
          value.includes('الجامعي')
        ) {
          idColIndex = colNumber;
        }
      });

      if (idColIndex === -1) {
        // Default to column 1 if header not explicitly named ID
        idColIndex = 1;
      }

      const ids = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        const cell = row.getCell(idColIndex);
        const cellValue = getRawCellValue(cell);
        if (cellValue !== '' && cellValue !== '[object Object]') {
          ids.push(cellValue);
        }
      });

      return ids;
    } catch (error) {
      throw new Error(`Failed to read Excel file (${filePath}): ${error.message}`);
    }
  }

  /**
   * Appends a single student result to Excel, ensuring headers exist and no records are lost.
   */
  static async appendResult(filePath, studentData) {
    await this.saveAllResults(filePath, [studentData], true);
  }

  /**
   * Saves a list of student records to results.xlsx.
   * If isAppend is true, existing rows are preserved and new rows added.
   */
  static async saveAllResults(filePath, studentList, isAppend = true) {
    if (!studentList || studentList.length === 0) return;

    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    const workbook = new ExcelJS.Workbook();
    let worksheet;

    if (isAppend) {
      try {
        await workbook.xlsx.readFile(filePath);
        worksheet = workbook.getWorksheet('Results') || workbook.worksheets[0];
      } catch {
        worksheet = null;
      }
    }

    if (!worksheet) {
      worksheet = workbook.addWorksheet('Results');
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 18 },
        { header: 'Name', key: 'name', width: 35 },
        { header: 'Faculty', key: 'faculty', width: 40 },
        { header: 'Course Name', key: 'course', width: 45 },
        { header: 'Committee', key: 'committee', width: 25 },
        { header: 'Hall', key: 'hall', width: 25 },
        { header: 'Location', key: 'location', width: 45 }
      ];

      // Format header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1F4E79' }
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    // Existing IDs to prevent duplicates
    const existingIds = new Set();
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const cellVal = row.getCell(1).value;
      if (cellVal) existingIds.add(String(cellVal).trim());
    });

    for (const student of studentList) {
      const studentId = String(student.id || '').trim();
      // Append if not already present in the spreadsheet
      if (!existingIds.has(studentId)) {
        worksheet.addRow([
          studentId,
          student.name || '',
          student.faculty || '',
          student.course || '',
          student.committee || '',
          student.hall || '',
          student.location || ''
        ]);
        existingIds.add(studentId);
      }
    }

    // Try saving workbook with retry if file is temporarily busy
    let retries = 3;
    while (retries > 0) {
      try {
        await workbook.xlsx.writeFile(filePath);
        break;
      } catch (err) {
        retries--;
        if (retries === 0) {
          throw new Error(`Could not write to Excel file ${filePath}: ${err.message}. Make sure the file is closed in Excel!`);
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  /**
   * Helper to generate sample ids.xlsx file if requested
   */
  static async createSampleInputFile(filePath) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('IDs');
    worksheet.columns = [{ header: 'ID', key: 'id', width: 15 }];
    worksheet.addRow({ id: '2300501' });
    worksheet.addRow({ id: '2300502' });
    worksheet.addRow({ id: '2300503' });

    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await workbook.xlsx.writeFile(filePath);
  }
}
