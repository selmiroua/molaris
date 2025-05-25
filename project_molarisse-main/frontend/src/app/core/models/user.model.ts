export interface Role {
  id: number;
  nom: string;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string | Role;
  image?: string;
  phone?: string;
  address?: string;
  dateNaissance?: string;
  genre?: string;
  specialite?: string;
  description?: string;
  isVerified?: boolean;
  isEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  profilePicturePath?: string | null;
  phoneNumber?: string;
  enabled: boolean;
  accountLocked: boolean;
  specialization?: string;
  specialities?: string[];
  assignedDoctor?: User;
  secretaryStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  cvFilePath?: string;
  secretaries?: User[];
  profileImageUrl?: string;
} 