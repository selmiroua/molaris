export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  patientId?: number;
  doctorId?: number;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  assignedDoctor?: {
    id: number;
    nom?: string;
    prenom?: string;
  };
} 