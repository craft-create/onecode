import { axiosForBackend } from '../utils/getAxiosForBackend';

export type AccountType = 'lark' | 'apaas';

export interface I18nText {
  zh_cn?: string;
  en_us?: string;
  ja_jp?: string;
}

interface AppUserProfileRequest {
  userId: string;
  nickname: string;
  avatarUrl?: string;
}

const DEFAULT_PAGE_SIZE = 100;
const INTERNAL_PREFIX = 'internal-user';
const EXTERNAL_PREFIX = 'external-user';

export interface SearchAvatar {
  avatar: {
    image: {
      large: string;
    };
  };
}

export interface DepartmentInfo {
  departmentID: string;
  larkDepartmentID: string;
  name: I18nText;
}

export interface ChatInfo {
  chatID: string;
  avatar: string;
  isExternal?: boolean;
  userCount?: number;
  name: I18nText;
}

export interface UserInfo {
  userID: string;
  larkUserID?: string;
  name: I18nText | string;
  avatar?: SearchAvatar['avatar'];
  email?: string;
  status?: number;
  userType?: '_employee' | '_externalUser' | '_anonymousUser';
  tenantName?: string;
  department?: {
    id?: string;
    departmentID?: string;
    name: I18nText;
  };
}

export interface UserProfileData {
  useLarkCard: boolean;
  userProfileInfo?: {
    name?: string;
    avatar?: string;
    email?: string;
    userStatus: number;
    userType: '_employee' | '_externalUser';
  };
  larkCardParam?: {
    needRedirect?: boolean;
    redirectURL?: string;
    larkAppID: string;
    jsAPITicket: string;
    larkOpenID: string;
    targetLarkOpenID: string;
  };
}

export interface SearchUsersParams {
  query: string;
  pageSize?: number;
  searchExternalContact?: boolean;
}

export interface SearchUsersResponse {
  data: {
    userList: (UserInfo & SearchAvatar)[];
    total?: number;
    hasMore?: boolean;
  };
}

export interface BatchGetUsersResponse {
  data: {
    userInfoMap: Record<string, UserInfo>;
  };
}

export interface ConvertExternalContactResponse {
  data: {
    userInfo: UserInfo;
  };
}

export interface SearchDepartmentsParams {
  query: string;
  pageSize?: number;
}

export interface SearchDepartmentsResponse {
  data: {
    departmentList: DepartmentInfo[];
    total?: number;
  };
}

export interface SearchChatsParams {
  query: string;
  pageSize?: number;
}

export interface SearchChatsResponse {
  data: {
    result: {
      chatResult: {
        items: ChatInfo[];
      };
    };
  };
}

export interface BatchGetChatsResponse {
  data: {
    chatInfoMap: Record<string, ChatInfo>;
  };
}

const toDisplayName = (value: string): string => {
  return value.trim() || '未命名用户';
};

const normalizeText = (value?: string | I18nText): I18nText | string | undefined => {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  return {
    zh_cn: value.zh_cn,
    en_us: value.en_us,
    ja_jp: value.ja_jp,
  };
};

const isTextMatch = (name: string, query: string): boolean => {
  if (!query) return true;
  const target = query.toLowerCase();
  return name.toLowerCase().includes(target);
};

const fakeDepartments: DepartmentInfo[] = [
  {
    departmentID: 'dept-100',
    larkDepartmentID: 'ld-100',
    name: { zh_cn: '创意组', en_us: 'Creative' },
  },
  {
    departmentID: 'dept-200',
    larkDepartmentID: 'ld-200',
    name: { zh_cn: '制作组', en_us: 'Production' },
  },
  {
    departmentID: 'dept-300',
    larkDepartmentID: 'ld-300',
    name: { zh_cn: '运营组', en_us: 'Operations' },
  },
];

const fakeChats: ChatInfo[] = [
  {
    chatID: 'chat-100',
    avatar: '',
    isExternal: false,
    userCount: 20,
    name: { zh_cn: '项目讨论群', en_us: 'Project Discussion' },
  },
  {
    chatID: 'chat-200',
    avatar: '',
    isExternal: false,
    userCount: 8,
    name: { zh_cn: '拍摄对接群', en_us: 'Shoot Coordination' },
  },
  {
    chatID: 'chat-300',
    avatar: '',
    isExternal: true,
    userCount: 12,
    name: { zh_cn: '外部协作群', en_us: 'External Collaboration' },
  },
];

