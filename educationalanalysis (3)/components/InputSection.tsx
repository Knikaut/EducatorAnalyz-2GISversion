import React, { useState } from 'react';
import { Search, Instagram, ArrowRight } from 'lucide-react';

interface InputSectionProps {
  onSubmit: (handle: string) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onSubmit, isLoading }) => {
  const [handle, setHandle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (handle.trim()) {
      onSubmit(handle.replace('@', '').trim());
    }
  };

  const handlePreset = (preset: string) => {
    setHandle(preset);
    onSubmit(preset);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-50">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <Instagram size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Анализ Instagram ВУЗа</h2>
          <p className="text-slate-600 mt-2">
            Введите Instagram аккаунт университета для получения полного отчета о репутации и профориентации.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-slate-400 text-lg font-medium">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="university_handle"
              className="w-full pl-10 pr-14 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!handle.trim() || isLoading}
              className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </form>

        <div className="mt-8">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">Популярные примеры</p>
            <div className="flex flex-wrap justify-center gap-2">
                {['princeton', 'harvard', 'mit', 'stanford'].map((uni) => (
                    <button
                        key={uni}
                        onClick={() => handlePreset(uni)}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-full border border-transparent hover:border-indigo-200 transition-all"
                    >
                        @{uni}
                    </button>
                ))}
            </div>
        </div>

      </div>
      
      <p className="text-center text-slate-400 text-sm mt-6">
        Мы анализируем 50+ постов и 200+ комментариев для каждого отчета.
      </p>
    </div>
  );
};

export default InputSection;