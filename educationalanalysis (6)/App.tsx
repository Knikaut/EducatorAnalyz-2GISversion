import React, { useState, useCallback } from 'react';
import { AppState, AnalysisResult } from './types';
import { analyzeUniversityData } from './services/geminiService';
import { runApifyScraper } from './services/apifyService';
import InputSection from './components/InputSection';
import ProcessingStatus from './components/ProcessingStatus';
import AnalysisResultView from './components/AnalysisResult';
import { GraduationCap, AlertCircle } from 'lucide-react';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (handle: string) => {
    try {
      setError(null);
      setAppState(AppState.SCRAPING);

      // Step 1: Run Real Apify Scraper
      // This connects to the Apify API, starts an actor, waits for it, and gets the JSON.
      const jsonString = await runApifyScraper(handle);
      
      setAppState(AppState.ANALYZING);

      // Step 2: Analyze with Gemini
      const { text, groundingChunks } = await analyzeUniversityData(jsonString);

      // Step 3: Set Results
      setResult({
        universityName: handle,
        rawText: text,
        scrapedJson: jsonString,
        groundingChunks
      });
      
      setAppState(AppState.COMPLETED);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Произошла непредвиденная ошибка");
      setAppState(AppState.ERROR);
    }
  }, []);

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <GraduationCap size={28} strokeWidth={1.5} />
            <h1 className="text-xl font-bold tracking-tight text-slate-900">EducationalAnalysis</h1>
          </div>
          <div className="text-xs font-medium px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
            Powered by Gemini 2.5 Flash & Apify
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        
        {appState === AppState.IDLE && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                Вся правда об <span className="text-indigo-600">Университете</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Мы сканируем Instagram и официальный сайт, чтобы создать полный отчет о репутации, требованиях и реальной атмосфере.
              </p>
            </div>
            <InputSection onSubmit={handleAnalyze} isLoading={false} />
          </div>
        )}

        {(appState === AppState.SCRAPING || appState === AppState.ANALYZING) && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Анализируем @{result?.universityName || 'University'}</h2>
            <p className="text-slate-500 mb-8">
              {appState === AppState.SCRAPING 
                ? "Загружаем данные из Instagram..." 
                : "Gemini изучает официальный сайт и соцсети..."}
            </p>
            <ProcessingStatus state={appState} />
          </div>
        )}

        {appState === AppState.COMPLETED && result && (
          <AnalysisResultView result={result} onReset={handleReset} />
        )}

        {appState === AppState.ERROR && (
          <div className="max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-xl p-6 text-center animate-shake">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-red-900 mb-2">Ошибка анализа</h3>
            <p className="text-red-700 mb-6">{error || "Что-то пошло не так. Пожалуйста, попробуйте снова."}</p>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-white border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
