import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { SignupData } from '../../models/user.model';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form: SignupData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };

  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);

  protected onSubmit(): void {
    this.errorMessage.set('');

    // the backend checks this too, but catching it here saves a request
    if (this.form.password !== this.form.confirmPassword) {
      this.errorMessage.set('Password and confirm password do not match');
      return;
    }

    this.isLoading.set(true);

    this.authService.signup(this.form).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/menu']);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error.error?.message ?? 'Could not reach the server',
        );
      },
    });
  }
}
