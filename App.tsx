
import React, { useState } from 'react';
import { Layout } from './components/Layout';
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
      setResult(prev => ({ ...prev, status: 'idle', errorMessage: undefined }));
    }
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
        errorMessage: err.message || 'An error occurred during conversion.' 
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
            
            // Look for the first KML file in the archive
            // Added explicit type cast to 'any' for the find callback argument to resolve "Property 'name' does not exist on type 'unknown'"
            const kmlFile = Object.values(zip.files).find((f: any) => f.name.toLowerCase().endsWith('.kml'));
            
            if (!kmlFile) {
              setResult(prev => ({ ...prev, status: 'error', errorMessage: 'No KML file found inside the KMZ archive.' }));
              return;
            }

            // Added explicit type cast to 'any' to resolve "Property 'async' does not exist on type 'unknown'"
            const kmlText = await (kmlFile as any).async("string");
            await processKmlText(kmlText, file.name);
          } catch (err) {
            setResult(prev => ({ ...prev, status: 'error', errorMessage: 'Failed to extract KMZ file.' }));
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target?.result as string;
          if (!text) {
            setResult(prev => ({ ...prev, status: 'error', errorMessage: 'Could not read file.' }));
            return;
          }
          await processKmlText(text, file.name);
        };
        reader.readAsText(file);
      }
    } catch (err) {
      setResult(prev => ({ ...prev, status: 'error', errorMessage: 'File processing failed.' }));
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
    navigator.clipboard.writeText(result.geoJson);
    alert('Copied to clipboard!');
  };

  return (
    <Layout>
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-bold border-b-2 border-gray-100 pb-1 w-full">File to convert</h2>
        </div>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-500">Choose a KML or KMZ file</label>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="file"
              accept=".kml,.kmz"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-3 file:px-6
                file:rounded-xl file:border-0
                file:text-sm file:font-semibold
                file:bg-orange-50 file:text-orange-700
                hover:file:bg-orange-100
                border border-gray-200 rounded-xl cursor-pointer"
            />
          </div>
        </div>

        <button
          onClick={handleConvert}
          disabled={!file || result.status === 'loading'}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all transform active:scale-[0.98]
            ${!file || result.status === 'loading' 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg'}`}
        >
          {result.status === 'loading' ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {file?.name.toLowerCase().endsWith('.kmz') ? 'Extracting & Converting...' : 'Converting...'}
            </div>
          ) : 'Convert'}
        </button>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <h2 className="text-xl font-bold border-b-2 border-gray-100 pb-1 w-full">Result</h2>
        </div>

        {result.status === 'idle' && (
          <div className="bg-orange-50 text-orange-800 p-4 rounded-xl border border-orange-100 text-center">
            First select a file (.kml or .kmz) and click convert
          </div>
        )}

        {result.status === 'error' && (
          <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-100 flex items-center gap-3">
             <span className="text-xl">⚠️</span> {result.errorMessage}
          </div>
        )}

        {result.status === 'success' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500 font-mono">{result.fileName}</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Copy JSON
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm transition-colors"
                >
                  Download .json
                </button>
              </div>
            </div>
            <div className="relative">
              <pre className="bg-gray-900 text-blue-400 p-6 rounded-2xl overflow-x-auto text-xs sm:text-sm font-mono max-h-96 custom-scrollbar shadow-inner">
                {result.geoJson}
              </pre>
              <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-gray-900 pointer-events-none rounded-r-2xl"></div>
            </div>
          </div>
        )}
      </section>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #111827;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4b5563;
        }
      `}</style>
    </Layout>
  );
};

export default App;
