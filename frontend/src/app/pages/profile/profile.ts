import { DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { uploadedImage } from '../../api-config';
import { Order } from '../../models/order.model';
import { Reservation, ReservationStatus } from '../../models/reservation.model';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { ReservationService } from '../../services/reservation.service';

type Tab = 'orders' | 'reservations' | 'profile' | 'settings';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, DatePipe],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly orderService = inject(OrderService);
  private readonly reservationService = inject(ReservationService);
  private readonly route = inject(ActivatedRoute);

  protected readonly tab = signal<Tab>('orders');

  protected readonly orders = signal<Order[]>([]);
  protected readonly reservations = signal<Reservation[]>([]);

  // Edit Profile form
  protected readonly details = {
    firstName: '',
    lastName: '',
    phone: '',
  };
  private pickedPhoto?: File;

  // The form stays open after saving, and a file input keeps showing the old
  // file name: resetting the model does not clear it, so it is cleared by hand
  private readonly photoInput =
    viewChild<ElementRef<HTMLInputElement>>('photoInput');
  protected readonly detailsMessage = signal('');
  protected readonly detailsError = signal('');

  // Settings tab
  protected readonly passwords = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  protected readonly passwordMessage = signal('');
  protected readonly passwordError = signal('');

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab') as Tab | null;

    if (tab) {
      this.tab.set(tab);
    }

    const user = this.authService.currentUser();

    if (user) {
      this.details.firstName = user.firstName;
      this.details.lastName = user.lastName;
      this.details.phone = user.phone ?? '';
    }

    this.orderService.getMyOrders().subscribe({
      next: (response) => this.orders.set(response.data.orders),
      error: () => this.orders.set([]),
    });

    this.reservationService.getMyReservations().subscribe({
      next: (response) => this.reservations.set(response.data.reservations),
      error: () => this.reservations.set([]),
    });
  }

  protected profileImage(): string {
    return uploadedImage(
      'users',
      this.authService.currentUser()?.imageUrl ?? 'default-user.webp',
    );
  }

  protected onPhotoPicked(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pickedPhoto = input.files?.[0];
  }

  protected saveDetails(): void {
    this.detailsMessage.set('');
    this.detailsError.set('');

    // FormData is used because the profile picture may be sent with it
    const data = new FormData();
    data.append('firstName', this.details.firstName);
    data.append('lastName', this.details.lastName);
    data.append('phone', this.details.phone);

    if (this.pickedPhoto) {
      data.append('imageUrl', this.pickedPhoto);
    }

    this.authService.updateMe(data).subscribe({
      next: () => {
        this.pickedPhoto = undefined;

        const input = this.photoInput();
        if (input) {
          input.nativeElement.value = '';
        }

        this.detailsMessage.set('Profile updated');
      },
      error: (error: Error) => {
        this.detailsError.set(error.message);
      },
    });
  }

  protected savePassword(): void {
    this.passwordMessage.set('');
    this.passwordError.set('');

    this.authService.changePassword(this.passwords).subscribe({
      next: () => {
        this.passwords.currentPassword = '';
        this.passwords.newPassword = '';
        this.passwords.confirmPassword = '';
        this.passwordMessage.set('Password changed');
      },
      error: (error: Error) => {
        this.passwordError.set(error.message);
      },
    });
  }

  protected cancelReservation(reservation: Reservation): void {
    this.reservationService
      .updateStatus(reservation._id, ReservationStatus.Cancelled)
      .subscribe({
        next: () =>
          this.reservations.update((list) =>
            list.map((r) =>
              r._id === reservation._id
                ? { ...r, status: ReservationStatus.Cancelled }
                : r,
            ),
          ),
      });
  }

  protected isCancellable(reservation: Reservation): boolean {
    return reservation.status !== ReservationStatus.Cancelled;
  }
}
