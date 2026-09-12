import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Reservation,
  ReservationStatus,
} from '../../../models/reservation.model';
import { UserRole } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { ReservationService } from '../../../services/reservation.service';
import { TableService } from '../../../services/table.service';
import { RestaurantTable } from '../../../models/table.model';

@Component({
  selector: 'app-reservations',
  imports: [FormsModule, DatePipe],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
})
export class Reservations implements OnInit {
  private readonly reservationService = inject(ReservationService);
  private readonly tableService = inject(TableService);
  private readonly authService = inject(AuthService);

  protected readonly ReservationStatus = ReservationStatus;

  protected readonly reservations = signal<Reservation[]>([]);
  protected readonly tables = signal<RestaurantTable[]>([]);
  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);

  protected statusFilter = 'all';
  protected whenFilter = 'all';
  protected searchTerm = '';

  // the table number typed next to a reservation before confirming it
  protected readonly tableChoice: Record<string, number | undefined> = {};

  ngOnInit(): void {
    this.load();

    this.tableService.getAllTables().subscribe({
      next: (response) => this.tables.set(response.data.tables),
      error: () => this.tables.set([]),
    });
  }

  protected load(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.reservationService
      .getAllReservations({
        status: this.statusFilter,
        filter: this.whenFilter,
        search: this.searchTerm.trim(),
      })
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.reservations.set(response.data.reservations);
        },
        error: (error: Error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.message);
        },
      });
  }

  protected confirm(reservation: Reservation): void {
    const tableNumber = this.tableChoice[reservation._id];

    this.reservationService
      .updateStatus(reservation._id, ReservationStatus.Confirmed, tableNumber)
      .subscribe({
        next: () => this.load(),
        error: (error: Error) => this.errorMessage.set(error.message),
      });
  }

  protected cancel(reservation: Reservation): void {
    this.reservationService
      .updateStatus(reservation._id, ReservationStatus.Cancelled)
      .subscribe({
        next: () => this.load(),
        error: (error: Error) => this.errorMessage.set(error.message),
      });
  }

  protected remove(reservation: Reservation): void {
    if (!confirm(`Delete reservation #${reservation.reservationNumber}?`)) {
      return;
    }

    this.reservationService.deleteReservation(reservation._id).subscribe({
      next: () => this.load(),
      error: (error: Error) => this.errorMessage.set(error.message),
    });
  }

  // only admins and managers may delete a reservation
  protected get canDelete(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === UserRole.Admin || role === UserRole.Manager;
  }

  // tables big enough for the party, so the manager does not seat 8 at a 2 top
  protected tablesFor(reservation: Reservation): RestaurantTable[] {
    return this.tables().filter((t) => t.capacity >= reservation.guests);
  }
}
