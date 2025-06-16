export interface DoctorApplication {
  id: number;
  secretaryId: number;
  doctorId: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  cvFilePath?: string;
} 