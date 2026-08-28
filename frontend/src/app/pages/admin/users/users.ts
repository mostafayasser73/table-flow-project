import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { uploadedImage } from '../../../api-config';
import { User, UserRole } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';

// what the Add / Edit form holds while it is open
interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  status: string;
}

const emptyForm = (): UserForm => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  role: UserRole.Waiter,
  status: 'active',
});

@Component({
  selector: 'app-users',
  imports: [FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users implements OnInit {
  private readonly userService = inject(UserService);
  protected readonly authService = inject(AuthService);

  protected readonly roles = Object.values(UserRole);

  protected readonly users = signal<User[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);

  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly totalUsers = signal(0);

  protected roleFilter = 'all';
  protected statusFilter = 'all';
  protected searchTerm = '';

  // the form panel: closed when editing is null and isAdding is false
  protected readonly isFormOpen = signal(false);
  protected readonly editingId = signal<string | null>(null);
  protected form: UserForm = emptyForm();
  private pickedPhoto?: File;
  protected readonly formError = signal('');

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.userService
      .getAllUsers({
        role: this.roleFilter,
        status: this.statusFilter,
        search: this.searchTerm.trim(),
        page: this.currentPage(),
      })
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.users.set(response.data.users);
          this.totalPages.set(response.totalPages);
          this.totalUsers.set(response.totalUsers);
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.errorMessage.set(
            error.error?.message ?? 'Could not load the users',
          );
        },
      });
  }

  protected onFilterChange(): void {
    this.currentPage.set(1);
    this.load();
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
    this.load();
  }

  protected avatar(user: User): string {
    return uploadedImage('users', user.imageUrl ?? 'default-user.webp');
  }

  protected openAdd(): void {
    this.form = emptyForm();
    this.editingId.set(null);
    this.pickedPhoto = undefined;
    this.formError.set('');
    this.isFormOpen.set(true);
  }

  protected openEdit(user: User): void {
    this.form = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      password: '',
      role: user.role,
      status: user.status,
    };
    this.editingId.set(user._id);
    this.pickedPhoto = undefined;
    this.formError.set('');
    this.isFormOpen.set(true);
  }

  protected closeForm(): void {
    this.isFormOpen.set(false);
  }

  protected onPhotoPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pickedPhoto = input.files?.[0];
  }

  protected saveUser(): void {
    this.formError.set('');

    const data = new FormData();
    data.append('firstName', this.form.firstName);
    data.append('lastName', this.form.lastName);
    data.append('email', this.form.email);
    data.append('phone', this.form.phone);
    data.append('role', this.form.role);
    data.append('status', this.form.status);

    // when editing, an empty password means "leave it as it is"
    if (this.form.password) {
      data.append('password', this.form.password);
    }

    if (this.pickedPhoto) {
      data.append('imageUrl', this.pickedPhoto);
    }

    const id = this.editingId();

    const request = id
      ? this.userService.updateUser(id, data)
      : this.userService.createUser(data);

    request.subscribe({
      next: () => {
        this.isFormOpen.set(false);
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.formError.set(error.error?.message ?? 'Could not save the user');
      },
    });
  }

  protected deleteUser(user: User): void {
    if (!confirm(`Delete ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    this.userService.deleteUser(user._id).subscribe({
      next: () => this.load(),
      error: (error: HttpErrorResponse) =>
        this.errorMessage.set(
          error.error?.message ?? 'Could not delete the user',
        ),
    });
  }

  // only an admin may delete, and never their own account
  protected canDelete(user: User): boolean {
    const me = this.authService.currentUser();
    return me?.role === UserRole.Admin && me._id !== user._id;
  }
}
