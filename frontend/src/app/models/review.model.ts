import { User } from './user.model';

export interface Review {
  _id: string;
  menuItem: string;
  user: User | string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface NewReview {
  rating: number;
  comment: string;
}

export interface ReviewsData {
  reviews: Review[];
}
