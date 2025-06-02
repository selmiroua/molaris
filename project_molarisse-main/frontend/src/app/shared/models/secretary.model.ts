import { User } from '../../core/models/user.model';

export interface Secretary extends User {
  // Add any secretary-specific properties
  firstName?: string;
  lastName?: string;
  experience?: number;
  skills?: string[];
  availability?: string;
} 