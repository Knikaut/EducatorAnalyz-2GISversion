import React from 'react';
import { AnalysisResult as AnalysisResultType } from '../types';
import { Download, RefreshCw, FileJson, FileText, Link as LinkIcon, MapPin, ThumbsUp, ThumbsDown } from 'lucide-react';

interface AnalysisResultProps {
  result: AnalysisResultType;
  onReset: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onReset }) => {
  
  const downloadTxt = () => {
    const blob = new Blob([result.rawText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.universityName.replace(/\s+/g, '_')}_Analysis.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    const blob = new Blob([result.scrapedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.universityName.replace(/\s+/g, '_')}_Data.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-indigo-50">
        
        {/* Header */}
        <div className="bg-indigo-600 px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Анализ завершен</h2>
            <p className="text-indigo-100 text-sm mt-1">Сгенерировано Gemini Flash 2.5</p>
          </div>
          <div className="flex gap-3">
             <button 
              onClick={downloadJson}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FileJson size={16} />
              <span>Raw JSON</span>
            </button>
            <button 
              onClick={downloadTxt}
              className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              <Download size={16} />
              <span>Скачать отчет</span>
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-8">
          
          {/* New "Real Reviews" Section */}
          {result.reviews && (
            <div className="mb-10">
              <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">Реальные отзывы (Vibe & Truth)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Positive Column */}
                <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-6">
                  <div className="flex items-center gap-2 mb-4 text-emerald-700">
                    <ThumbsUp size={24} />
                    <h4 className="font-bold text-lg">Positive Vibes</h4>
                  </div>
                  <ul className="space-y-3">
                    {result.reviews.positive.map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-700 text-sm">
                        <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Negative Column */}
                <div className="bg-rose-50 rounded-xl border border-rose-100 p-6">
                  <div className="flex items-center gap-2 mb-4 text-rose-700">
                    <ThumbsDown size={24} />
                    <h4 className="font-bold text-lg">Harsh Truth</h4>
                  </div>
                  <ul className="space-y-3">
                    {result.reviews.negative.map((item, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-700 text-sm">
                        <span className="text-rose-500 flex-shrink-0 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          )}

          {/* Grounding Sources */}
          {result.groundingChunks && result.groundingChunks.length > 0 && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
              
              {/* Web Sources */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-slate-500 text-sm uppercase tracking-wider font-semibold">
                  <LinkIcon size={16} />
                  <h3>Веб-источники</h3>
                </div>
                <ul className="space-y-2">
                  {result.groundingChunks.map((chunk, index) => {
                    if (chunk.web) {
                      return (
                        <li key={`web-${index}`} className="text-sm">
                          <a 
                            href={chunk.web.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline truncate block"
                          >
                            {chunk.web.title || chunk.web.uri}
                          </a>
                        </li>
                      );
                    }
                    return null;
                  })}
                </ul>
              </div>

              {/* Map Sources */}
              <div>
                 <div className="flex items-center gap-2 mb-3 text-slate-500 text-sm uppercase tracking-wider font-semibold">
                  <MapPin size={16} />
                  <h3>Карты и Локации</h3>
                </div>
                <ul className="space-y-2">
                  {result.groundingChunks.map((chunk, index) => {
                    if (chunk.maps) {
                      return (
                        <li key={`map-${index}`} className="text-sm">
                          <a 
                            href={chunk.maps.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline truncate block flex items-center gap-1"
                          >
                            <span>{chunk.maps.title || 'Google Maps Location'}</span>
                          </a>
                        </li>
                      );
                    }
                    return null;
                  })}
                  {/* Fallback if no specific map chunks but prompt asked for it, 
                      checking if any web chunks are 2gis or maps */}
                  {result.groundingChunks.filter(c => c.web?.uri.includes('2gis') || c.web?.uri.includes('maps.google')).map((chunk, index) => (
                     <li key={`map-fallback-${index}`} className="text-sm">
                      <a 
                        href={chunk.web!.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:underline truncate block"
                      >
                        {chunk.web!.title || 'Location Link'}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm uppercase tracking-wider font-semibold border-t border-slate-100 pt-6">
            <FileText size={16} />
            <h3>Полный отчет</h3>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 h-96 overflow-y-auto font-mono text-sm text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
            {result.rawText}
          </div>

          <div className="mt-8 flex justify-center">
            <button 
              onClick={onReset}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors px-6 py-3 rounded-full hover:bg-slate-50"
            >
              <RefreshCw size={18} />
              <span>Проверить другой ВУЗ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;