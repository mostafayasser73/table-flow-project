import { UserRole } from './user.model';

// One entry in the navigation bar, and the roles allowed to see it.
export interface NavLink {
  label: string;
  path: string;
  roles: UserRole[];
}
