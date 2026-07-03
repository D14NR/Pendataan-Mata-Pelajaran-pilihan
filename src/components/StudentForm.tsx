import React, { useState, useMemo, useEffect } from 'react';
import Select, { SingleValue } from 'react-select';
import { Jenjang, FormData, StudentData } from '../types';
import { BookOpen, School, User, GraduationCap, CheckCircle2, Loader2, Target } from 'lucide-react';
import { fetchStudentData, fetchSubmittedNames } from '../utils/googleSheets';
import { saveToGoogleSheets } from '../services/googleSheetsSubmit';
import { toast } from 'sonner';

const JENJANG_OPTIONS: Jenjang[] = [
  '3 SMA', '2 SMA', '1 SMA',
  '3 SMP', '2 SMP', '1 SMP',
  '6 SD', '5 SD', '4 SD'
];

const MATA_PELAJARAN_MAP: Record<string, string[]> = {
  'SD': ['Matematika', 'IPA', 'Bahasa Inggris', 'Bahasa Indonesia'],
  'SMP': ['Matematika', 'IPA (Fisika/Biologi)', 'IPS', 'Bahasa Inggris', 'Bahasa Indonesia'],
  'SMA': [
    'MATEMATIKA TINGKAT LANJUT',
    'FISIKA',
    'KIMIA',
    'BIOLOGI',
    'EKONOMI',
    'SOSIOLOGI',
    'GEOGRAFI',
    'SEJARAH',
    'BAHASA INDONESIA TINGKAT LANJUT',
    'BAHASA INGGRIS TINGKAT LANJUT',
    'ANTROPOLOGI',
    'PENDIDIKAN PANCASILA & KEWARGANEGARAAN'
  ]
};

interface StudentFormProps {
  onSubmit: (data: FormData) => void;
}

interface OptionType {
  value: string;
  label: string;
  student: StudentData;
}

