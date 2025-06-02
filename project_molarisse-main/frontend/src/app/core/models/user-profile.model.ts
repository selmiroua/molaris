export interface UserProfile {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  phoneNumber?: string;
  profilePicturePath?: string;
  assignedDoctor?: {
    id: number;
    nom: string;
    prenom: string;
  };
} 