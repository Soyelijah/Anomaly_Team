export interface CountryClock {
  id: string;
  country: string;
  flag: string;
  timeZone: string;
  utcOffsetLabel: string;
}

export const COMMUNITY_COUNTRIES: CountryClock[] = [
  {
    id: 'server',
    country: 'Server Smash MU',
    flag: '🌐',
    timeZone: 'UTC',
    utcOffsetLabel: 'UTC+0',
  },
  {
    id: 'ar',
    country: 'Argentina',
    flag: '🇦🇷',
    timeZone: 'America/Argentina/Buenos_Aires',
    utcOffsetLabel: 'UTC-3',
  },
  {
    id: 'cl',
    country: 'Chile',
    flag: '🇨🇱',
    timeZone: 'America/Santiago',
    utcOffsetLabel: 'UTC-3',
  },
  {
    id: 'pe',
    country: 'Perú',
    flag: '🇵🇪',
    timeZone: 'America/Lima',
    utcOffsetLabel: 'UTC-5',
  },
  {
    id: 'co',
    country: 'Colombia',
    flag: '🇨🇴',
    timeZone: 'America/Bogota',
    utcOffsetLabel: 'UTC-5',
  },
  {
    id: 'mx',
    country: 'México',
    flag: '🇲🇽',
    timeZone: 'America/Mexico_City',
    utcOffsetLabel: 'UTC-6',
  },
  {
    id: 'es',
    country: 'España',
    flag: '🇪🇸',
    timeZone: 'Europe/Madrid',
    utcOffsetLabel: 'UTC+1',
  },
  {
    id: 'br',
    country: 'Brasil',
    flag: '🇧🇷',
    timeZone: 'America/Sao_Paulo',
    utcOffsetLabel: 'UTC-3',
  },
  {
    id: 'uy',
    country: 'Uruguay',
    flag: '🇺🇾',
    timeZone: 'America/Montevideo',
    utcOffsetLabel: 'UTC-3',
  },
  {
    id: 've',
    country: 'Venezuela',
    flag: '🇻🇪',
    timeZone: 'America/Caracas',
    utcOffsetLabel: 'UTC-4',
  },
  {
    id: 'bo',
    country: 'Bolivia',
    flag: '🇧🇴',
    timeZone: 'America/La_Paz',
    utcOffsetLabel: 'UTC-4',
  },
  {
    id: 'ec',
    country: 'Ecuador',
    flag: '🇪🇨',
    timeZone: 'America/Guayaquil',
    utcOffsetLabel: 'UTC-5',
  },
  {
    id: 'us',
    country: 'Estados Unidos (EST)',
    flag: '🇺🇸',
    timeZone: 'America/New_York',
    utcOffsetLabel: 'UTC-5',
  },
];

/**
 * Detect user's timezone, country name, flag and current formatted time
 */
export function getDetectedUserLocation(): {
  timeZone: string;
  countryName: string;
  cityName: string;
  flag: string;
  utcOffsetLabel: string;
} {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Calculate UTC offset
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone }));
  const diffMinutes = Math.round((tzDate.getTime() - utcDate.getTime()) / 60000);
  const diffHours = diffMinutes / 60;
  const sign = diffHours >= 0 ? '+' : '';
  const utcOffsetLabel = `UTC${sign}${diffHours % 1 === 0 ? diffHours : diffHours.toFixed(1)}`;

  // Parse city name
  const parts = timeZone.split('/');
  const rawCity = parts.length > 1 ? parts[parts.length - 1].replace(/_/g, ' ') : timeZone;

  // Detect country
  let countryName = 'Tu Ubicación';
  let flag = '📍';

  if (timeZone.startsWith('America/Argentina')) {
    countryName = 'Argentina';
    flag = '🇦🇷';
  } else if (timeZone.includes('Santiago')) {
    countryName = 'Chile';
    flag = '🇨🇱';
  } else if (timeZone.includes('Lima')) {
    countryName = 'Perú';
    flag = '🇵🇪';
  } else if (timeZone.includes('Bogota')) {
    countryName = 'Colombia';
    flag = '🇨🇴';
  } else if (
    timeZone.includes('Mexico_City') ||
    timeZone.includes('Cancun') ||
    timeZone.includes('Monterrey') ||
    timeZone.includes('Tijuana') ||
    timeZone.includes('Chihuahua')
  ) {
    countryName = 'México';
    flag = '🇲🇽';
  } else if (timeZone.startsWith('Europe/Madrid')) {
    countryName = 'España';
    flag = '🇪🇸';
  } else if (timeZone.startsWith('America/Sao_Paulo') || timeZone.startsWith('America/Belem')) {
    countryName = 'Brasil';
    flag = '🇧🇷';
  } else if (timeZone.includes('Montevideo')) {
    countryName = 'Uruguay';
    flag = '🇺🇾';
  } else if (timeZone.includes('Caracas')) {
    countryName = 'Venezuela';
    flag = '🇻🇪';
  } else if (timeZone.includes('La_Paz')) {
    countryName = 'Bolivia';
    flag = '🇧🇴';
  } else if (timeZone.includes('Asuncion')) {
    countryName = 'Paraguay';
    flag = '🇵🇾';
  } else if (timeZone.includes('Guayaquil')) {
    countryName = 'Ecuador';
    flag = '🇪🇨';
  } else if (
    timeZone.startsWith('America/New_York') ||
    timeZone.startsWith('America/Chicago') ||
    timeZone.startsWith('America/Los_Angeles') ||
    timeZone.startsWith('America/Denver')
  ) {
    countryName = 'Estados Unidos';
    flag = '🇺🇸';
  }

  return {
    timeZone,
    countryName,
    cityName: rawCity,
    flag,
    utcOffsetLabel,
  };
}

/**
 * Format a Date object in a specific timezone
 */
export function formatTimeInZone(date: Date, timeZone: string): string {
  try {
    return date.toLocaleTimeString('es-ES', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return date.toUTCString().slice(17, 25);
  }
}

/**
 * Format date in a specific timezone
 */
export function formatDateInZone(date: Date, timeZone: string): string {
  try {
    return date.toLocaleDateString('es-ES', {
      timeZone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return date.toDateString();
  }
}

/**
 * Convert a UTC hour (e.g. 20 for Castle Siege at 20:00 UTC) to user's local hour string
 */
export function convertUtcHourToLocal(utcHour: number, userTimeZone?: string): string {
  const targetTz = userTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const now = new Date();
  // Build a date today at utcHour:00 UTC
  const testDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), utcHour, 0, 0));
  return testDate.toLocaleTimeString('es-ES', {
    timeZone: targetTz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
