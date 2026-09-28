import prisma from '../config/db';

export interface ShippingCalculationParams {
  country?: string;
  pincode?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  district?: string;
}

export interface ShippingResult {
  available: boolean;
  country: string;
  shippingCharge: number;
  currency: string;
  estimate: string;
  destination: {
    country: string;
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
  };
  source: 'automatic' | 'admin' | 'international-region';
  error?: string;
}

export interface CountryInfo {
  code: string;
  name: string;
  region: 'Middle East' | 'Asia-Pacific' | 'Europe' | 'North America' | 'Rest of World';
  flag: string;
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
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

export const REGIONAL_RATES: Record<CountryInfo['region'], { charge: number; estimate: string }> = {
  'Middle East': { charge: 1450, estimate: '5–8 working days' },
  'Asia-Pacific': { charge: 1650, estimate: '6–10 working days' },
  'Europe': { charge: 1750, estimate: '7–10 working days' },
  'North America': { charge: 1850, estimate: '7–12 working days' },
  'Rest of World': { charge: 2200, estimate: '8–14 working days' },
};

export function isIndiaCountry(country?: string): boolean {
  if (!country) return true;
  const c = country.trim().toUpperCase();
  return c === 'IN' || c === 'IND' || c === 'INDIA';
}

export function findCountry(countryInput?: string): CountryInfo | null {
  if (!countryInput) return null;
  const clean = countryInput.trim().toLowerCase();
  return (
    SUPPORTED_COUNTRIES.find(
      (c) => c.code.toLowerCase() === clean || c.name.toLowerCase() === clean
    ) || null
  );
}

/**
 * Calculate India Shipping Charge based on pincode & regional rules
 */
export async function calculateIndiaShipping(pincode: string): Promise<ShippingResult> {
  const cleanPincode = pincode.trim();

  if (!cleanPincode || cleanPincode.length !== 6 || isNaN(Number(cleanPincode))) {
    return {
      available: false,
      country: 'IN',
      shippingCharge: 0,
      currency: 'INR',
      estimate: '',
      destination: { country: 'India', postalCode: cleanPincode },
      source: 'automatic',
      error: 'Please enter a valid 6-digit Indian pincode.',
    };
  }

  // 1. Check Prisma ShippingRule first (Admin Override)
  const rule = await prisma.shippingRule.findUnique({
    where: { pincode: cleanPincode },
  });

  if (rule) {
    return {
      available: true,
      country: 'IN',
      shippingCharge: rule.shippingCharge,
      currency: 'INR',
      estimate: '2–4 working days',
      destination: {
        country: 'India',
        postalCode: cleanPincode,
      },
      source: 'admin',
    };
  }

  // 2. Deterministic Indian regional rate defaults based on origin 695308 (Trivandrum, Kerala)
  const prefix2 = Number(cleanPincode.substring(0, 2));
  let shippingCharge = 99;
  let estimate = '4–6 working days';
  let inferredState = 'Rest of India';

  // Kerala prefix: 67, 68, 69
  if (prefix2 === 67 || prefix2 === 68 || prefix2 === 69) {
    shippingCharge = 79;
    estimate = '2–4 working days';
    inferredState = 'Kerala';
  }
  // South India: Tamil Nadu (60-64), Karnataka (56-59), Andhra/Telangana (50-53), Puducherry (60)
  else if ((prefix2 >= 50 && prefix2 <= 64) || prefix2 === 60) {
    shippingCharge = 89;
    estimate = '3–5 working days';
    inferredState = 'South India';
  }

  // 3. Optional Postal API Lookup for City / District / State metadata
  let fetchedCity = '';
  let fetchedDistrict = '';
  let fetchedState = inferredState;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second max timeout
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        fetchedCity = po.Name || po.Block || po.District || '';
        fetchedDistrict = po.District || '';
        fetchedState = po.State || fetchedState;
      }
    }
  } catch (err) {
    // Ignore external postal API timeouts or network errors gracefully
  }

  return {
    available: true,
    country: 'IN',
    shippingCharge,
    currency: 'INR',
    estimate,
    destination: {
      country: 'India',
      city: fetchedCity,
      district: fetchedDistrict,
      state: fetchedState,
      postalCode: cleanPincode,
    },
    source: 'automatic',
  };
}

/**
 * Calculate International Shipping Charge based on Country & Region
 */
export function calculateInternationalShipping(params: ShippingCalculationParams): ShippingResult {
  const { country, postalCode = '', city = '', state = '' } = params;
  const countryInfo = findCountry(country);

  if (!countryInfo || countryInfo.code === 'IN') {
    return {
      available: false,
      country: country || 'Unknown',
      shippingCharge: 0,
      currency: 'INR',
      estimate: '',
      destination: {
        country: country || 'Unknown',
        city,
        state,
        postalCode,
      },
      source: 'international-region',
      error: 'International delivery is currently unavailable to this destination.',
    };
  }

  const rateConfig = REGIONAL_RATES[countryInfo.region] || REGIONAL_RATES['Rest of World'];

  return {
    available: true,
    country: countryInfo.code,
    shippingCharge: rateConfig.charge,
    currency: 'INR',
    estimate: rateConfig.estimate,
    destination: {
      country: countryInfo.name,
      city,
      state,
      postalCode,
    },
    source: 'international-region',
  };
}

/**
 * Unified Shipping Calculation Entrance Point
 */
export async function calculateShipping(params: ShippingCalculationParams): Promise<ShippingResult> {
  const { country, pincode, postalCode } = params;

  if (isIndiaCountry(country)) {
    const codeToUse = pincode || postalCode || '';
    return calculateIndiaShipping(codeToUse);
  }

  return calculateInternationalShipping(params);
}
