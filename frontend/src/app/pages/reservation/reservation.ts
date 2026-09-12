import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NewReservation } from '../../models/reservation.model';
import { AuthService } from '../../services/auth.service';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-reservation',
  imports: [FormsModule],
  templateUrl: './reservation.html',
  styleUrl: './reservation.css',
})
export class ReservationPage {
  private readonly reservationService = inject(ReservationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // the date input must not allow a day that has already passed
  protected readonly today = new Date().toISOString().split('T')[0];

  protected readonly times = [
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '5:00 PM',
    '6:00 PM',
    '6:30 PM',
    '7:00 PM',
    '7:30 PM',
    '8:00 PM',
    '8:30 PM',
    '9:00 PM',
    '9:30 PM',
    '10:00 PM',
  ];

  protected readonly form: NewReservation = {
    // the name and phone start from the logged in user, and can be changed
    fullName: this.currentName(),
    phone: this.authService.currentUser()?.phone ?? '',
    date: this.today,
    time: '8:00 PM',
    guests: 2,
    specialRequests: '',
  };

  protected readonly errorMessage = signal('');
  protected readonly isSaving = signal(false);

  protected onSubmit(): void {
    this.errorMessage.set('');
    this.isSaving.set(true);

    this.reservationService.createReservation(this.form).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.router.navigate(['/profile'], {
          queryParams: { tab: 'reservations' },
        });
      },
      error: (error: Error) => {
        this.isSaving.set(false);
        this.errorMessage.set(error.message);
      },
    });
  }

  private currentName(): string {
    const user = this.authService.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : '';
  }
}
