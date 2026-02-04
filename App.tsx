
import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { MapPreview } from './components/MapPreview';
import { ConversionResult } from './types';
import { convertKmlToGeoJson } from './services/geminiService';
import JSZip from 'jszip';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ConversionResult>({
    geoJson: '',
    fileName: '',
    status: 'idle'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Reset state but keep the previous result visible until convert is pressed if desired, 
      // here we clear to avoid confusion.
      setResult({ geoJson: '', fileName: '', status: 'idle' });
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult({ geoJson: '', fileName: '', status: 'idle' });
    // Reset file input manually
    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) input.value = '';
  };

  const processKmlText = async (kmlText: string, originalName: string) => {
    try {
      const geoJson = await convertKmlToGeoJson(kmlText);
      setResult({
        geoJson,
        fileName: originalName.replace(/\.(kml|kmz)$/i, '.json'),
        status: 'success'
      });
    } catch (err: any) {
      setResult(prev => ({ 
        ...prev, 
        status: 'error', 
        errorMessage: err.message || 'An error occurred during conversion. Please check your internet connection or API key.' 
      }));
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setResult(prev => ({ ...prev, status: 'loading', errorMessage: undefined }));

    const isKmz = file.name.toLowerCase().endsWith('.kmz');

    try {
      if (isKmz) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const zip = await JSZip.loadAsync(arrayBuffer);
            const kmlFile = Object.values(zip.files).find((f: any) => f.name.toLowerCase().endsWith('.kml'));
            
            if (!kmlFile) {
              setResult(prev => ({ ...prev, status: 'error', errorMessage: 'Invalid KMZ: No KML file found inside the archive.' }));
              return;
            }

            const kmlText = await (kmlFile as any).async("string");
            await processKmlText(kmlText, file.name);
          } catch (err) {
            setResult(prev => ({ ...prev, status: 'error', errorMessage: 'Failed to decompress KMZ. The file might be corrupted.' }));
          }
        };
        reader.onerror = () => setResult(prev => ({ ...prev, status: 'error', errorMessage: 'Failed to read the file from disk.' }));
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target?.result as string;
          if (!text) {
            setResult(prev => ({ ...prev, status: 'error', errorMessage: 'The selected KML file is empty.' }));
            return;
          }
          await processKmlText(text, file.name);
        };
        reader.onerror = () => setResult(prev => ({ ...prev, status: 'error', errorMessage: 'Failed to read the file from disk.' }));
        reader.readAsText(file);
      }
    } catch (err) {
      setResult(prev => ({ ...prev, status: 'error', errorMessage: 'Critical error during file processing.' }));
    }
  };

  const handleDownload = () => {
    if (!result.geoJson) return;
    const blob = new Blob([result.geoJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName || 'converted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.geoJson).then(() => {
      // Small feedback would be nice, but keeping it simple as requested
    });
  };

  return (
    <Layout>
      <section className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-xl font-bold border-b-2 border-gray-100 pb-1">Input Source</h2>
          </div>
          {file && (
            <button onClick={handleClear} className="text-xs text-red-500 hover:text-red-700 font-bold uppercase tracking-widest px-2 py-1 bg-red-50 rounded-md transition-colors">
              Clear All
            </button>
          )}
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Select KML or KMZ Archive</label>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="file"
              id="fileInput"
              accept=".kml,.kmz"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700
                file:mr-4 file:py-3 file:px-6
                file:rounded-xl file:border-0
                file:text-sm file:font-semibold
                file:bg-orange-600 file:text-white
                hover:file:bg-orange-700
                border border-gray-200 rounded-xl cursor-pointer bg-gray-50 transition-all shadow-inner"
            />
          </div>
        </div>

        <button
          onClick={handleConvert}
          disabled={!file || result.status === 'loading'}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all transform active:scale-[0.98] flex items-center justify-center gap-3
            ${!file || result.status === 'loading' 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-200'}`}
        >
          {result.status === 'loading' ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AI Processing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Convert & Verify
            </>
          )}
        </button>
      </section>

      <section className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h2 className="text-xl font-bold border-b-2 border-gray-100 pb-1 w-full">Output & Verification</h2>
        </div>

        {result.status === 'idle' && (
          <div className="bg-gray-50 text-gray-500 p-12 rounded-xl border border-dashed border-gray-300 text-center flex flex-col items-center gap-2">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A2 2 0 013 15.488V5.512a2 2 0 011.553-1.944L9 1m0 19l6 3m-6-3V7m6 16l5.447-2.724A2 2 0 0021 18.512V8.512a2 2 0 00-1.553-1.944L15 4m0 19V7m0 0l-6-3" />
            </svg>
            <p className="font-medium">Ready for data ingestion</p>
            <p className="text-sm">Upload a KML/KMZ file to start the verification map</p>
          </div>
        )}

        {result.status === 'error' && (
          <div className="bg-red-50 text-red-800 p-6 rounded-xl border border-red-200 flex flex-col gap-2">
             <div className="flex items-center gap-3 font-bold">
               <span className="text-2xl">🚨</span> Conversion Failed
             </div>
             <p className="text-sm opacity-90 ml-9">{result.errorMessage}</p>
             <p className="text-[10px] ml-9 mt-2 text-red-400">If this persists on Vercel, ensure the API Key is correctly set in environment variables.</p>
          </div>
        )}

        {result.status === 'success' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center bg-green-500 text-white text-[10px] rounded-full font-bold">✓</span> 
                  Verification Map
                </div>
                <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">{result.fileName}</span>
              </h3>
              {/* Added key to force re-mounting MapPreview when geoJson changes */}
              <MapPreview key={result.geoJson.slice(0, 100) + result.geoJson.length} geoJson={result.geoJson} />
            </div>

            <div className="pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  GeoJSON Object
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100 active:scale-95"
                  >
                    Copy String
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md transition-colors active:scale-95"
                  >
                    Download .json
                  </button>
                </div>
              </div>
              <div className="relative group">
                <pre className="bg-slate-900 text-indigo-300 p-6 rounded-2xl overflow-x-auto text-[11px] sm:text-xs font-mono max-h-80 custom-scrollbar shadow-2xl border border-slate-800">
                  {result.geoJson}
                </pre>
                <div className="absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-r-2xl"></div>
              </div>
            </div>
          </div>
        )}
      </section>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 10px; height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; border: 2px solid #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-from-bottom { from { transform: translateY(1rem); } to { transform: translateY(0); } }
        .animate-in { animation: fade-in 0.3s ease-out, slide-in-from-bottom 0.3s ease-out; }
      `}</style>
    </Layout>
  );
};

export default App;
