import Papa from 'papaparse';
import { StudentData } from '../types';

const SOURCE_SHEET_ID = '1rwUhUgf60n1Wm6IVGcSlS0O4j1n2gELZugaxyO57vYE';
const SOURCE_SHEET_NAME = 'DATA';
const SOURCE_CSV_URL = `https://docs.google.com/spreadsheets/d/${SOURCE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SOURCE_SHEET_NAME}`;

const DEST_SHEET_ID = '1MSe58AfbGzO69k-nM9lzUEMBx093rnZxynTW2RDwudc';
const DEST_SHEET_NAME = 'data';
const DEST_CSV_URL = `https://docs.google.com/spreadsheets/d/${DEST_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${DEST_SHEET_NAME}`;

export const fetchStudentData = async (): Promise<StudentData[]> => {
  try {
    const response = await fetch(SOURCE_CSV_URL);
    if (!response.ok) throw new Error('Failed to fetch source data');
    
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data.map((row: any) => {
            return {
              nama: row['nama'] || row['Nama'] || row['NAMA'] || '',
              asal_sekolah: row['asal_sekolah'] || row['Asal Sekolah'] || row['asal sekolah'] || row['ASAL_SEKOLAH'] || '',
              jenjang_studi: row['jenjang_studi'] || row['Jenjang Studi'] || row['jenjang studi'] || row['JENJANG_STUDI'] || ''
            };
          }).filter(row => row.nama && row.nama.trim() !== '');
          
          resolve(data as StudentData[]);
        },
        error: (error: any) => reject(error)
      });
    });
  } catch (error) {
    console.error('Error fetching source data:', error);
    return [];
  }
};

export const fetchSubmittedNames = async (): Promise<string[]> => {
  try {
    // We add a cache buster to ensure we get the latest submissions
    const response = await fetch(`${DEST_CSV_URL}&t=${new Date().getTime()}`);
    if (!response.ok) return [];
    
    const csvText = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const names = results.data
            .map((row: any) => (row['Nama Siswa'] || row['nama_siswa'] || row['Nama'] || '').trim())
            .filter(name => name !== '');
          resolve(names);
        },
        error: () => resolve([])
      });
    });
  } catch (error) {
    console.error('Error fetching submitted names:', error);
    return [];
  }
};
