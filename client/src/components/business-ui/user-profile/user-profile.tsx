'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  fetchUserProfile,
  getAssetsUrl,
} from '@client/src/components/business-ui/api/user-profiles/service';
import { ErrorImage } from '@client/src/components/business-ui/user-profile/error-image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { UserInput } from '@client/src/components/business-ui/types/user';

declare global {
  // 运行环境标识（可根据需要扩展实际取值范围）
  var ENVIRONMENT: 'staging' | 'local' | 'production' | string;
}

interface UserProfileProps {
  readonly value?: string | UserInput;
  readonly userId?: string | undefined;
  readonly user_id?: string | undefined;
  readonly accountType?: 'platform' | undefined;
}

type BaseUserProfileProps = BaseSimpleProfileProps | BaseOfficialProfileProps;

const ACCOUNT_STATUS = {
  UNSPECIFIED: 0,
  Inactive: 1,
  Active: 2,
  Disabled: 3,
  Terminated: 4,
  NotJoined: 5,
  Resigned: 6,
} as const;
type AccountStatus = (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];

const AccountStatusMap: Record<AccountStatus, string> = {
  [ACCOUNT_STATUS.UNSPECIFIED]: '',
  [ACCOUNT_STATUS.Active]: '已启用',
  [ACCOUNT_STATUS.Inactive]: '未激活',
  [ACCOUNT_STATUS.Disabled]: '已停用',
  [ACCOUNT_STATUS.Terminated]: '已停用',
  [ACCOUNT_STATUS.NotJoined]: '未激活',
  [ACCOUNT_STATUS.Resigned]: '已停用',
};

interface BaseSimpleProfileProps {
  readonly useProfileCard: false;
  readonly userProfileInfo: {
    readonly name?: string;
    readonly avatar?: string;
    readonly email?: string;
    //
    readonly userStatus: AccountStatus;
    readonly userType: '_employee' | '_externalUser';
  };
}

interface BaseOfficialProfileProps {
  readonly useProfileCard: true;
  readonly profileCardParam: {
    readonly needRedirect?: boolean;
    readonly redirectURL?: string;
    readonly appId?: string;
    readonly jsAPITicket?: string;
    readonly openId?: string;
    readonly targetOpenId?: string;
  };
}

export interface WithCommonResponse<T> {
  data: T;
}

function normalizeIdCardData(data: BaseUserProfileProps): BaseUserProfileProps {
  if (data.useProfileCard && !data.profileCardParam) {
    return {
      useProfileCard: false,
      userProfileInfo: {
        userStatus: ACCOUNT_STATUS.UNSPECIFIED,
        userType: '_employee',
        name: '用户信息不可用',
      },
    };
  }
  return data;
}

function UserProfile(props: UserProfileProps) {
  const { value, userId: originUserId, user_id, accountType = 'platform' } = props;

  const userId =
    (typeof value === 'string'
      ? value
      : (value as any)?.user_id || (value as any)?.userId) ||
    user_id ||
    originUserId;

  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [response, setResponse] = useState<BaseUserProfileProps>(
    () => ({
      useProfileCard: false,
      userProfileInfo: {
        userStatus: ACCOUNT_STATUS.UNSPECIFIED,
        userType: '_employee',
        name: '用户信息加载中',
      },
    }),
  );
  const [error, setError] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;

    const controller = new AbortController();

    setLoading(true);
    setError(false);

    try {
      const data = await fetchUserProfile(userId, accountType, controller.signal);
      if (data.useProfileCard && data.profileCardParam?.needRedirect) {
        if (data.profileCardParam.redirectURL) {
          globalThis.location.replace(data.profileCardParam.redirectURL);
          return;
        }

        setResponse({
          useProfileCard: false,
          userProfileInfo: {
            userStatus: ACCOUNT_STATUS.UNSPECIFIED,
            userType: '_employee',
            name: '用户信息不可用',
          },
        });
      } else {
        setResponse(normalizeIdCardData(data as BaseUserProfileProps));
      }
      setLoading(false);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 忽略请求终止
      } else {
        setError(true);
        setLoading(false);
      }
    }
  }, [userId, accountType]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (error) {
    return (
      <Card
        ref={cardRef}
        className="flex min-h-124 w-80 flex-col items-center justify-center gap-4 border-0 p-0"
      >
        <ErrorImage />
        <div>
          <span className="text-sm">加载失败 请</span>
          <Button
            size="sm"
            variant="ghost"
            className="pr-1 pl-1 text-primary! not-disabled:hover:bg-primary/10 not-disabled:hover:text-primary/90 focus-visible:bg-primary/20"
            onClick={fetchData}
          >
            重试
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      ref={cardRef}
      className="flex h-130 w-80 flex-col items-center justify-center gap-6 border-0 p-0"
    >
      {loading ? <LoadingComponent /> : <BaseUserProfile {...response} />}
    </Card>
  );
}

