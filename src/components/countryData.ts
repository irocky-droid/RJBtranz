export interface CountryInfo {
  code: string;
  name: string;
  currency: string;
  phoneCode: string;
  flag: string;
  symbol: string;
}

export const COUNTRY_DATA: CountryInfo[] = [
  // West African CFA franc (XOF)
  { code: 'BJ', name: 'Benin', currency: 'XOF', phoneCode: '+229', flag: '🇧🇯', symbol: 'CFA' },
  { code: 'BF', name: 'Burkina Faso', currency: 'XOF', phoneCode: '+226', flag: '🇧🇫', symbol: 'CFA' },
  { code: 'CI', name: 'Côte d\'Ivoire', currency: 'XOF', phoneCode: '+225', flag: '🇨🇮', symbol: 'CFA' },
  { code: 'GW', name: 'Guinea-Bissau', currency: 'XOF', phoneCode: '+245', flag: '🇬🇼', symbol: 'CFA' },
  { code: 'ML', name: 'Mali', currency: 'XOF', phoneCode: '+223', flag: '🇲🇱', symbol: 'CFA' },
  { code: 'NE', name: 'Niger', currency: 'XOF', phoneCode: '+227', flag: '🇳🇪', symbol: 'CFA' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', phoneCode: '+221', flag: '🇸🇳', symbol: 'CFA' },
  { code: 'TG', name: 'Togo', currency: 'XOF', phoneCode: '+228', flag: '🇹🇬', symbol: 'CFA' },
  // Central African CFA franc (XAF)
  { code: 'CM', name: 'Cameroon', currency: 'XAF', phoneCode: '+237', flag: '🇨🇲', symbol: 'CFA' },
  { code: 'CF', name: 'Central African Republic', currency: 'XAF', phoneCode: '+236', flag: '🇨🇫', symbol: 'CFA' },
  { code: 'TD', name: 'Chad', currency: 'XAF', phoneCode: '+235', flag: '🇹🇩', symbol: 'CFA' },
  { code: 'CG', name: 'Congo', currency: 'XAF', phoneCode: '+242', flag: '🇨🇬', symbol: 'CFA' },
  { code: 'GQ', name: 'Equatorial Guinea', currency: 'XAF', phoneCode: '+240', flag: '🇬🇶', symbol: 'CFA' },
  { code: 'GA', name: 'Gabon', currency: 'XAF', phoneCode: '+243', flag: '🇬🇦', symbol: 'CFA' },
  // Other African Countries
  { code: 'DZ', name: 'Algeria', currency: 'DZD', phoneCode: '+213', flag: '🇩🇿', symbol: 'DA' },
  { code: 'AO', name: 'Angola', currency: 'AOA', phoneCode: '+244', flag: '🇦🇴', symbol: 'Kz' },
  { code: 'BW', name: 'Botswana', currency: 'BWP', phoneCode: '+267', flag: '🇧🇼', symbol: 'P' },
  { code: 'BI', name: 'Burundi', currency: 'BIF', phoneCode: '+257', flag: '🇧🇮', symbol: 'FBu' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', phoneCode: '+233', flag: '🇬🇭', symbol: '₵' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', phoneCode: '+234', flag: '🇳🇬', symbol: '₦' },
  { code: 'KE', name: 'Kenya', currency: 'KES', phoneCode: '+254', flag: '🇰🇪', symbol: 'KSh' },
  { code: 'PH', name: 'Philippines', currency: 'PHP', phoneCode: '+63', flag: '🇵🇭', symbol: '₱' },
  { code: 'IN', name: 'India', currency: 'INR', phoneCode: '+91', flag: '🇮🇳', symbol: '₹' },
  { code: 'US', name: 'United States', currency: 'USD', phoneCode: '+1', flag: '🇺🇸', symbol: '$' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', phoneCode: '+44', flag: '🇬🇧', symbol: '£' },
  { code: 'CA', name: 'Canada', currency: 'CAD', phoneCode: '+1', flag: '🇨🇦', symbol: 'C$' },
  { code: 'AU', name: 'Australia', currency: 'AUD', phoneCode: '+61', flag: '🇦🇺', symbol: 'A$' },
  { code: 'DE', name: 'Germany', currency: 'EUR', phoneCode: '+49', flag: '🇩🇪', symbol: '€' },
  { code: 'JP', name: 'Japan', currency: 'JPY', phoneCode: '+81', flag: '🇯🇵', symbol: '¥' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', phoneCode: '+41', flag: '🇨🇭', symbol: 'CHF' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', phoneCode: '+27', flag: '🇿🇦', symbol: 'R' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', phoneCode: '+971', flag: '🇦🇪', symbol: 'د.إ' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', phoneCode: '+966', flag: '🇸🇦', symbol: '﷼' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', phoneCode: '+20', flag: '🇪🇬', symbol: 'E£' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', phoneCode: '+52', flag: '🇲🇽', symbol: 'Mex$' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', phoneCode: '+55', flag: '🇧🇷', symbol: 'R$' },
  { code: 'CN', name: 'China', currency: 'CNY', phoneCode: '+86', flag: '🇨🇳', symbol: '¥' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', phoneCode: '+46', flag: '🇸🇪', symbol: 'kr' },
  { code: 'NO', name: 'Norway', currency: 'NOK', phoneCode: '+47', flag: '🇳🇴', symbol: 'kr' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', phoneCode: '+45', flag: '🇩🇰', symbol: 'kr' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', phoneCode: '+65', flag: '🇸🇬', symbol: 'S$' },
  { code: 'HK', name: 'Hong Kong', currency: 'HKD', phoneCode: '+852', flag: '🇭🇰', symbol: 'HK$' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', phoneCode: '+64', flag: '🇳🇿', symbol: 'NZ$' },
  { code: 'TH', name: 'Thailand', currency: 'THB', phoneCode: '+66', flag: '🇹🇭', symbol: '฿' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', phoneCode: '+60', flag: '🇲🇾', symbol: 'RM' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR', phoneCode: '+62', flag: '🇮🇩', symbol: 'Rp' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR', phoneCode: '+92', flag: '🇵🇰', symbol: '₨' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT', phoneCode: '+880', flag: '🇧🇩', symbol: '৳' },
  { code: 'LK', name: 'Sri Lanka', currency: 'LKR', phoneCode: '+94', flag: '🇱🇰', symbol: 'Rs' },
  { code: 'NP', name: 'Nepal', currency: 'NPR', phoneCode: '+977', flag: '🇳🇵', symbol: '₨' },
  { code: 'VN', name: 'Vietnam', currency: 'VND', phoneCode: '+84', flag: '🇻🇳', symbol: '₫' },
  { code: 'TR', name: 'Turkey', currency: 'TRY', phoneCode: '+90', flag: '🇹🇷', symbol: '₺' },
  { code: 'RU', name: 'Russia', currency: 'RUB', phoneCode: '+7', flag: '🇷🇺', symbol: '₽' },
  { code: 'PL', name: 'Poland', currency: 'PLN', phoneCode: '+48', flag: '🇵🇱', symbol: 'zł' },
  { code: 'CZ', name: 'Czech Republic', currency: 'CZK', phoneCode: '+420', flag: '🇨🇿', symbol: 'Kč' },
  { code: 'HU', name: 'Hungary', currency: 'HUF', phoneCode: '+36', flag: '🇭🇺', symbol: 'Ft' },
  { code: 'RO', name: 'Romania', currency: 'RON', phoneCode: '+40', flag: '🇷🇴', symbol: 'lei' },
  { code: 'BG', name: 'Bulgaria', currency: 'BGN', phoneCode: '+359', flag: '🇧🇬', symbol: 'лв' },
  { code: 'HR', name: 'Croatia', currency: 'HRK', phoneCode: '+385', flag: '🇭🇷', symbol: 'kn' },
  { code: 'RS', name: 'Serbia', currency: 'RSD', phoneCode: '+381', flag: '🇷🇸', symbol: 'дин' },
  { code: 'UA', name: 'Ukraine', currency: 'UAH', phoneCode: '+380', flag: '🇺🇦', symbol: '₴' },
  { code: 'KZ', name: 'Kazakhstan', currency: 'KZT', phoneCode: '+7', flag: '🇰🇿', symbol: '₸' },
  { code: 'UZ', name: 'Uzbekistan', currency: 'UZS', phoneCode: '+998', flag: '🇺🇿', symbol: 'сум' },
  { code: 'AZ', name: 'Azerbaijan', currency: 'AZN', phoneCode: '+994', flag: '🇦🇿', symbol: '₼' },
  { code: 'GE', name: 'Georgia', currency: 'GEL', phoneCode: '+995', flag: '🇬🇪', symbol: '₾' },
  { code: 'AM', name: 'Armenia', currency: 'AMD', phoneCode: '+374', flag: '🇦🇲', symbol: '֏' },
  { code: 'KG', name: 'Kyrgyzstan', currency: 'KGS', phoneCode: '+996', flag: '🇰🇬', symbol: 'с' },
  { code: 'TJ', name: 'Tajikistan', currency: 'TJS', phoneCode: '+992', flag: '🇹🇯', symbol: 'ЅМ' },
  { code: 'TM', name: 'Turkmenistan', currency: 'TMT', phoneCode: '+993', flag: '🇹🇲', symbol: 'm' },
  { code: 'BY', name: 'Belarus', currency: 'BYN', phoneCode: '+375', flag: '🇧🇾', symbol: 'Br' },
  { code: 'MD', name: 'Moldova', currency: 'MDL', phoneCode: '+373', flag: '🇲🇩', symbol: 'L' },
  { code: 'AL', name: 'Albania', currency: 'ALL', phoneCode: '+355', flag: '🇦🇱', symbol: 'L' },
  { code: 'BA', name: 'Bosnia and Herzegovina', currency: 'BAM', phoneCode: '+387', flag: '🇧🇦', symbol: 'KM' },
  { code: 'MK', name: 'North Macedonia', currency: 'MKD', phoneCode: '+389', flag: '🇲🇰', symbol: 'ден' },
  { code: 'ME', name: 'Montenegro', currency: 'EUR', phoneCode: '+382', flag: '🇲🇪', symbol: '€' },
  { code: 'XK', name: 'Kosovo', currency: 'EUR', phoneCode: '+383', flag: '🇽🇰', symbol: '€' },
  { code: 'IS', name: 'Iceland', currency: 'ISK', phoneCode: '+354', flag: '🇮🇸', symbol: 'kr' },
  { code: 'IE', name: 'Ireland', currency: 'EUR', phoneCode: '+353', flag: '🇮🇪', symbol: '€' },
  { code: 'PT', name: 'Portugal', currency: 'EUR', phoneCode: '+351', flag: '🇵🇹', symbol: '€' },
  { code: 'ES', name: 'Spain', currency: 'EUR', phoneCode: '+34', flag: '🇪🇸', symbol: '€' },
  { code: 'FR', name: 'France', currency: 'EUR', phoneCode: '+33', flag: '🇫🇷', symbol: '€' },
  { code: 'IT', name: 'Italy', currency: 'EUR', phoneCode: '+39', flag: '🇮🇹', symbol: '€' },
  { code: 'BE', name: 'Belgium', currency: 'EUR', phoneCode: '+32', flag: '🇧🇪', symbol: '€' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', phoneCode: '+31', flag: '🇳🇱', symbol: '€' },
  { code: 'LU', name: 'Luxembourg', currency: 'EUR', phoneCode: '+352', flag: '🇱🇺', symbol: '€' },
  { code: 'AT', name: 'Austria', currency: 'EUR', phoneCode: '+43', flag: '🇦🇹', symbol: '€' },
  { code: 'GR', name: 'Greece', currency: 'EUR', phoneCode: '+30', flag: '🇬🇷', symbol: '€' },
  { code: 'CY', name: 'Cyprus', currency: 'EUR', phoneCode: '+357', flag: '🇨🇾', symbol: '€' },
  { code: 'MT', name: 'Malta', currency: 'EUR', phoneCode: '+356', flag: '🇲🇹', symbol: '€' },
  { code: 'FI', name: 'Finland', currency: 'EUR', phoneCode: '+358', flag: '🇫🇮', symbol: '€' },
  { code: 'EE', name: 'Estonia', currency: 'EUR', phoneCode: '+372', flag: '🇪🇪', symbol: '€' },
  { code: 'LV', name: 'Latvia', currency: 'EUR', phoneCode: '+371', flag: '🇱🇻', symbol: '€' },
  { code: 'LT', name: 'Lithuania', currency: 'EUR', phoneCode: '+370', flag: '🇱🇹', symbol: '€' },
  { code: 'SK', name: 'Slovakia', currency: 'EUR', phoneCode: '+421', flag: '🇸🇰', symbol: '€' },
  { code: 'SI', name: 'Slovenia', currency: 'EUR', phoneCode: '+386', flag: '🇸🇮', symbol: '€' },
  { code: 'AD', name: 'Andorra', currency: 'EUR', phoneCode: '+376', flag: '🇦🇩', symbol: '€' },
  { code: 'SM', name: 'San Marino', currency: 'EUR', phoneCode: '+378', flag: '🇸🇲', symbol: '€' },
  { code: 'VA', name: 'Vatican City', currency: 'EUR', phoneCode: '+379', flag: '🇻🇦', symbol: '€' },
  { code: 'MC', name: 'Monaco', currency: 'EUR', phoneCode: '+377', flag: '🇲🇨', symbol: '€' },
  { code: 'LI', name: 'Liechtenstein', currency: 'CHF', phoneCode: '+423', flag: '🇱🇮', symbol: 'CHF' },
  { code: 'GI', name: 'Gibraltar', currency: 'GBP', phoneCode: '+350', flag: '🇬🇮', symbol: '£' },
  { code: 'IM', name: 'Isle of Man', currency: 'GBP', phoneCode: '+44', flag: '🇮🇲', symbol: '£' },
  { code: 'JE', name: 'Jersey', currency: 'GBP', phoneCode: '+44', flag: '🇯🇪', symbol: '£' },
  { code: 'GG', name: 'Guernsey', currency: 'GBP', phoneCode: '+44', flag: '🇬🇬', symbol: '£' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', phoneCode: '+255', flag: '🇹🇿', symbol: 'TSh' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', phoneCode: '+256', flag: '🇺🇬', symbol: 'USh' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', phoneCode: '+260', flag: '🇿🇲', symbol: 'ZK' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'ZWL', phoneCode: '+263', flag: '🇿🇼', symbol: '$' },
];

export const COUNTRIES = [...COUNTRY_DATA];

export const getCountryInfoByCode = (code: string): CountryInfo | undefined => {
  return COUNTRY_DATA.find(c => c.code === code);
};

export const getCurrencyInfoByCode = (currencyCode: string): CountryInfo | undefined => {
  return COUNTRY_DATA.find(c => c.currency === currencyCode);
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return getCurrencyInfoByCode(currencyCode)?.symbol || currencyCode;
};

export const sortedCountryData = [...COUNTRY_DATA].sort((a, b) => {
  if (a.name === 'United States') return -1;
  if (b.name === 'United States') return 1;
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  return 0;
});