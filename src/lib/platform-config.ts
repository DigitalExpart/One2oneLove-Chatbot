// Platform Configuration for Frontend
// This allows different websites to use the same chatbot with different branding

export interface PlatformConfig {
  platformKey: string;
  name: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    gradient: string;
    logo?: string;
  };
}

// Default platform configuration
export const defaultPlatformConfig: PlatformConfig = {
  platformKey: 'one2onelove',
  name: 'One2One Love',
  branding: {
    primaryColor: '#ec4899',
    secondaryColor: '#8b5cf6',
    gradient: 'from-pink-500 to-purple-600',
  },
};

// Get platform configuration from environment or use default
export function getPlatformConfig(): PlatformConfig {
  const platformKey = process.env.NEXT_PUBLIC_PLATFORM_KEY || 'one2onelove';
  const platformName = process.env.NEXT_PUBLIC_PLATFORM_NAME || 'One2One Love';
  const primaryColor = process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#ec4899';
  const secondaryColor = process.env.NEXT_PUBLIC_SECONDARY_COLOR || '#8b5cf6';
  const gradient = process.env.NEXT_PUBLIC_GRADIENT || 'from-pink-500 to-purple-600';

  return {
    platformKey,
    name: platformName,
    branding: {
      primaryColor,
      secondaryColor,
      gradient,
    },
  };
}

// Example configurations for different platforms
export const platformConfigs: Record<string, PlatformConfig> = {
  one2onelove: {
    platformKey: 'one2onelove',
    name: 'One2One Love',
    branding: {
      primaryColor: '#ec4899',
      secondaryColor: '#8b5cf6',
      gradient: 'from-pink-500 to-purple-600',
    },
  },
  couplesconnect: {
    platformKey: 'couplesconnect',
    name: 'Couples Connect',
    branding: {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      gradient: 'from-blue-500 to-purple-600',
    },
  },
  lovetogether: {
    platformKey: 'lovetogether',
    name: 'Love Together',
    branding: {
      primaryColor: '#f59e0b',
      secondaryColor: '#ef4444',
      gradient: 'from-orange-500 to-red-500',
    },
  },
};