function LoadingComponent() {
  return <Spinner className="size-8 animate-spin text-primary" />;
}

function BaseUserProfile(props: BaseUserProfileProps) {
  const { useProfileCard } = props;
  if (!useProfileCard) {
    const { userProfileInfo } = props as BaseSimpleProfileProps;
    return <SimpleUserProfile userProfileInfo={userProfileInfo} />;
  }

  const { profileCardParam } = props as BaseOfficialProfileProps;
  if (!profileCardParam) {
    return (
      <SimpleUserProfile
        userProfileInfo={{
          name: '用户信息不可用',
          userStatus: ACCOUNT_STATUS.UNSPECIFIED,
          userType: '_employee',
        }}
      />
    );
  }

  const { needRedirect, redirectURL } = profileCardParam;
  if (needRedirect && redirectURL) {
    globalThis.location.replace(redirectURL);
    return null;
  }

  return (
    <SimpleUserProfile
      userProfileInfo={{
        name: '用户信息不可用',
        userStatus: ACCOUNT_STATUS.UNSPECIFIED,
        userType: '_employee',
      }}
    />
  );
}

function SimpleUserProfile(props: {
  readonly userProfileInfo: BaseSimpleProfileProps['userProfileInfo'];
}) {
  const { userProfileInfo } = props;

  return (
    <Card className="flex w-80 flex-col gap-0 overflow-hidden border-0 p-0">
      <div className="relative h-34 w-full">
        <img
          src={getAssetsUrl(
            '/obj/eden-cn/lm-zhhwh/ljhwZthlaukjlkulzlp/ui/bg.png',
          )}
          alt="cover"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          width={320}
          height={112}
        />
      </div>

      <CardContent className="h-96 w-80 pt-0 pr-4 pb-4 pl-4">
        <div className="relative">
          <Avatar className="absolute left-0 size-22.5 -translate-y-1/2 border-2 border-background">
            <AvatarImage
              src={userProfileInfo.avatar}
              alt={userProfileInfo.name}
            />
            <AvatarFallback>{userProfileInfo.name?.at(0)}</AvatarFallback>
          </Avatar>

          <div className="pt-13.5">
            <div className="flex items-center gap-2 pt-0.5 pb-1.5 leading-tight font-semibold">
              <span className="text-xl">{userProfileInfo.name}</span>
              {userProfileInfo.userType === '_externalUser' && (
                <Badge className="rounded-sm border-0 bg-blue-500/20 pt-px pr-1.5 pb-px pl-1 text-sm text-blue-900">
                  外部
                </Badge>
              )}
              {AccountStatusMap[userProfileInfo.userStatus] !== '' && (
                <Badge className="rounded-sm border-0 bg-foreground/10 pt-px pr-1.5 pb-px pl-1 text-sm text-foreground">
                  {AccountStatusMap[userProfileInfo.userStatus]}
                </Badge>
              )}
            </div>
            {userProfileInfo.email && (
              <div className="mt-6 grid grid-cols-[84px_1fr] gap-y-3 text-sm">
                <div className="text-muted-foreground">邮箱</div>
                <div>
                  <a
                    className="break-all text-primary underline-offset-4 hover:underline"
                    href={`mailto:${userProfileInfo.email ?? ''}`}
                  >
                    {userProfileInfo.email}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { UserProfile };
