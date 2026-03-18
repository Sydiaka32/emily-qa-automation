export interface MemberUser {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  role: string;
  id: string;
  active: boolean;
}

export interface MemberUsersResponse {
  total_pages: number;
  total_elements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  has_next: boolean;
  has_previous: boolean;
  content: MemberUser[];
}
