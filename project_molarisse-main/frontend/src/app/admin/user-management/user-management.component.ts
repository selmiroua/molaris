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
  displayedColumns: string[] = ['id', 'fullName', 'email', 'role', 'status', 'createdAt', 'actions'];
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
          // Transform the user data to add fullName and status if not present
          this.users = data.users.map(user => {
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
            
            return user;
          });
          this.totalUsers = data.total;
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
  
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
