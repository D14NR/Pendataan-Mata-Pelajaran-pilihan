import React, { useState, useEffect } from 'react';
import { StudentForm } from './components/StudentForm';
import { FormData, Submission } from './types';
import { GraduationCap } from 'lucide-react';
import { Toaster } from 'sonner';

const App: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('school_submissions');
    if (saved) {
      try {
        setSubmissions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load submissions", e);
      }
    }
  }, []);

  // Save to localStorage whenever submissions change
  useEffect(() => {
    localStorage.setItem('school_submissions', JSON.stringify(submissions));
  }, [submissions]);

  const handleSubmit = (data: FormData) => {
    const newSubmission: Submission = {
      ...data,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    setSubmissions(prev => [newSubmission, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-700">
      <Toaster position="top-center" richColors expand={true} />
      
      {/* Dynamic Background Pattern */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-50/50 blur-[120px]" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[50%] rounded-full bg-indigo-50/40 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-200">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-slate-900 tracking-tight leading-none">EDU<span className="text-blue-600">FORM</span></span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">Academic Portal</span>
              </div>
            </div>
{/* Navigation links removed as requested */}
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <header className="mb-16 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Tahun Ajaran 2026/2027</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
            Pilih <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Masa Depanmu</span> Sekarang.
          </h1>
          <p className="text-lg text-slate-500 leading-relaxed max-w-2xl mx-auto">
            Pendataan mata pelajaran pilihan terintegrasi. Pastikan pilihanmu sesuai dengan minat dan rencana karirmu di masa depan.
          </p>
        </header>

        <div className="max-w-2xl mx-auto">
          {/* Form Container with subtle glassmorphism */}
          <div className="relative">
            {/* Decorative background element for the form */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-[2.5rem] -z-10 opacity-50 blur-sm" />
            <StudentForm onSubmit={handleSubmit} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-24 border-t border-slate-100 bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex justify-center mb-8">
             <div className="p-3 bg-slate-50 rounded-2xl">
              <GraduationCap className="w-10 h-10 text-slate-300" />
             </div>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Sistem Informasi Akademik Terpadu</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Platform resmi untuk pendataan mata pelajaran pilihan bagi siswa di seluruh jenjang pendidikan.
          </p>
          <div className="mt-8 pt-8 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs">
              &copy; {new Date().getFullYear()} EDUFORM Global. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Privacy Policy</a>
              <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
