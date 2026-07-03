export type Jenjang = 
  | '3 SMA' | '2 SMA' | '1 SMA'
  | '3 SMP' | '2 SMP' | '1 SMP'
  | '6 SD' | '5 SD' | '4 SD';

export interface StudentData {
  nama: string;
  asal_sekolah: string;
  jenjang_studi: string;
}

export interface FormData {
  namaSiswa: string;
  asalSekolah: string;
  jenjang: Jenjang;
  mataPelajaran: string[];
  fokusKBM?: 'SNBP' | 'SNBT';
}

export interface Submission extends FormData {
  id: string;
  timestamp: string;
}
