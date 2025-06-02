export interface BilanDocument {
  id: number;
  bilanMedical: number | null; // or the full BilanMedical object if needed
  name: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
} 