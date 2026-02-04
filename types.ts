
export interface ConversionResult {
  geoJson: string;
  fileName: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
}
