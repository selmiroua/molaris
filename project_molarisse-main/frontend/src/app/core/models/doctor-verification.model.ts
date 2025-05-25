export interface DoctorVerification {
  id?: number;
  doctorId: number;
  status: 'pending' | 'approved' | 'rejected';
  address: string;
  cabinetAddress: string;
  yearsOfExperience: number;
  specialties: string[];
  postalCode: string;
  email: string;
  cabinetName: string;
  cabinetPhotoPath?: string;
  diplomaPhotoPath?: string;
  phoneNumber: string;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
} 