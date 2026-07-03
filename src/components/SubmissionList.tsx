import React from 'react';
import { Submission } from '../types';
import { Trash2, Calendar, ClipboardList } from 'lucide-react';

interface SubmissionListProps {
  submissions: Submission[];
  onDelete: (id: string) => void;
}

export const SubmissionList: React.FC<SubmissionListProps> = ({ submissions, onDelete }) => {
  if (submissions.length === 0) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
        <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Belum ada data pendaftaran.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        Daftar Pendaftaran Terakhir <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">{submissions.length}</span>
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {submissions.map((sub) => (
          <div key={sub.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
            <button 
              onClick={() => onDelete(sub.id)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Hapus data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-gray-900 text-lg">{sub.namaSiswa}</h4>
                <p className="text-gray-500 text-sm flex items-center gap-1">
                  <span className="font-medium">{sub.asalSekolah}</span> • {sub.jenjang}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sub.mataPelajaran.map(mp => (
                    <span key={mp} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-semibold rounded uppercase tracking-wider">
                      {mp}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right flex items-center md:flex-col md:items-end gap-2 shrink-0">
                <div className="flex items-center text-[10px] text-gray-400">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(sub.timestamp).toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