const externalUserMap = new Map<string, string>();

const makeFallbackUserInfo = (source: {
  userID: string;
  larkUserID?: string;
  name: string;
  email?: string;
  userType?: '_employee' | '_externalUser' | '_anonymousUser';
  department?: DepartmentInfo;
  tenantName?: string;
}): UserInfo => {
  return {
    userID: source.userID,
    larkUserID: source.larkUserID,
    name: normalizeText(source.name) ?? source.name,
    email: source.email,
    userType: source.userType ?? '_employee',
    avatar: {
      image: {
        large: '',
      },
    },
    department: source.department
      ? {
          id: source.department.departmentID,
          departmentID: source.department.departmentID,
          name: source.department.name,
        }
      : undefined,
    tenantName: source.tenantName,
    status: 1,
  };
};

const createUnknownUserInfo = (id: string): UserInfo => {
  const name = `未知用户 ${id}`;
  return {
    userID: id,
    name: normalizeText(name) as string,
    userType: '_anonymousUser',
    avatar: {
      image: {
        large: '',
      },
    },
    status: 0,
  };
};

const toUserProfilePayload = (user: {
  userId: string;
  nickname?: string;
  avatarUrl?: string;
}): UserProfileData => {
  return {
    useLarkCard: false,
    userProfileInfo: {
      name: user.nickname || '未命名用户',
      avatar: user.avatarUrl || '',
      email: undefined,
      userStatus: 2,
      userType: '_employee',
    },
  };
};

async function fetchMeUser(): Promise<AppUserProfileRequest | null> {
  try {
    const response = await axiosForBackend<AppUserProfileRequest | null>({
      method: 'GET',
      url: '/api/auth/me',
    });
    return response.data;
  } catch {
    return null;
  }
}

const filterByQuery = <T extends { name: I18nText | string }>(
  list: T[],
  query: string,
): T[] => {
  if (!query) {
    return list;
  }
  const keyword = query.toLowerCase();
  return list.filter((item) => {
    const text = normalizeText(item.name);
    const display = typeof text === 'string' ? text : text?.zh_cn ?? '';
    return isTextMatch(display, keyword);
  });
};

export class UserProfileService {
  async getUserProfile(
    userId: string,
    _accountType: AccountType = 'apaas',
    _signal?: AbortSignal,
  ): Promise<UserProfileData> {
    const me = await fetchMeUser();
    if (me && me.userId) {
      return toUserProfilePayload({
        userId: me.userId,
        nickname: me.nickname,
        avatarUrl: me.avatarUrl,
      });
    }

    return toUserProfilePayload({
      userId,
      nickname: userId ? `用户 ${userId}` : '访客',
      avatarUrl: '',
    });
  }

  getAssetsUrl(path: string): string {
    if (!path) return '';
    if (/^https?:\/\//.test(path)) return path;
    if (typeof window === 'undefined') return path;
    return `${window.location.origin}${path.startsWith('/') ? '' : '/'}${path}`;
  }
}

export class UserService {
  async searchUsers(params: SearchUsersParams): Promise<SearchUsersResponse> {
    const query = params.query?.trim() ?? '';
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
    const me = await fetchMeUser();
    const userName =
      (me && toDisplayName(me.nickname)) || '当前用户';
    const searchSeed: UserInfo[] = me?.userId
      ? [makeFallbackUserInfo({
          userID: me.userId,
          name: userName,
          email: me.nickname,
          userType: '_employee',
          department: fakeDepartments[0],
        })]
      : [];

    const list = query
      ? filterByQuery(searchSeed.concat([
          makeFallbackUserInfo({
            userID: `${INTERNAL_PREFIX}-a`,
            larkUserID: `${EXTERNAL_PREFIX}-a`,
            name: '示例用户A',
            email: 'sample-a@example.com',
          }),
          makeFallbackUserInfo({
            userID: `${INTERNAL_PREFIX}-b`,
            larkUserID: `${EXTERNAL_PREFIX}-b`,
            name: '示例用户B',
            email: 'sample-b@example.com',
            userType: '_externalUser',
            tenantName: '示例租户',
          }),
        ]), query)
      : searchSeed.concat([
          makeFallbackUserInfo({
            userID: `${INTERNAL_PREFIX}-a`,
            larkUserID: `${EXTERNAL_PREFIX}-a`,
            name: '示例用户A',
            email: 'sample-a@example.com',
          }),
          makeFallbackUserInfo({
            userID: `${INTERNAL_PREFIX}-b`,
            larkUserID: `${EXTERNAL_PREFIX}-b`,
            name: '示例用户B',
            email: 'sample-b@example.com',
            userType: '_externalUser',
            tenantName: '示例租户',
          }),
        ]);

    return {
      data: {
        userList: list.slice(0, pageSize).map((item) => ({
          ...(item as UserInfo),
          avatar: item.avatar as SearchAvatar['avatar'],
        })),
        total: list.length,
        hasMore: false,
      },
    };
  }

