export interface UserUpdateRequest {
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  role?: string;
  active?: boolean;
}
