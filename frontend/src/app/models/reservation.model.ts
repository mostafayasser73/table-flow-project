import { User } from './user.model';

export enum ReservationStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
}

export interface Reservation {
  _id: string;
  reservationNumber: number;
  user: User | string;
  fullName: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  specialRequests?: string;
  tableNumber?: number;
  status: ReservationStatus;
  createdAt: string;
}

// What POST /reservations expects.
export interface NewReservation {
  fullName: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  specialRequests?: string;
}

export interface ReservationsData {
  reservations: Reservation[];
}

export interface ReservationData {
  reservation: Reservation;
}
