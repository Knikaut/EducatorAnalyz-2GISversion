import React from 'react';
import { Loader2, Database, BrainCircuit, FileText, CheckCircle2 } from 'lucide-react';
import { AppState } from '../types';

interface ProcessingStatusProps {
  state: AppState;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ state }) => {
  const isScraping = state === AppState.SCRAPING;
  const isAnalyzing = state === AppState.ANALYZING;
  
  // Determine active step index
  let activeStep = 0;
  if (state === AppState.SCRAPING) activeStep = 1;
  if (state === AppState.ANALYZING) activeStep = 2;
  if (state === AppState.COMPLETED) activeStep = 3;

  const steps = [
    { icon: Database, label: "Парсинг Apify", description: "Сбор данных профиля..." },
    { icon: BrainCircuit, label: "Анализ Gemini", description: "Оценка настроений..." },
    { icon: FileText, label: "Создание отчета", description: "Форматирование итогов..." }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto mt-12">
      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 -z-10"></div>
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-indigo-500 -z-10 transition-all duration-700 ease-out"
          style={{ width: `${(activeStep / 3) * 100}%` }}
        ></div>

        <div className="flex justify-between">
          {steps.map((step, index) => {
            const isActive = index + 1 === activeStep;
            const isCompleted = index + 1 < activeStep;
            const isPending = index + 1 > activeStep;

            return (
              <div key={index} className="flex flex-col items-center bg-transparent">
                <div 
                  className={`w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500 bg-white ${
                    isActive || isCompleted
                      ? 'border-indigo-500 text-indigo-600 shadow-lg scale-110' 
                      : 'border-slate-200 text-slate-300'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={24} />
                  ) : isActive ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <step.icon size={24} />
                  )}
                </div>
                <div className="mt-4 text-center">
                  <p className={`font-semibold text-sm ${isActive || isCompleted ? 'text-indigo-900' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs mt-1 ${isActive ? 'text-indigo-500 font-medium' : 'text-slate-400'}`}>
                    {isActive ? step.description : isCompleted ? 'Готово' : 'Ожидание...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProcessingStatus;