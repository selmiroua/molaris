import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { AdminService, User } from '../../services/admin.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule,
    MatDividerModule,
    ReactiveFormsModule
  ],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  displayedColumns: string[] = ['id', 'profilePicture', 'fullName', 'email', 'role', 'status', 'createdAt', 'actions'];
  users: User[] = [];
  totalUsers = 0;
  isLoading = true;
  
  // Pagination
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];
  
  // Filtering
  searchControl = new FormControl('');
  
  constructor(private adminService: AdminService) {}
  
  ngOnInit(): void {
    this.loadUsers();
    
    // Setup search with debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(value => {
      this.pageIndex = 0; // Reset to first page on new search
      this.loadUsers(value || '');
    });
  }
  
  loadUsers(filter: string = ''): void {
    this.isLoading = true;
    this.adminService.getUsers(this.pageIndex + 1, this.pageSize, filter)
      .subscribe({
        next: (data) => {
          // Debug: Log the raw data to see what's coming from the API
          console.log('Raw user data from API:', data.users[0]);
          
          // Transform the user data to add fullName and status if not present
          let filteredUsers = data.users
            // Filter out users with admin role
            .filter(user => {
              // Check the role structure and extract the role name
              let roleName = '';
              
              if (typeof user.role === 'string') {
                roleName = user.role;
              } else if (user.role && typeof user.role === 'object' && 'nom' in user.role) {
                roleName = user.role.nom;
              }
              
              // Convert to lowercase if it's a string and compare
              return typeof roleName === 'string' ? roleName.toLowerCase() !== 'admin' : true;
            })
            .map(user => {
            // Calculate fullName if not present
            if (!user.fullName) {
              user.fullName = `${user.prenom} ${user.nom}`;
            }
            
            // Calculate status if not present
            if (!user.status) {
              user.status = user.banned ? 'banned' : 
                (user.accountLocked ? 'suspended' : 
                  (user.enabled ? 'active' : 'inactive'));
            }
              
              // Debug: Log the creationDate field for this user
              console.log(`User ${user.id} creationDate:`, user.creationDate);
            
            return user;
          });
          
          this.users = filteredUsers;
          // Adjust total count to reflect filtered results
          this.totalUsers = data.total - (data.users.length - filteredUsers.length);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.isLoading = false;
        }
      });
  }
  
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadUsers(this.searchControl.value || '');
  }
  
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'suspended':
        return 'status-suspended';
      case 'banned':
        return 'status-banned';
      default:
        return '';
    }
  }
  
  getRoleClass(roleObj: any): string {
    const roleName = typeof roleObj === 'string' ? roleObj : 
                    (roleObj && roleObj.nom ? roleObj.nom.toLowerCase() : '');
    
    switch (roleName) {
      case 'admin':
        return 'role-admin';
      case 'doctor':
        return 'role-doctor';
      case 'patient':
        return 'role-patient';
      case 'secretaire':
        return 'role-secretary';
      default:
        return '';
    }
  }
  
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    
    // Debug: Log the raw date string
    console.log('Raw date string:', dateString);
    
    // Handle ISO format date strings (YYYY-MM-DDTHH:mm:ss)
    // Java's LocalDateTime is typically serialized as an array or ISO string
    if (Array.isArray(dateString)) {
      // If it's an array like [2023, 6, 8, 11, 31, 22], convert to Date
      // Format: [year, month-1, day, hour, minute, second]
      try {
        const [year, month, day, hour, minute, second] = dateString;
        const date = new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
        return date.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      } catch (error) {
        console.error('Error parsing date array:', error, dateString);
        return 'N/A';
      }
    }
    
    // Try to parse the date as a string
    try {
    const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.log('Invalid date:', dateString);
        return 'N/A';
      }
      
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  }
  
  getProfilePictureUrl(user: User): string {
    if (!user || !user.id) return '/assets/images/default-avatar.png';
    
    // If we already know this user doesn't have a profile picture, skip API call
    if (user.hasProfilePictureChecked === true && user.hasProfilePicture === false) {
      return this.getDefaultAvatar(user.prenom, user.nom);
    }
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    return `${environment.apiUrl}/api/v1/api/users/profile/picture-by-id/${user.id}?t=${timestamp}`;
  }
  
  getDefaultAvatar(firstName: string | undefined, lastName: string | undefined): string {
    if (!firstName && !lastName) return '/assets/images/default-avatar.png';
    
    // Get initials for the avatar
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
    const initials = (firstInitial + lastInitial) || '?';
    
    // Generate a consistent color based on the name
    const colors = ['007bff', '28a745', 'dc3545', 'fd7e14', '6f42c1', '20c997', '17a2b8', '6c757d'];
    const colorIndex = Math.abs(firstName?.charCodeAt(0) || 0) % colors.length;
    const background = colors[colorIndex];
    
    // Use UI Avatars service for a nice default avatar with initials
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${background}&color=fff&size=128&bold=true`;
  }
  
  handleImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    const userRow = imgElement.closest('tr');
    
    // Get the user index from the DOM
    if (userRow) {
      const rowIndex = Array.from(document.querySelectorAll('tr')).indexOf(userRow as HTMLTableRowElement) - 1; // Subtract 1 for header row
      if (rowIndex >= 0 && rowIndex < this.users.length) {
        const user = this.users[rowIndex];
        
        // Mark this user as not having a profile picture to avoid future API calls
        if (user) {
          user.hasProfilePictureChecked = true;
          user.hasProfilePicture = false;
          
          // Get first and last name for the avatar
          const firstName = user.prenom || (user.fullName ? user.fullName.split(' ')[0] : '');
          const lastName = user.nom || (user.fullName ? user.fullName.split(' ').slice(1).join(' ') : '');
          
          // Use UI Avatars service for a fallback avatar with initials
          imgElement.src = this.getDefaultAvatar(firstName, lastName);
          return;
        }
      }
    }
    
    // Fallback if we couldn't find the user
    imgElement.src = '/assets/images/default-avatar.png';
  }
  
  // Actions
  viewUser(user: User): void {
    console.log('View user details:', user);
    // Implement navigation to user details page
  }
  
  editUser(user: User): void {
    console.log('Edit user:', user);
    // Implement edit user functionality
  }
  
  deleteUser(user: User): void {
    console.log('Delete user:', user);
    // Implement delete user functionality with confirmation
  }
  
  changeUserStatus(user: User, newStatus: string): void {
    console.log(`Change user status to ${newStatus}:`, user);
    // Implement status change functionality
  }
  
  banUser(user: User): void {
    if (confirm(`Êtes-vous sûr de vouloir bannir l'utilisateur ${user.fullName}?`)) {
      this.adminService.banUser(user.id, true).subscribe({
        next: () => {
          console.log('User banned successfully');
          // Update the user in the list
          user.banned = true;
          user.status = 'banned';
        },
        error: (error) => {
          console.error('Error banning user:', error);
        }
      });
    }
  }

  unbanUser(user: User): void {
    if (confirm(`Êtes-vous sûr de vouloir débannir l'utilisateur ${user.fullName}?`)) {
      this.adminService.banUser(user.id, false).subscribe({
        next: () => {
          console.log('User unbanned successfully');
          // Update the user in the list
          user.banned = false;
          user.status = 'active';
        },
        error: (error) => {
          console.error('Error unbanning user:', error);
        }
      });
    }
  }
}
