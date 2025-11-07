/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowsClockwise,
  Swap,
  TrendUp,
  TrendDown,
  CurrencyDollar,
  Calculator,
  Clock,
  Star,
  X,
  Info
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ExchangeRate {
  pair: string;
  rate: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  region: 'africa' | 'asia' | 'europe' | 'north-america' | 'south-america' | 'oceania' | 'middle-east';
}

interface CurrencyConverterProps {
  exchangeRates: ExchangeRate[];
  onRefreshRates: () => Promise<void>;
  isRefreshing: boolean;
  favoriteRates: string[];
  onToggleFavorite: (pair: string) => void;
  onClose?: () => void;
}

const COUNTRY_DATA = [
  { code: 'GH', name: 'Ghana', currency: 'GHS', phoneCode: '+233', flag: '🇬🇭', symbol: '₵' },
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
];

// Define pinned countries for real-time API calls
const pinnedCountries = ['GHS', 'NGN', 'KES', 'ZAR', 'EGP', 'EUR', 'GBP', 'JPY', 'CNY', 'KRW', 'INR', 'PHP'];

const getCurrencyInfoByCode = (currencyCode: string) => {
  return COUNTRY_DATA.find(c => c.currency === currencyCode);
};

interface ConversionResult {
  fromAmount: number;
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  inverseRate: number;
  lastUpdated: string;
  change: number;
  changePercent: number;
}

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  exchangeRates,
  onRefreshRates,
  isRefreshing,
  favoriteRates,
  onToggleFavorite,
  onClose
}) => {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('GHS');
  const [amount, setAmount] = useState('1000');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [recentConversions, setRecentConversions] = useState<ConversionResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  // Get available currencies from exchange rates
  const availableCurrencies = React.useMemo(() => COUNTRY_DATA.map(c => c.currency).filter((value, index, self) => self.indexOf(value) === index).sort(), []);

  const getCurrencyFlag = (currency: string) => getCurrencyInfoByCode(currency)?.flag || '🌍';
  const getCurrencySymbolLocal = (currency: string) => getCurrencyInfoByCode(currency)?.symbol || currency;

  // Find exchange rate between two currencies
  const findExchangeRate = (from: string, to: string): ExchangeRate | null => {
    if (from === to) return null;

    // Direct pair
    let rate = exchangeRates.find(r => r.pair === `${from}/${to}`);
    if (rate) return rate;

    // Inverse pair
    rate = exchangeRates.find(r => r.pair === `${to}/${from}`);
    if (rate) {
      return {
        ...rate,
        pair: `${from}/${to}`,
        rate: 1 / rate.rate,
        change: -rate.change,
        changePercent: -rate.changePercent
      };
    }

    // Cross-currency calculation via USD
    if (from !== 'USD' && to !== 'USD') {
      const fromUsdRate = exchangeRates.find(r => r.pair === `USD/${from}` || r.pair === `${from}/USD`);
      const toUsdRate = exchangeRates.find(r => r.pair === `USD/${to}` || r.pair === `${to}/USD`);

      if (fromUsdRate && toUsdRate) {
        const fromRate = fromUsdRate.pair === `USD/${from}` ? fromUsdRate.rate : 1 / fromUsdRate.rate;
        const toRate = toUsdRate.pair === `USD/${to}` ? toUsdRate.rate : 1 / toUsdRate.rate;

        return {
          pair: `${from}/${to}`,
          rate: toRate / fromRate,
          change: 0, // Simplified for cross-currency
          changePercent: 0,
          lastUpdated: new Date().toISOString(),
          region: 'africa' // Default region
        };
      }
    }

    return null;
  };

  // Check if a currency is pinned (real-time)
  const isPinnedCurrency = (currency: string): boolean => {
    return pinnedCountries.includes(currency);
  };

  // Perform currency conversion
  const performConversion = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsCalculating(true);
    
    try {
      // Simulate API delay for live rates
      setRefreshCount(prev => prev + 1);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const rate = findExchangeRate(fromCurrency, toCurrency);
      
      if (!rate) {
        toast.error(`Exchange rate not available for ${fromCurrency}/${toCurrency}`);
        return;
      }

      const fromAmount = parseFloat(amount);
      const toAmount = fromAmount * rate.rate;
      
      const conversionResult: ConversionResult = {
        fromAmount,
        toAmount,
        fromCurrency,
        toCurrency,
        rate: rate.rate,
        inverseRate: 1 / rate.rate,
        lastUpdated: rate.lastUpdated,
        change: rate.change,
        changePercent: rate.changePercent
      };
      
      setResult(conversionResult);
      
      // Add to recent conversions
      setRecentConversions(prev => {
        const updated = [conversionResult, ...prev.filter(r => 
          !(r.fromCurrency === fromCurrency && r.toCurrency === toCurrency)
        )];
        return updated.slice(0, 5); // Keep only last 5
      });
      
      toast.success('Conversion completed successfully');
    } catch (error) {
      toast.error('Conversion failed. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  // Swap currencies
  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    
    // Clear result to force recalculation
    setResult(null);
  };

  // Auto-convert when amount or currencies change
  useEffect(() => {
    if (amount && parseFloat(amount) > 0 && fromCurrency && toCurrency) {
      const timer = setTimeout(() => {
        performConversion();
      }, 800); // Debounce conversion
      
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCurrency, toCurrency, amount, exchangeRates]);

  // Quick amount buttons
  const quickAmounts = [100, 500, 1000, 5000, 10000];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calculator className="h-6 w-6 text-primary" weight="duotone" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Currency Converter</h2>
            <p className="text-muted-foreground">Live exchange rates & instant conversion</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Converter */}
      <Card className="card-hover-glass overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <CurrencyDollar className="h-5 w-5 text-primary" weight="duotone" />
            Live Currency Conversion
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Amount</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="text-xl font-semibold h-14"
              min="0"
              step="0.01"
            />
            
            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="text-xs"
                >
                  {quickAmount.toLocaleString()}
                </Button>
              ))}
            </div>
          </div>

          {/* Currency Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            {/* From Currency */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                From
                {isPinnedCurrency(fromCurrency) ? (
                  <div className="relative group">
                    <Info className="h-4 w-4 text-green-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      This is 0 milliseconds ago
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      This is not a real-time
                    </div>
                  </div>
                )}
              </label>
              <div className="relative">
                <select
                  value={fromCurrency}
                  onChange={(e) => setFromCurrency(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg text-lg font-semibold bg-background appearance-none cursor-pointer hover:border-primary transition-fast"
                >
                  {availableCurrencies.map((currency) => ( // Use availableCurrencies from COUNTRY_DATA
                    <option key={currency} value={currency}>
                      {getCurrencyFlag(currency)} {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center md:justify-start mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={swapCurrencies}
                className="h-10 w-10 p-0 rounded-full hover:scale-110 transition-fast"
              >
                <Swap className="h-4 w-4" weight="bold" />
              </Button>
            </div>

            {/* To Currency */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                To
                {isPinnedCurrency(toCurrency) ? (
                  <div className="relative group">
                    <Info className="h-4 w-4 text-green-600 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      This is 0 milliseconds ago
                    </div>
                  </div>
                ) : (
                  <div className="relative group">
                    <Info className="h-4 w-4 text-gray-400 cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      This is not a real-time
                    </div>
                  </div>
                )}
              </label>
              <div className="relative">
                <select
                  value={toCurrency}
                  onChange={(e) => setToCurrency(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg text-lg font-semibold bg-background appearance-none cursor-pointer hover:border-primary transition-fast"
                >
                  {availableCurrencies.map((currency) => ( // Use availableCurrencies from COUNTRY_DATA
                    <option key={currency} value={currency}>
                      {getCurrencyFlag(currency)} {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Conversion Result */}
          {result && (
            <div className="space-y-4 p-6 bg-muted/20 rounded-lg border">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">
                  {getCurrencyFlag(result.toCurrency)} {result.toAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2, // Use getCurrencySymbolLocal here
                    maximumFractionDigits: 6
                  })} {result.toCurrency}
                </div>
                <div className="text-muted-foreground">
                  {getCurrencyFlag(result.fromCurrency)} {result.fromAmount.toLocaleString()} {result.fromCurrency}
                </div>
              </div>

              <Separator />

              {/* Rate Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exchange Rate:</span>
                    <span className="font-semibold">1 {getCurrencySymbolLocal(result.fromCurrency)}{result.fromCurrency} = {result.rate.toFixed(6)} {getCurrencySymbolLocal(result.toCurrency)}{result.toCurrency}
                      1 {result.fromCurrency} = {result.rate.toFixed(6)} {result.toCurrency}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inverse Rate:</span>
                    <span className="font-semibold">1 {getCurrencySymbolLocal(result.toCurrency)}{result.toCurrency} = {result.inverseRate.toFixed(6)} {getCurrencySymbolLocal(result.fromCurrency)}{result.fromCurrency}
                      1 {result.toCurrency} = {result.inverseRate.toFixed(6)} {result.fromCurrency}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">24h Change:</span>
                    <div className={`flex items-center font-semibold ${
                      result.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.changePercent >= 0 ? (
                        <TrendUp className="h-4 w-4 mr-1" />
                      ) : (
                        <TrendDown className="h-4 w-4 mr-1" />
                      )}
                      {result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <div className="flex items-center text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(result.lastUpdated).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Favorite Toggle */}
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFavorite(`${result.fromCurrency}/${result.toCurrency}`)}
                  className="gap-2"
                >
                  <Star 
                    className={`h-4 w-4 ${
                      favoriteRates.includes(`${result.fromCurrency}/${result.toCurrency}`)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-muted-foreground'
                    }`} 
                    weight={favoriteRates.includes(`${result.fromCurrency}/${result.toCurrency}`) ? "fill" : "regular"}
                  />
                  {favoriteRates.includes(`${result.fromCurrency}/${result.toCurrency}`) 
                    ? 'Remove from Favorites' 
                    : 'Add to Favorites'}
                </Button>
              </div>
            </div>
          )}

          {/* Calculate Button */}
          <Button
            onClick={performConversion}
            disabled={isCalculating || !amount || parseFloat(amount) <= 0}
            className="w-full h-12 text-lg font-semibold"
          >
            {isCalculating ? (
              <>
                <ArrowsClockwise className="h-5 w-5 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <Calculator className="h-5 w-5 mr-2" />
                Convert Currency
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Conversions */}
      {recentConversions.length > 0 && (
        <Card className="card-hover-enhanced">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentConversions.map((conversion, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/10 rounded-lg hover:bg-muted/20 transition-fast cursor-pointer"
                  onClick={() => {
                    setFromCurrency(conversion.fromCurrency);
                    setToCurrency(conversion.toCurrency);
                    setAmount(conversion.fromAmount.toString()); // Use getCurrencySymbolLocal here
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm">{getCurrencySymbolLocal(conversion.fromCurrency)}
                      {getCurrencyFlag(conversion.fromCurrency)} {conversion.fromAmount.toLocaleString()} {conversion.fromCurrency}
                    </div>
                    <div className="text-muted-foreground">→</div>
                    <div className="text-sm font-semibold">
                      {getCurrencyFlag(conversion.toCurrency)} {conversion.toAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 4
                      })} {conversion.toCurrency}
                    </div>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    Rate: {conversion.rate.toFixed(4)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CurrencyConverter;