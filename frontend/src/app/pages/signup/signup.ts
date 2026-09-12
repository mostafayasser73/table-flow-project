import { Component, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  form,
  minLength,
  maxLength,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { SignupData } from '../../models/user.model';

@Component({
  selector: 'app-signup',
  imports: [FormField, FormRoot, RouterLink],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // A file is not text, so it cannot live in the form model. It is kept here
  // and added to the FormData when the form is sent.
  private pickedPhoto?: File;

  protected onPhotoPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pickedPhoto = input.files?.[0];
  }

  // The model is a plain signal, and it is the single source of truth for
  // the form: what the user types ends up here.
  private readonly signupModel = signal<SignupData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // form() wraps the model in a field tree. The rules are the same ones the
  // backend checks, so a wrong value never reaches the server.
  protected readonly signupForm = form(
    this.signupModel,
    (schema) => {
      required(schema.firstName, { message: 'First name is required' });
      minLength(schema.firstName, 2, {
        message: 'First name must be at least 2 characters',
      });
      maxLength(schema.firstName, 50, {
        message: 'First name cannot pass 50 characters',
      });

      required(schema.lastName, { message: 'Last name is required' });
      minLength(schema.lastName, 2, {
        message: 'Last name must be at least 2 characters',
      });
      maxLength(schema.lastName, 50, {
        message: 'Last name cannot pass 50 characters',
      });

      required(schema.email, { message: 'Email is required' });
      pattern(schema.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
        message: 'Please write a valid email',
      });

      required(schema.phone, { message: 'Phone number is required' });
      pattern(schema.phone, /^\+?[0-9]{10,15}$/, {
        message: 'Please write a valid phone number',
      });

      required(schema.password, { message: 'Password is required' });
      minLength(schema.password, 8, {
        message: 'Password must be at least 8 characters long',
      });

      required(schema.confirmPassword, {
        message: 'Please repeat the password',
      });

      // this one needs another field, so it is written by hand
      validate(schema.confirmPassword, (field) =>
        field.value() && field.value() !== field.valueOf(schema.password)
          ? { kind: 'mismatch', message: 'The two passwords do not match' }
          : null,
      );
    },
    {
      submission: {
        // Runs only after every rule above passed. Whatever it returns is
        // shown as an error on the form, and Angular clears it again as soon
        // as the user edits the field it belongs to.
        action: async (field) => {
          // Multer on the backend reads multipart/form-data, not JSON, so
          // every field is appended one by one, and the picture with them
          const data = new FormData();

          for (const [key, value] of Object.entries(field().value())) {
            data.append(key, value);
          }

          if (this.pickedPhoto) {
            data.append('imageUrl', this.pickedPhoto);
          }

          try {
            await firstValueFrom(this.authService.signup(data));
            this.router.navigate([this.authService.landingPage()]);

            return undefined;
          } catch (error) {
            // the error interceptor already turned the response into a message
            const message = (error as Error).message;

            // the backend answers with this when the email is taken, and the
            // message belongs on the email field, not on the whole form
            if (message.toLowerCase().includes('email')) {
              return {
                kind: 'serverError',
                message,
                fieldTree: field.email,
              };
            }

            return { kind: 'serverError', message };
          }
        },
      },
    },
  );
}
