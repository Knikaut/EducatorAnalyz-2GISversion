import React, { useMemo } from 'react';
import { AnalysisResult as AnalysisResultType } from '../types';
import { Download, RefreshCw, FileJson, FileText, Link as LinkIcon, MapPin, Camera, ExternalLink, Image as ImageIcon, Star, BarChart3 } from 'lucide-react';

interface AnalysisResultProps {
  result: AnalysisResultType;
  onReset: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result, onReset }) => {
  
  // Extract JSON block from the end of the text if it exists
  const { cleanText, sentimentData } = useMemo(() => {
    const jsonRegex = /```json\s*({[\s\S]*?"sentiment_distribution"[\s\S]*?})\s*```/;
    const match = result.rawText.match(jsonRegex);
    
    let sentimentData = null;
    let cleanText = result.rawText;

    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.sentiment_distribution) {
          sentimentData = parsed.sentiment_distribution;
        }
        // Remove the JSON block from the displayed text
        cleanText = result.rawText.replace(match[0], '').trim();
        // Clean up any lingering separator lines
        cleanText = cleanText.replace(/--------------------------------------------------/g, '').trim();
      } catch (e) {
        console.error("Failed to parse hidden sentiment JSON", e);
      }
    }

    return { cleanText, sentimentData };
  }, [result.rawText]);

  const downloadTxt = () => {
    const blob = new Blob([cleanText], { type: 'text/plain' });
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

  // Helper to check if a grounding chunk is likely a visual source
  const isVisualSource = (uri: string, title: string) => {
    const lower = (uri + title).toLowerCase();
    return lower.includes('gallery') || lower.includes('photo') || lower.includes('tour') || lower.includes('instagram') || lower.includes('pinterest') || lower.includes('flickr');
  };

  const googleImagesLink = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(result.universityName + " campus photos")}`;
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.universityName)}`;

  // Function to generate conic-gradient string for Pie Chart
  const getPieStyle = (data: Record<string, number>) => {
    let currentDeg = 0;
    const colors = {
      '5': '#10b981', // emerald-500
      '4': '#34d399', // emerald-400
      '3': '#facc15', // yellow-400
      '2': '#fb923c', // orange-400
      '1': '#f87171'  // red-400
    };
    
    // Ensure we process 5 to 1
    const parts = [];
    ['5', '4', '3', '2', '1'].forEach(star => {
      const val = data[star] || 0;
      const deg = (val / 100) * 360;
      parts.push(`${colors[star as keyof typeof colors]} ${currentDeg}deg ${currentDeg + deg}deg`);
      currentDeg += deg;
    });

    return {
      background: `conic-gradient(${parts.join(', ')})`
    };
  };

  // --- MARKDOWN RENDERER ---
  // Simple parser to make text beautiful without external libraries
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      const trimLine = line.trim();
      
      // H1 (Main Title)
      if (trimLine.startsWith('# ')) {
        return (
          <h1 key={index} className="text-3xl font-extrabold text-slate-900 mt-8 mb-6 pb-2 border-b-2 border-indigo-100">
            {trimLine.replace('# ', '')}
          </h1>
        );
      }
      
      // H2 (Section Headers)
      if (trimLine.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl font-bold text-indigo-700 mt-8 mb-4 flex items-center gap-2 bg-indigo-50/50 p-2 rounded-lg">
            {trimLine.replace('## ', '')}
          </h2>
        );
      }

      // H3 (Sub Headers)
      if (trimLine.startsWith('### ')) {
        return (
          <h3 key={index} className="text-lg font-semibold text-slate-800 mt-6 mb-2">
            {trimLine.replace('### ', '')}
          </h3>
        );
      }

      // List Items (-, *, —)
      if (trimLine.startsWith('- ') || trimLine.startsWith('* ') || trimLine.startsWith('— ')) {
         const content = trimLine.replace(/^[-*—]\s+/, '');
         // Basic bold parsing for list items
         const parts = content.split(/(\*\*.*?\*\*)/g);
         return (
            <div key={index} className="flex items-start gap-3 mb-2 ml-1">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2.5 flex-shrink-0"></div>
                <p className="text-slate-700 leading-relaxed">
                   {parts.map((part, i) => 
                      part.startsWith('**') && part.endsWith('**') 
                      ? <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
                      : part
                   )}
                </p>
            </div>
         );
      }

      // Empty lines
      if (trimLine === '') {
        return <div key={index} className="h-2"></div>;
      }

      // Regular Paragraphs
      // Support bolding inside paragraphs too
      const parts = trimLine.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={index} className="text-slate-600 mb-2 leading-7 text-[15px]">
          {parts.map((part, i) => 
              part.startsWith('**') && part.endsWith('**') 
              ? <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
              : part
           )}
        </p>
      );
    });
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
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* PHOTO TOUR SECTION */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full">
               <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                  <Camera className="text-pink-600" size={20} />
                  <h3 className="font-bold text-slate-800">📸 Визуальный тур</h3>
               </div>
               <div className="p-6 grid grid-cols-1 gap-4 flex-grow">
                  <a 
                    href={googleImagesLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white border-2 border-slate-100 hover:border-pink-200 hover:bg-pink-50 rounded-xl transition-all group"
                  >
                      <div className="w-10 h-10 bg-pink-100 text-pink-600 rounded-full flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ImageIcon size={20} />
                      </div>
                      <div className="flex-grow">
                          <p className="font-bold text-slate-800">Галерея фото</p>
                          <p className="text-xs text-slate-500">Смотреть реальные фото кампуса</p>
                      </div>
                      <ExternalLink size={16} className="text-slate-400 group-hover:text-pink-500" />
                  </a>

                   <a 
                    href={googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-white border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 rounded-xl transition-all group"
                  >
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex-shrink-0 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MapPin size={20} />
                      </div>
                      <div className="flex-grow">
                          <p className="font-bold text-slate-800">На карте</p>
                          <p className="text-xs text-slate-500">Панорамы улиц и локация</p>
                      </div>
                       <ExternalLink size={16} className="text-slate-400 group-hover:text-emerald-500" />
                  </a>
               </div>
            </div>

            {/* SENTIMENT CHART SECTION */}
            {sentimentData && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full">
                 <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                    <BarChart3 className="text-indigo-600" size={20} />
                    <h3 className="font-bold text-slate-800">📊 Рейтинг в Google Maps</h3>
                 </div>
                 <div className="p-6 flex items-center justify-around h-full">
                    {/* The Pie Chart */}
                    <div 
                      className="w-32 h-32 rounded-full shadow-inner border-4 border-white flex-shrink-0"
                      style={getPieStyle(sentimentData)}
                    ></div>
                    
                    {/* Legend */}
                    <div className="flex flex-col gap-1.5 text-sm">
                       {[5, 4, 3, 2, 1].map((star) => {
                         const val = sentimentData[star] || 0;
                         const colors = {
                            '5': 'bg-emerald-500',
                            '4': 'bg-emerald-400',
                            '3': 'bg-yellow-400',
                            '2': 'bg-orange-400',
                            '1': 'bg-red-400'
                         };
                         return (
                           <div key={star} className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${colors[star as unknown as keyof typeof colors]}`}></div>
                              <div className="flex items-center gap-1 font-medium text-slate-700 w-16">
                                <span>{star}</span>
                                <Star size={10} fill="currentColor" className="text-slate-400" />
                              </div>
                              <span className="text-slate-500 font-mono">{val}%</span>
                           </div>
                         );
                       })}
                    </div>
                 </div>
              </div>
            )}
          </div>

          {/* Grounding Sources */}
          {result.groundingChunks && result.groundingChunks.length > 0 && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Web Sources */}
              <div>
                <div className="flex items-center gap-2 mb-3 text-slate-500 text-sm uppercase tracking-wider font-semibold">
                  <LinkIcon size={16} />
                  <h3>Полезные ссылки</h3>
                </div>
                <ul className="space-y-2">
                  {result.groundingChunks.map((chunk, index) => {
                    if (chunk.web) {
                      const isVisual = isVisualSource(chunk.web.uri, chunk.web.title || '');
                      return (
                        <li key={`web-${index}`} className="text-sm">
                          <a 
                            href={chunk.web.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`hover:underline truncate block flex items-center gap-2 ${isVisual ? 'text-pink-600 font-medium' : 'text-indigo-600'}`}
                          >
                            {isVisual && <Camera size={14} />}
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
                  <h3>Локации 2ГИС / Maps</h3>
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
                  {/* Fallback if no specific map chunks but prompt asked for it */}
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

          {/* REPORT TEXT */}
          <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm uppercase tracking-wider font-semibold border-t border-slate-200 pt-8">
            <FileText size={16} />
            <h3>Полный отчет</h3>
          </div>
          
          <div className="bg-white rounded-xl p-0 font-sans text-slate-700">
            {renderFormattedText(cleanText)}
          </div>

          <div className="mt-8 flex justify-center pt-8 border-t border-slate-200">
            <button 
              onClick={onReset}
              className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors px-6 py-3 rounded-full hover:bg-slate-50 font-medium"
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