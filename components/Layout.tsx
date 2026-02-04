
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold text-orange-600 mb-2">
          KML & KMZ to GeoJSON converter
        </h1>
        <p className="text-gray-600 text-lg">
          Convert KML or KMZ files to GeoJSON privately with AI-powered robustness.
        </p>
      </header>
      <main className="space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        {children}
      </main>
      <footer className="mt-12 pt-8 border-t border-gray-200 text-sm text-gray-500">
        <div className="flex flex-col space-y-2">
          <p className="font-semibold flex items-center gap-2">
            <span className="inline-block w-4 h-4 text-orange-600">ℹ</span> Credits
          </p>
          <p>Powered by Gemini 3 Flash for intelligent structural mapping.</p>
          <p>Handled in-memory with client-side decompression for your privacy.</p>
        </div>
      </footer>
    </div>
  );
};
