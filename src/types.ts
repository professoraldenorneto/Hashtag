export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  teacher_id: string;
}

export interface HashtagToken {
  id: string;
  code: string;
  teacher_id: string;
  subject_id: string;
  activity_name: string;
  points: number;
  is_redeemed: boolean;
  redeemed_by?: string;
  redeemed_at?: string;
  created_at: string;
}
