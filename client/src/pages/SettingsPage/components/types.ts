export type GenderOption = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export const USER_GENDER_OPTIONS: { value: GenderOption; label: string }[] = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
  { value: 'prefer_not_to_say', label: '不愿透露' },
];

export interface ProfileFormData {
  nickname: string;
  email: string;
  phone: string;
  bio: string;
  gender: GenderOption;
  birthday: string;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface StorageStats {
  used: number;
  quota: number;
  remaining: number;
  usagePercent: number;
  formattedUsed: string;
  formattedQuota: string;
  formattedRemaining: string;
}
