import { FormData } from '../types';

/**
 * PENTING: Untuk menyimpan data ke Google Sheets, Anda perlu melakukan langkah-langkah berikut:
 * 
 * 1. Buka Spreadsheet: https://docs.google.com/spreadsheets/d/1MSe58AfbGzO69k-nM9lzUEMBx093rnZxynTW2RDwudc/edit
 * 2. Pergi ke Extensions > Apps Script.
 * 3. Hapus kode yang ada dan tempelkan kode Apps Script di bawah ini.
 * 4. Klik "Deploy" > "New Deployment".
 * 5. Pilih Type: "Web App".
 * 6. Set "Who has access" ke "Anyone".
 * 7. Copy URL Web App yang dihasilkan dan ganti WEB_APP_URL di bawah ini.
 */

/* 
--- KODE APPS SCRIPT (Copy ini ke Google Apps Script) ---

function doPost(e) {
  var sheetName = 'data';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['Timestamp', 'Nama Siswa', 'Asal Sekolah', 'Jenjang', 'Fokus KBM', 'Mata Pelajaran']);
  }
  
  var data = JSON.parse(e.postData.contents);
  
  sheet.appendRow([
    new Date(),
    data.namaSiswa,
    data.asalSekolah,
    data.jenjang,
    data.fokusKBM || '-',
    data.mataPelajaran.join(', ')
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput("Method GET tidak didukung. Gunakan POST.");
}

-------------------------------------------------------
*/

// URL Deployment Google Apps Script
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyPvwl8bQPWpNQp5SC0d-QiRWeTYzRnzRL-EEn30jVYbqyKwSGx6XA1b031Xr4Yb8WW4A/exec'; 

export const saveToGoogleSheets = async (formData: FormData): Promise<boolean> => {
  try {

    await fetch(WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    return true;
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return false;
  }
};
