import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Autofocus } from '../../directives/autofocus';
import { AuthService } from '../../services/auth.service';
import { LoginData } from '../../models/user.model';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, Autofocus],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // what the two inputs are bound to
  protected readonly form: LoginData = {
    email: '',
    password: '',
  };

  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);

  protected onSubmit(): void {
    this.errorMessage.set('');
    this.isLoading.set(true);

    this.authService.login(this.form).subscribe({
      next: () => {
        this.isLoading.set(false);

        // the guard puts ?returnUrl=... on the address when it sends
        // somebody here, so they land back where they were going
        const returnUrl =
          this.route.snapshot.queryParamMap.get('returnUrl') ?? '/menu';

        this.router.navigateByUrl(returnUrl);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading.set(false);

        // the backend always answers with { status, message }
        this.errorMessage.set(
          error.error?.message ?? 'Could not reach the server',
        );
      },
    });
  }
}