export const StudentForm: React.FC<StudentFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<FormData>({
    namaSiswa: '',
    asalSekolah: '',
    jenjang: '' as any,
    mataPelajaran: []
  });

  const [students, setStudents] = useState<StudentData[]>([]);
  const [submittedNames, setSubmittedNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allStudents, alreadySubmitted] = await Promise.all([
        fetchStudentData(),
        fetchSubmittedNames()
      ]);
      setStudents(allStudents);
      setSubmittedNames(alreadySubmitted);
    } catch (err) {
      console.error("Error loading student data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const studentOptions: OptionType[] = useMemo(() => {
    return students.map(s => {
      const isAlreadySubmitted = submittedNames.includes(s.nama.trim());
      return {
        value: s.nama,
        label: isAlreadySubmitted ? `${s.nama} (SUDAH MENGISI)` : s.nama,
        student: s,
        isDisabled: isAlreadySubmitted
      };
    });
  }, [students, submittedNames]);

  const handleStudentChange = (newValue: SingleValue<OptionType>) => {
    if (newValue) {
      const { student } = newValue;
      
      // Map spreadsheet jenjang to our internal Jenjang type if needed
      let detectedJenjang = student.jenjang_studi as Jenjang;
      if (!JENJANG_OPTIONS.includes(detectedJenjang)) {
          // Fallback if not exact match (could add more complex mapping logic here)
          detectedJenjang = '3 SMA';
      }

      setFormData({
        ...formData,
        namaSiswa: student.nama,
        asalSekolah: student.asal_sekolah,
        jenjang: detectedJenjang,
        mataPelajaran: [], // Reset subjects when student changes
        fokusKBM: detectedJenjang === '3 SMA' ? 'SNBP' : undefined
      });
    } else {
        setFormData({
            ...formData,
            namaSiswa: '',
            asalSekolah: '',
            jenjang: '' as any,
            mataPelajaran: [],
            fokusKBM: undefined
        });
    }
  };

  const getAvailableSubjects = useMemo(() => {
    if (!formData.jenjang) return [];
    if (formData.jenjang.includes('SD')) return MATA_PELAJARAN_MAP['SD'];
    if (formData.jenjang.includes('SMP')) return MATA_PELAJARAN_MAP['SMP'];
    if (formData.jenjang.includes('SMA')) return MATA_PELAJARAN_MAP['SMA'];
    return [];
  }, [formData.jenjang]);

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => {
      const exists = prev.mataPelajaran.includes(subject);
      if (exists) {
        return { ...prev, mataPelajaran: prev.mataPelajaran.filter(s => s !== subject) };
      } else {
        return { ...prev, mataPelajaran: [...prev.mataPelajaran, subject] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const is3SMA = formData.jenjang === '3 SMA';
    const hasFokusKBM = !is3SMA || (is3SMA && formData.fokusKBM);

    if (!formData.namaSiswa || !formData.asalSekolah || formData.mataPelajaran.length === 0 || !hasFokusKBM) {
      toast.error('Gagal', {
        description: 'Mohon lengkapi semua data pendaftaran.',
        duration: 4000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Final check before sending to ensure no race conditions
      const latestSubmissions = await fetchSubmittedNames();
      if (latestSubmissions.includes(formData.namaSiswa.trim())) {
        toast.warning('Akses Ditolak', {
          description: 'Maaf, siswa ini baru saja terdeteksi sudah mengisi formulir.',
          duration: 5000,
        });
        setSubmittedNames(latestSubmissions);
        setIsSubmitting(false);
        return;
      }

      const success = await saveToGoogleSheets(formData);
      if (success) {
        onSubmit(formData);
        setSubmitted(true);
        toast.success('Berhasil!', {
          description: 'Data pendaftaran Anda telah berhasil disimpan.',
          duration: 3000,
        });
        // Refresh local list
        loadData();
        setTimeout(() => {
            setSubmitted(false);
            setFormData({
                namaSiswa: '',
                asalSekolah: '',
                jenjang: '' as any,
                mataPelajaran: [],
                fokusKBM: undefined
            });
        }, 3000);
      } else {
        toast.error('Kesalahan', {
          description: 'Gagal menyimpan data ke Google Sheets. Silakan coba lagi.',
        });
      }
    } catch (error) {
      console.error(error);
      toast.error('Error', {
        description: 'Terjadi kesalahan sistem saat mengirim data.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white p-10 rounded-[2rem] shadow-2xl shadow-blue-100/50 border border-green-100 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20" />
          <CheckCircle2 className="w-14 h-14 text-green-500 relative z-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3">Pendaftaran Berhasil!</h2>
        <p className="text-slate-500 leading-relaxed max-w-sm">
          Terima kasih <span className="font-bold text-blue-600">{formData.namaSiswa}</span>, data pilihan mata pelajaran Anda telah aman tersimpan di sistem kami.
        </p>
        <div className="mt-8 pt-8 border-t border-slate-50 w-full flex justify-center">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Akan kembali ke formulir sebentar lagi...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-10 rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-100 space-y-8 relative overflow-hidden">
      {/* Decorative inner gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-10 opacity-50" />
      
      <div className="space-y-8">
        {/* Section: Identitas */}
        <div className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Identitas Siswa</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-5">
                <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest ml-1">
                        Nama Lengkap Siswa
                    </label>
                    <Select
                        options={studentOptions}
                        isLoading={loading}
                        placeholder={loading ? "Memuat database..." : "Cari nama lengkap..."}
                        onChange={handleStudentChange}
                        isClearable
                        classNamePrefix="react-select"
                        value={studentOptions.find(o => o.value === formData.namaSiswa) || null}
                        loadingMessage={() => (
                            <div className="flex items-center gap-2 justify-center py-2">
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                <span className="text-xs font-medium">Sinkronisasi data...</span>
                            </div>
                        )}
                        noOptionsMessage={() => "Nama tidak ditemukan di database"}
                        styles={{
                            control: (base, state) => ({
                                ...base,
                                borderRadius: '1rem',
                                padding: '6px 8px',
                                border: state.isFocused ? '2px solid #3b82f6' : '2px solid #f1f5f9',
                                backgroundColor: '#f8fafc',
                                boxShadow: 'none',
                                '&:hover': { borderColor: '#e2e8f0' }
                            }),
                            option: (base, state) => ({
                                ...base,
                                backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
                                color: state.isSelected ? 'white' : state.isDisabled ? '#cbd5e1' : '#334155',
                                padding: '12px 16px',
                                fontSize: '0.875rem',
                                fontWeight: state.isSelected ? 'bold' : '500',
                                cursor: state.isDisabled ? 'not-allowed' : 'pointer'
                            }),
                            singleValue: (base) => ({
                                ...base,
                                fontWeight: 'bold',
                                color: '#1e293b'
                            })
                        }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest ml-1">
                            Asal Sekolah
                        </label>
                        <div className="relative group">
                            <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                readOnly
                                className="w-full pl-11 pr-4 py-3.5 border-2 border-slate-50 rounded-2xl bg-slate-50 text-slate-600 font-bold text-sm outline-none transition-all focus:border-blue-500/20"
                                placeholder="Pilih nama dahulu"
                                value={formData.asalSekolah}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest ml-1">
                            Jenjang Studi
                        </label>
                        <div className="relative group">
                            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                readOnly
                                className="w-full pl-11 pr-4 py-3.5 border-2 border-slate-50 rounded-2xl bg-slate-50 text-slate-600 font-bold text-sm outline-none transition-all focus:border-blue-500/20"
                                placeholder="Pilih nama dahulu"
                                value={formData.jenjang}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Section: Akademik */}
        {formData.jenjang && (
            <div className="space-y-6 pt-6 border-t border-slate-50 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Rencana Studi</h3>
                </div>

                {formData.jenjang === '3 SMA' && (
                    <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100 space-y-4">
                        <label className="block text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                            <Target className="w-4 h-4" /> Fokus KBM Semester 1
                        </label>
                        <div className="flex gap-4">
                            {['SNBP', 'SNBT'].map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, fokusKBM: option as 'SNBP' | 'SNBT' })}
                                    className={`flex-1 py-4 px-6 rounded-2xl border-2 transition-all font-black flex items-center justify-center gap-3 ${
                                        formData.fokusKBM === option
                                            ? 'border-orange-500 bg-white text-orange-600 shadow-md shadow-orange-100'
                                            : 'border-transparent bg-white/50 text-slate-400 hover:bg-white'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.fokusKBM === option ? 'border-orange-500 scale-110' : 'border-slate-200'}`}>
                                        {formData.fokusKBM === option && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" />}
                                    </div>
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                            Pilih Mata Pelajaran Pilihan
                        </label>
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            {formData.mataPelajaran.length} Terpilih
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {getAvailableSubjects.map(subject => (
                            <button
                                key={subject}
                                type="button"
                                onClick={() => handleSubjectToggle(subject)}
                                className={`text-left px-5 py-4 rounded-2xl border-2 text-xs font-bold transition-all flex items-center justify-between group ${
                                    formData.mataPelajaran.includes(subject)
                                        ? 'border-blue-500 bg-blue-50/30 text-blue-700'
                                        : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-700'
                                }`}
                            >
                                <span className="max-w-[85%] leading-tight">{subject}</span>
                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                                    formData.mataPelajaran.includes(subject)
                                        ? 'bg-blue-600 text-white scale-110'
                                        : 'bg-white text-transparent border border-slate-200 group-hover:border-blue-300'
                                }`}>
                                    <CheckCircle2 className="w-3 h-3" />
                                </div>
                            </button>
                        ))}
                    </div>
                    {formData.mataPelajaran.length === 0 && (
                        <p className="mt-2 text-[10px] text-amber-600 font-bold uppercase tracking-wider bg-amber-50 py-2 px-4 rounded-lg inline-block">
                            * Mohon pilih minimal satu mata pelajaran
                        </p>
                    )}
                </div>
            </div>
        )}
      </div>

      <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !formData.namaSiswa}
            className={`w-full py-5 text-white text-base font-black rounded-[1.5rem] shadow-2xl transition-all transform flex items-center justify-center gap-3 relative overflow-hidden group ${
              isSubmitting || !formData.namaSiswa
                ? 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-200 hover:-translate-y-1 active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>MEMPROSES DATA...</span>
              </>
            ) : (
              <>
                <span>SIMPAN PENDAFTARAN</span>
                <Target className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-slate-400 font-medium mt-4 uppercase tracking-[0.1em]">
            Data akan disimpan secara aman di Cloud Database kami.
          </p>
      </div>
    </form>
  );
};
