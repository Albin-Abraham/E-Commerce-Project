// domain/http/http.content-type.ts

/**
 * Configuration for single file upload
 */
export interface FileUploadConfig {
  file: File | Blob;
  fieldName?: string;
  fields?: Record<string, string | number | boolean>;
  onProgress?: (percentage: number) => void;
}

/**
 * Configuration for multiple file upload
 */
export interface MultiFileUploadConfig {
  files: File[] | Blob[];
  fieldName?: string;
  fields?: Record<string, string | number | boolean>;
  onProgress?: (percentage: number) => void;
}
