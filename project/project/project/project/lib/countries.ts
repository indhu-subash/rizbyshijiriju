export interface CountryOption {
  code: string;
  name: string;
  region: 'Middle East' | 'Asia-Pacific' | 'Europe' | 'North America' | 'Rest of World';
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'IN', name: 'India', region: 'Rest of World', flag: '🇮🇳' },
  { code: 'AE', name: 'United Arab Emirates', region: 'Middle East', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', region: 'Middle East', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', region: 'Middle East', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait', region: 'Middle East', flag: '🇰🇼' },
  { code: 'OM', name: 'Oman', region: 'Middle East', flag: '🇴🇲' },
  { code: 'BH', name: 'Bahrain', region: 'Middle East', flag: '🇧🇭' },

  { code: 'US', name: 'United States', region: 'North America', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', region: 'North America', flag: '🇨🇦' },
  { code: 'MX', name: 'Mexico', region: 'North America', flag: '🇲🇽' },

  { code: 'GB', name: 'United Kingdom', region: 'Europe', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', region: 'Europe', flag: '🇩🇪' },
  { code: 'FR', name: 'France', region: 'Europe', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', region: 'Europe', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', region: 'Europe', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', region: 'Europe', flag: '🇳🇱' },
  { code: 'IE', name: 'Ireland', region: 'Europe', flag: '🇮🇪' },
  { code: 'CH', name: 'Switzerland', region: 'Europe', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', region: 'Europe', flag: '🇸🇪' },
  { code: 'BE', name: 'Belgium', region: 'Europe', flag: '🇧🇪' },
  { code: 'AT', name: 'Austria', region: 'Europe', flag: '🇦🇹' },
  { code: 'DK', name: 'Denmark', region: 'Europe', flag: '🇩🇰' },
  { code: 'NO', name: 'Norway', region: 'Europe', flag: '🇳🇴' },
  { code: 'FI', name: 'Finland', region: 'Europe', flag: '🇫🇮' },

  { code: 'SG', name: 'Singapore', region: 'Asia-Pacific', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', region: 'Asia-Pacific', flag: '🇲🇾' },
  { code: 'AU', name: 'Australia', region: 'Asia-Pacific', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', region: 'Asia-Pacific', flag: '🇳🇿' },
  { code: 'JP', name: 'Japan', region: 'Asia-Pacific', flag: '🇯🇵' },
  { code: 'TH', name: 'Thailand', region: 'Asia-Pacific', flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam', region: 'Asia-Pacific', flag: '🇻🇳' },
  { code: 'PH', name: 'Philippines', region: 'Asia-Pacific', flag: '🇵🇭' },
  { code: 'KR', name: 'South Korea', region: 'Asia-Pacific', flag: '🇰🇷' },
];

export const INTERNATIONAL_COUNTRIES = COUNTRIES.filter((c) => c.code !== 'IN');

export function isIndia(countryCodeOrName?: string): boolean {
  if (!countryCodeOrName) return true;
  const c = countryCodeOrName.trim().toUpperCase();
  return c === 'IN' || c === 'IND' || c === 'INDIA';
}

export function getCountryByCode(code?: string): CountryOption | undefined {
  if (!code) return undefined;
  const clean = code.trim().toLowerCase();
  return COUNTRIES.find(
    (c) => c.code.toLowerCase() === clean || c.name.toLowerCase() === clean
  );
}
