import { useEffect, useState } from 'react';
import type { AxiosResponse } from 'axios';

import { axiosForBackend } from '../utils/getAxiosForBackend';

export interface CurrentUserProfile {
  userID: string;
  userId?: string;
  larkUserID?: string;
  name?: {
    zh_cn?: string;
    en_us?: string;
  };
  avatar?: {
    image?: {
      large?: string;
    };
  };
  userType?: '_employee' | '_externalUser';
}

type AuthMeResponse = {
  userId: string;
  nickname: string;
  avatarUrl?: string;
};

function toUserProfile(result: AxiosResponse<AuthMeResponse | null>): CurrentUserProfile | null {
  const data: AuthMeResponse | null = result.data;
  if (!data || !data.userId) {
    return null;
  }

  const { userId, nickname, avatarUrl } = data;
  return {
    userID: userId,
    userId,
    larkUserID: '',
    name: {
      zh_cn: nickname,
      en_us: nickname,
    },
    avatar: {
      image: {
        large: avatarUrl,
      },
    },
    userType: '_employee',
  };
}

export const useCurrentUserProfile = (): CurrentUserProfile | null => {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await axiosForBackend<AuthMeResponse | null>({
          url: '/api/auth/me',
          method: 'GET',
        });

        if (!cancelled) {
          setProfile(toUserProfile(result));
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return profile;
};