  async listUsersByIds(userIds: string[]): Promise<BatchGetUsersResponse> {
    const me = await fetchMeUser();
    const map: Record<string, UserInfo> = {};
    const ids = [...new Set(userIds.map((id) => String(id).trim()).filter(Boolean))];

    for (const id of ids) {
      if (externalUserMap.has(id)) {
        const userId = externalUserMap.get(id);
        if (userId) {
          map[id] = createUnknownUserInfo(userId);
          map[userId] = map[id];
        }
        continue;
      }

      if (me?.userId && id === me.userId) {
        map[id] = makeFallbackUserInfo({
          userID: me.userId,
          name: me.nickname || '当前用户',
          userType: '_employee',
          email: `${me.nickname}@local.example`,
          department: fakeDepartments[0],
        });
        continue;
      }
      if (id.startsWith(EXTERNAL_PREFIX + '-')) {
        const converted = createUnknownUserInfo(id.replace(`${EXTERNAL_PREFIX}-`, ''));
        map[id] = converted;
        continue;
      }

      map[id] = createUnknownUserInfo(id);
    }

    return {
      data: {
        userInfoMap: map,
      },
    };
  }

  async convertExternalContact(larkUserID: string): Promise<ConvertExternalContactResponse> {
    const normalized = String(larkUserID || '').trim();
    const convertedId = `user-${normalized}`;
    externalUserMap.set(normalized, convertedId);
    const userInfo = makeFallbackUserInfo(convertedId);
    userInfo.userType = '_externalUser';
    userInfo.name = `${toDisplayName(normalized)}（已开户）`;
    userInfo.larkUserID = normalized;

    return {
      data: {
        userInfo,
      },
    };
  }
}

export class DepartmentService {
  async searchDepartments(
    params: SearchDepartmentsParams,
  ): Promise<SearchDepartmentsResponse> {
    const list = filterByQuery(
      fakeDepartments,
      params.query?.trim() ?? '',
    );
    return {
      data: {
        departmentList: list.slice(0, params.pageSize ?? DEFAULT_PAGE_SIZE),
        total: list.length,
      },
    };
  }
}

export class ChatService {
  async searchChats(params: SearchChatsParams): Promise<SearchChatsResponse> {
    const list = filterByQuery(fakeChats, params.query?.trim() ?? '');
    return {
      data: {
        result: {
          chatResult: {
            items: list.slice(0, params.pageSize ?? DEFAULT_PAGE_SIZE),
          },
        },
      },
    };
  }

  async listChatsByIds(chatIds: string[]): Promise<BatchGetChatsResponse> {
    const map: Record<string, ChatInfo> = {};
    const idSet = new Set(chatIds.map((id) => String(id).trim()).filter(Boolean));

    for (const chatId of idSet) {
      const existed = fakeChats.find((item) => item.chatID === chatId);
      if (existed) {
        map[chatId] = existed;
      }
    }

    return { data: { chatInfoMap: map } };
  }
}

export function getAssetsUrl(path: string): string {
  return new UserProfileService().getAssetsUrl(path);
}
