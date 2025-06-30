export type User = {
  walletAddress?: string;
  username?: string;
  profilePictureUrl?: string;
  permissions?: {
    notifications: boolean;
    contacts: boolean;
  };
  optedIntoOptionalAnalytics?: boolean;
};

export type DeviceProperties = {
  safeAreaInsets?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  deviceOS?: string;
  SporranAppVersion?: number;
};