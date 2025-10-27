/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  X,
  TrendUp,
  TrendDown,
  Upload,
  Download,
  CalendarBlank,
  Clock,
  CheckCircle,
  XCircle,
  CurrencyDollar,
  Funnel,
  MagnifyingGlass,
  FloppyDisk,
  ArrowRight,
  Eye,
  Plus,
  Lightning,
  Lock,
  ShieldCheck,
  CaretRight,
  CaretLeft,
  Printer,
  Receipt,
  ArrowsClockwise
} from '@phosphor-icons/react';
import { toast } from "sonner";import { useKV } from '@/hooks/useKVWithFallback';
import { COUNTRY_DATA, getCountryInfoByCode, getCurrencySymbol, sortedCountryData } from './countryData';

interface Transaction {
  id: string;
  clientName: string;
  clientEmail: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  receiptPrinted: boolean;
  phoneNumber: string;
  transactionType: 'send' | 'receive';
  uniqueId: string;
  formatId: string;
  uniqueCode: string;
}

interface ExchangeRate {
  pair: string;
  rate: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
}

interface CountryInfo {
  flag: string;
  name: string;
  currency: string;
  pair: string;
  rate: ExchangeRate;
  region: string;
}

interface CountryModalProps {
  country: CountryInfo;
  transactions: Transaction[];
  exchangeRates: ExchangeRate[];
  countries: CountryInfo[];
  onClose: () => void;
  onSendMoney: (currency: string) => void;
  onReceiveMoney: (currency: string) => void;
  onTransactionCreated?: (transaction: Transaction) => void;
  onTransactionUpdated?: (transaction: Transaction) => void;
  showCreateInvoice?: boolean;
  onCreateInvoice?: () => void;
}

interface UserProfile {
  displayName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  role: string;
  joinDate: string;
  lastActive: string;
  profileImage?: string | null;
}


interface TransactionFormData {
  fullName: string;
  email: string;
  amount: string;
  currency: string;
  phoneNumber: string;
}

type ModalStep = 'overview' | 'send' | 'receive' | 'transaction-form' | 'pending-transactions' | 'receiver-info' | 'preview';

const CountryModal: React.FC<CountryModalProps> = ({
  country,
  transactions,
  exchangeRates,
  countries,
  onClose,
  onSendMoney,
  onReceiveMoney,
  onTransactionCreated,
  onTransactionUpdated,
  showCreateInvoice = false,
  onCreateInvoice,
}) => {
  const [timeFilter, setTimeFilter] = useState("24h");
  const [searchTerm, setSearchTerm] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [currentStep, setCurrentStep] = useState<ModalStep>('overview');
  const [transactionType, setTransactionType] = useState<'send' | 'receive'>('send');
  const [isCreating, setIsCreating] = useState(false);
  const [isSecuring, setIsSecuring] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    fullName: '',
    email: '',
    amount: '',
    currency: country.currency,
    phoneNumber: ''
  });

  const [userProfile] = useKV<UserProfile>('user-profile', {
    displayName: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    role: '',
    joinDate: '',
    lastActive: ''
  });

  const defaultSenderCurrency = React.useMemo(() => {
    if (userProfile?.location) {
      const countryName = userProfile.location.split(',')[1]?.trim();
      if (countryName) {
        const country = COUNTRY_DATA.find(c => c.name.toLowerCase() === countryName.toLowerCase());
        return country?.currency || 'GHS'; // Fallback to GHS
      }
    }
    return 'GHS'; // Default fallback
  }, [userProfile]);

  const [senderCurrency, setSenderCurrency] = useState<string>(defaultSenderCurrency);
  const [receiverCurrency, setReceiverCurrency] = useState<string>('USD');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Sync sender and receiver currencies when transaction type changes
  useEffect(() => {
    if (transactionType === 'send') {
      setSenderCurrency(defaultSenderCurrency);
      setReceiverCurrency(country.currency); // Dynamic based on selected country
    } else {
      setSenderCurrency(defaultSenderCurrency);
      setReceiverCurrency(country.currency); // Dynamic based on selected country
    }
    // Reset fee and D2D toggle when transaction type changes
    setCustomFee(null);
    setIsDollarToDollar(false);
    // Update formData currency to use sender's currency for send transactions
    setFormData(prev => ({
      ...prev,
      currency: transactionType === 'send' ? defaultSenderCurrency : country.currency
    }));
  }, [transactionType, defaultSenderCurrency, country.currency]);

  // Check if transaction is Dollar to Dollar
  useEffect(() => {
    const d2d = senderCurrency === 'USD' && receiverCurrency === 'USD';
    setIsDollarToDollar(d2d);
    // Reset custom fee when currencies change
    if (!d2d) {
      setCustomFee(null);
    }
  }, [senderCurrency, receiverCurrency]);
  const [receiverInfo, setReceiverInfo] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    country: '',
    currency: ''
  });
  const [customExchangeRate, setCustomExchangeRate] = useState<number | null>(null);
  const [customFee, setCustomFee] = useState<number | null>(null);
  const [isDollarToDollar, setIsDollarToDollar] = useState<boolean>(true); // Default to ON (charged)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'cancelled'>('all');

  // Manual refresh state
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState<string>('Just now');

  // Function to format time ago
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Update time ago every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(lastRefreshTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastRefreshTime]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    interface CustomWindow extends Window {
      refreshExchangeRates?: () => Promise<void>;
    }

    setIsRefreshing(true);
    try {
      if ((window as CustomWindow).refreshExchangeRates) {
        await ((window as CustomWindow).refreshExchangeRates as () => Promise<void>)();
        setLastRefreshTime(Date.now());
      }
    } catch (error) {
      console.error('Failed to trigger global refresh:', error);
      toast.error('Failed to refresh rates. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Utility functions
  // List of unique currencies from available exchange rates with pinned currencies at top
  const availableCurrencies = useMemo(() => {
    const set = new Set<string>();
    exchangeRates.forEach(r => {
      const [base, target] = r.pair.split('/');
      set.add(base);
      set.add(target);
    });

    // Define pinned currencies in order of priority
    const pinnedCurrencies = [
      'USD', 'GHS', 'GBP', 'NGN', 'MXN', 'AED', 'SAR', 'ZAR', 'BRL',
      'EUR', 'XOF', 'XAF' // Added Euro and CFA currencies
    ];

    const allCurrencies = Array.from(set);
    const pinned = allCurrencies.filter(c => pinnedCurrencies.includes(c));
    const unpinned = allCurrencies.filter(c => !pinnedCurrencies.includes(c)).sort();

    return [...pinned, ...unpinned];
  }, [exchangeRates]);

  // Compute exchange rate for any currency pair, with USD cross fallback
  const getRateForPair = (from: string, to: string): number => {
    if (from === to) return 1;
    // direct match
    const direct = exchangeRates.find(r => r.pair === `${from}/${to}`);
    if (direct) return direct.rate;
    // inverse
    const inverse = exchangeRates.find(r => r.pair === `${to}/${from}`);
    if (inverse) return 1 / inverse.rate;
    // cross via USD
    const fromUsd = exchangeRates.find(r => r.pair === `USD/${from}` || r.pair === `${from}/USD`);
    const toUsd = exchangeRates.find(r => r.pair === `USD/${to}` || r.pair === `${to}/USD`);
    if (fromUsd && toUsd) {
      const f = fromUsd.pair === `USD/${from}` ? fromUsd.rate : 1 / fromUsd.rate;
      const t = toUsd.pair === `USD/${to}` ? toUsd.rate : 1 / toUsd.rate;
      return t / f;
    }
    // fallback to currently viewed country's rate
    return country.rate.rate;
  };

  // Get all available countries sorted alphabetically by country name
  const allCountries = useMemo(() => {
    // Create countries from exchange rates data
    const countriesFromRates = exchangeRates.map(rate => {
      const currency = rate.pair.split('/')[1];
      const countryInfo = getCountryInfoByCode(currency);
      return {
        flag: countryInfo?.flag || '🌍',
        name: countryInfo?.name || 'International',
        currency: currency,
        pair: rate.pair,
        rate: rate,
        region: 'other' as const
      };
    });

    // Remove duplicates based on currency
    const uniqueCountries = countriesFromRates.filter((country, index, self) =>
      index === self.findIndex(c => c.currency === country.currency)
    );

    // Sort alphabetically by country name
    return uniqueCountries.sort((a, b) => a.name.localeCompare(b.name));
  }, [exchangeRates]);

  const generateUniqueCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'RJB';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateTransactionId = (currency: string, phoneNumber: string): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    
    // Extract last 3 digits from phone number
    const lastThreeDigits = phoneNumber.replace(/\D/g, '').slice(-3).padStart(3, '0');
    
    // Get transaction count (this would normally come from your database)
    const transactionCount = String((transactions.length + 1)).padStart(5, '0');
    
    const timestamp = `${day}${month}${hour}${minute}${second}`;
    
    return `${currency}-${lastThreeDigits}-${timestamp}-${transactionCount}`;
  };

  const handleSendClick = () => {
    setTransactionType('send');
    setCurrentStep('transaction-form');
  };

  const handleReceiveClick = () => {
    setTransactionType('receive');
    setCurrentStep('pending-transactions');
  };

  const handleFormChange = (field: keyof TransactionFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!formData.amount.trim() || parseFloat(formData.amount) <= 0) {
      toast.error("Valid amount is required");
      return false;
    }
    // Phone number is now optional
    return true;
  };

  const handleSaveTransaction = async (continueToNext = false) => {
    if (!validateForm()) return;

    setIsCreating(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const uniqueCode = generateUniqueCode();
      const formatId = generateTransactionId(formData.currency, formData.phoneNumber);
      
      // All transactions now have a 5% fee regardless of currency
      const calculatedFee = customFee !== null ? customFee : parseFloat(formData.amount) * 0.05;

      const newTransaction: Transaction = {
        id: `TXN-${Date.now()}`,
        clientName: formData.fullName,
        clientEmail: formData.email || '',
        amount: parseFloat(formData.amount),
        fromCurrency: senderCurrency,
        toCurrency: receiverCurrency,
        exchangeRate: country.rate.rate * 1.00,
        fee: calculatedFee,
        status: 'pending',
        createdAt: new Date().toISOString(),
        receiptPrinted: false,
        phoneNumber: formData.phoneNumber,
        transactionType: transactionType,
        uniqueId: uniqueCode,
        formatId: formatId,
        uniqueCode: uniqueCode
      };

      // Call the callback to add transaction to the main app
      if (onTransactionCreated) {
        onTransactionCreated(newTransaction);
      }

      toast.success(`Transaction saved as pending. Code: ${uniqueCode}`);
      toast.info(`Status: Pending - Awaiting receiver information`);
      
      if (continueToNext) {
        // For send transactions, go to receiver info, for receive transactions, no change
        if (transactionType === 'send') {
          // Set as selected transaction for receiver info flow
          setSelectedTransaction(newTransaction);
          setCurrentStep('receiver-info');
        } else {
          setCurrentStep('overview');
        }
      } else {
        // Close modal and return to overview
        onClose();
      }
    } catch (error) {
      toast.error("Failed to save transaction");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateTransaction = async () => {
    if (!validateForm()) return;

    setIsSecuring(true);
    
    try {
      // Simulate security connection
      toast.info("Securing connection...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Connection secured!");
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate codes
      const uniqueCode = generateUniqueCode();
      const formatId = generateTransactionId(formData.currency, formData.phoneNumber);
      
      // All transactions now have a 5% fee regardless of currency
      const calculatedFee = customFee !== null ? customFee : parseFloat(formData.amount) * 0.05;

      const newTransaction: Transaction = {
        id: `TXN-${Date.now()}`,
        clientName: formData.fullName,
        clientEmail: formData.email || '',
        amount: parseFloat(formData.amount),
        fromCurrency: senderCurrency,
        toCurrency: receiverCurrency,
        exchangeRate: country.rate.rate * 1.00,
        fee: calculatedFee,
        status: 'pending',
        createdAt: new Date().toISOString(),
        receiptPrinted: false,
        phoneNumber: formData.phoneNumber,
        transactionType: transactionType,
        uniqueId: uniqueCode,
        formatId: formatId,
        uniqueCode: uniqueCode
      };

      // Call the callback to add transaction to the main app
      if (onTransactionCreated) {
        onTransactionCreated(newTransaction);
      }

      toast.success(`Transaction created successfully!`);
      toast.info(`Unique Code: ${uniqueCode}`);
      toast.info(`Transaction ID: ${formatId}`);
      
      // Close modal after successful creation
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      toast.error("Failed to create transaction");
    } finally {
      setIsSecuring(false);
    }
  };

  const handleBackToOverview = () => {
    setCurrentStep('overview');
    setSelectedTransaction(null);
    setReceiverInfo({ fullName: '', email: '', phoneNumber: '', country: '', currency: '' });
    setStatusFilter('all');
    setFormData({
      fullName: '',
      email: '',
      amount: '',
      currency: country.currency,
      phoneNumber: ''
    });
  };

  const handleSelectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleContinueFromPending = () => {
    if (selectedTransaction) {
      setCurrentStep('receiver-info');
    }
  };

  const handleReceiverInfoChange = (field: keyof typeof receiverInfo, value: string) => {
    setReceiverInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateReceiverInfo = (): boolean => {
    if (!receiverInfo.fullName.trim()) {
      toast.error("Receiver full name is required");
      return false;
    }
    return true;
  };

  const handlePreview = () => {
    if (validateReceiverInfo()) {
      setCurrentStep('preview');
    }
  };

  const calculateReceivingAmount = (transaction: Transaction, selectedCurrency?: string): number => {
    const targetCurrency = selectedCurrency || transaction.toCurrency;
    const effectiveRate = customExchangeRate !== null
      ? customExchangeRate
      : getRateForPair(transaction.fromCurrency, targetCurrency);

    const amountToConvert = transaction.amount - transaction.fee; // Deduct fee before conversion
    return amountToConvert * effectiveRate; // Use the direct rate
  };

  // Filter transactions by time, country, and status
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(t => 
      t.fromCurrency === country.currency || 
      t.toCurrency === country.currency
    );

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply time filter
    const now = new Date();
    let cutoffDate: Date;

    if (showCustomDate && customDate) {
      cutoffDate = new Date(customDate);
    } else {
      switch (timeFilter) {
        case "6h":
          cutoffDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case "12h":
          cutoffDate = new Date(now.getTime() - 12 * 60 * 60 * 1000);
          break;
        case "24h":
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "48h":
          cutoffDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
          break;
        case "3d":
          cutoffDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          break;
        case "1w":
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "1m":
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
    }

    return filtered.filter(t => new Date(t.createdAt) >= cutoffDate);
  }, [transactions, country.currency, timeFilter, searchTerm, customDate, showCustomDate, statusFilter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const totalVolume = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalFees = filteredTransactions.reduce((sum, t) => sum + t.fee, 0);
  const completedCount = filteredTransactions.filter(t => t.status === 'completed').length;

  // Render pending transactions step
  const renderPendingTransactions = () => (
    <CardContent className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToOverview}
            className="h-10 w-10 p-0 hover:bg-muted"
          >
            <CaretLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="text-xl font-bold font-montserrat">
              Receive {country.currency}
            </h3>
            <p className="text-sm text-muted-foreground">
              Select a pending transaction to receive money
            </p>
          </div>
        </div>
        <div className="text-3xl animate-float">
          {country.flag}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 border border-muted">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 backdrop-blur-sm border border-muted-foreground/20 focus:border-primary/50 transition-all duration-300 h-12"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
              { value: 'cancelled', label: 'Cancelled' }
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(filter.value as any)}
                className="h-10 transition-all duration-300 hover:scale-105 text-sm"
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Time Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: "6h", label: "6h" },
              { value: "12h", label: "12h" },
              { value: "24h", label: "24h" },
              { value: "48h", label: "48h" },
              { value: "3d", label: "3d" },
              { value: "1w", label: "1w" },
              { value: "1m", label: "1m" }
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={timeFilter === filter.value && !showCustomDate ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setTimeFilter(filter.value);
                  setShowCustomDate(false);
                }}
                className="h-10 transition-all duration-300 hover:scale-105 text-sm"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Transaction List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold font-montserrat">
            Available Transactions ({filteredTransactions.length})
          </h4>
          <Badge variant="outline" className="font-montserrat border-primary/50 text-primary">
            {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
          </Badge>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {filteredTransactions.map((transaction, index) => (
              <Card 
                key={transaction.id} 
                className={`p-4 transition-all duration-200 cursor-pointer border-2 ${
                  selectedTransaction?.id === transaction.id 
                    ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]' 
                    : 'border-muted/50 hover:border-primary/30 hover:bg-muted/50 hover:shadow-md hover:scale-[1.01]'
                }`}
                onClick={() => handleSelectTransaction(transaction)}
                style={{animationDelay: `${index * 100}ms`}}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12 ring-2 ring-muted hover:ring-primary transition-all duration-300">
                    <AvatarFallback className="font-medium bg-gradient-to-br from-primary/10 to-accent/10">
                      {transaction.clientName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate font-montserrat">
                        {transaction.clientName}
                      </p>
                      <Badge className={`${getStatusColor(transaction.status)} flex-shrink-0`}>
                        {getStatusIcon(transaction.status)}
                        <span className="ml-1 capitalize">{transaction.status}</span>
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2 truncate font-montserrat">
                      {transaction.clientEmail}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <div className="font-semibold font-mono">
                          ${transaction.amount.toLocaleString()} {transaction.fromCurrency}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Receiving:</span>
                        <div className="font-semibold font-mono text-green-600">
                  {getCurrencySymbol(transaction.toCurrency)}{calculateReceivingAmount(transaction, receiverInfo.currency).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {transaction.toCurrency}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Type:</span>
                        <div className="capitalize">{transaction.transactionType}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <div className="font-mono text-xs">{new Date(transaction.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

                  {selectedTransaction?.id === transaction.id && (
                    <CheckCircle className="h-6 w-6 text-green-600 animate-pulse" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center bg-gradient-to-br from-muted/20 to-muted/30">
            <div className="space-y-4">
              <Download className="h-16 w-16 text-muted-foreground mx-auto animate-float" />
              <div>
                <h3 className="text-lg font-semibold font-montserrat">
                  No transactions found
                </h3>
                <p className="text-muted-foreground font-montserrat">
                  No transactions match your current filter criteria
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Continue Button */}
        {selectedTransaction && (
          <Button
            onClick={handleContinueFromPending}
            className="w-full h-12 bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 hover:from-green-700 hover:via-green-800 hover:to-emerald-800 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Continue with Selected Transaction
          </Button>
        )}
      </div>
    </CardContent>
  );

  // Render receiver info step
  const renderReceiverInfo = () => (
    <CardContent className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep('transaction-form')}
            className="h-10 w-10 p-0 hover:bg-muted"
          >
            <CaretLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="text-xl font-bold font-montserrat">
              Receiver Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter details for the money receiver
            </p>
          </div>
        </div>
        <div className="text-3xl animate-float">
          {country.flag}
        </div>
      </div>

      {/* Selected Transaction Summary */}
      {selectedTransaction && (
        <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Selected Transaction</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">From:</span>
                <div className="font-medium">{selectedTransaction.clientName}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Sending Amount:</span>
                <div className="font-mono text-blue-600 font-bold">
                  {getCurrencySymbol(selectedTransaction.fromCurrency)}
                  {selectedTransaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  {' '}{selectedTransaction.fromCurrency}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Receiving Amount:</span>
                <div className="font-mono text-green-600 font-bold">
                  {(() => {
                    const receivingAmount = calculateReceivingAmount(selectedTransaction, receiverInfo.currency);
                    return receivingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                  })()} {receiverInfo.currency || selectedTransaction.toCurrency}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="exchangeRate" className="text-muted-foreground">Exchange Rate:</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        interface CustomWindow extends Window {
                          refreshExchangeRates?: () => Promise<void>;
                        }
                        setIsRefreshing(true);
                        try {
                          if ((window as CustomWindow).refreshExchangeRates) {
                            await ((window as CustomWindow).refreshExchangeRates as () => Promise<void>)();
                            setLastRefreshTime(Date.now());
                            setCustomExchangeRate(null);
                          }
                        } catch (error) {
                          console.error('Failed to trigger global refresh:', error);
                          toast.error('Failed to refresh rates. Please try again.');
                        } finally {
                          setIsRefreshing(false);
                        }
                      }}
                      disabled={isRefreshing}
                      className="h-6 w-6 p-0 hover:bg-primary/10"
                      title="Refresh exchange rate"
                    >
                      <ArrowsClockwise className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                    <span className="text-xs text-muted-foreground">{timeAgo}</span>
                  </div>
                </div>
                <Input
                  id="exchangeRate"
                  type="number"
                  value={customExchangeRate ?? getRateForPair(selectedTransaction.fromCurrency, receiverInfo.currency || selectedTransaction.toCurrency).toFixed(3)}
                  onChange={(e) => {
                    const newRate = parseFloat(e.target.value);
                    setCustomExchangeRate(isNaN(newRate) ? null : newRate);
                  }}
                  step="0.001"
                  className="font-mono h-10 mt-1"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Receiver Form */}
      <div className="space-y-4">
        {/* Full Name - Mandatory */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Receiver Full Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={receiverInfo.fullName}
            onChange={(e) => handleReceiverInfoChange('fullName', e.target.value)}
            placeholder="Enter receiver's full name"
            className="h-12"
            required
          />
        </div>

        {/* Email - Optional */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Receiver Email <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            type="email"
            value={receiverInfo.email}
            onChange={(e) => handleReceiverInfoChange('email', e.target.value)}
            placeholder="Enter receiver's email address"
            className="h-12"
          />
        </div>

        {/* Country and Currency - Dropdown for selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              value={receiverInfo.country}
              onChange={(e) => {
                const selectedCountry = e.target.value;
                const selectedCountryInfo = sortedCountryData.find(c => c.name === selectedCountry);
                setReceiverInfo(prev => ({
                  ...prev,
                  country: selectedCountry,
                  currency: selectedCountryInfo?.currency || '' // Set currency based on selected country
                }));
              }}
              className="h-12 px-3 border rounded-md bg-muted/50 w-full"
            >
              <option value="">Select a country</option>
              {sortedCountryData.map((countryInfo) => (
                <option key={`country-${countryInfo.currency}`} value={countryInfo.name}>
                  {countryInfo.flag} {countryInfo.name} ({countryInfo.currency}) ({getCurrencySymbol(countryInfo.currency)})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Currency <span className="text-red-500">*</span>
            </label>
            <select
              value={receiverInfo.currency}
              onChange={(e) => setReceiverInfo(prev => ({ ...prev, currency: e.target.value }))}
              className="h-12 px-3 border rounded-md bg-muted/50 w-full"
            >
              <option value="">Select a currency</option> 
              {sortedCountryData.map(country => (
                <option key={country.currency} value={country.currency}>
                  {country.flag} {country.currency} ({country.symbol})
                </option>
              ))} 
            </select>
          </div>
        </div>

        {/* Phone Number - Optional */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Phone Number <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            type="tel"
            value={receiverInfo.phoneNumber}
            onChange={(e) => handleReceiverInfoChange('phoneNumber', e.target.value)}
            placeholder="Enter receiver's phone number"
            className="h-12"
          />
        </div>

      </div>

      {/* Preview Button */}
      <Button
        onClick={handlePreview}
        className="w-full h-14 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl floating-button text-lg font-semibold"
      >
        <div className="flex items-center gap-2">
          <span>Preview Transaction</span>
          <ArrowRight className="h-5 w-5" />
        </div>
      </Button>
    </CardContent>
  );

  // PDF Generation and Print Functions
  const generatePDF = async () => {
    try {
      // Import html2pdf dynamically
      const html2pdf = (await import('html2pdf.js')).default;

      const element = document.getElementById('receipt-preview');
      if (!element) {
        toast.error("Receipt preview not found");
        return;
      }

      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number], // top, left, bottom, right in inches
        filename: `RJB-TRANZ-Receipt_${selectedTransaction?.formatId || 'Unknown'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: {
          unit: 'in' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const
        }
      };

      await html2pdf().set(opt).from(element).save();
      toast.success("PDF saved successfully!");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Failed to generate PDF");
    }
  };

  const printReceipt = () => {
    try {
      const element = document.getElementById('receipt-preview');
      if (!element) {
        toast.error("Receipt preview not found");
        return;
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Please allow popups for printing");
        return;
      }

      // Copy styles
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)
              .join('');
          } catch (e) {
            return '';
          }
        })
        .join('');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title><strong className="font-bold">RJB TRANZ</strong> Receipt</title>
            <style>
              ${styles}
              @media print {
                body { margin: 0; }
                .no-print { display: none !important; }
              }
            </style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        toast.success("Sent to printer!");
      }, 500);

    } catch (error) {
      console.error('Print error:', error);
      toast.error("Failed to print receipt");
    }
  };

  // Render preview step
  const renderPreview = () => (
    <CardContent className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep('receiver-info')}
            className="h-10 w-10 p-0 hover:bg-muted"
          >
            <CaretLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="text-xl font-bold font-montserrat">
              Transaction Preview & Receipt
            </h3>
            <p className="text-sm text-muted-foreground">
              Review transaction details and generate receipt
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
              onClick={() => {}}
            className="h-10 w-10 p-0 hover:bg-blue-50 hover:border-blue-200 border border-blue-100 transition-all duration-300"
            title="Preview Sender Receipt"
          >
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="h-10 w-10 p-0 hover:bg-blue-50 hover:border-blue-200 border border-blue-100 transition-all duration-300"
              title="Preview Sender Receipt"
            >
              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </Button>
            <div className="text-3xl animate-float">
              {country.flag}
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Preview */}
      {selectedTransaction && (
        <div className="space-y-6">
          {/* Receipt Preview Container */}
          <div
            id="receipt-preview"
            className="bg-white border-2 border-orange-200 rounded-lg p-6 shadow-lg max-w-2xl mx-auto"
            style={{
              backgroundImage: `url(/src/assets/rjb-background.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: '#000',
              border: '3px solid #ea580c'
            }}
          >
            {/* Company Header */}
            <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <h2 className="text-lg font-semibold text-white">Transaction Summary</h2>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="space-y-4">
              {/* Transaction Header */}
              <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg">
                <p className="text-gray-800">
                  Hi, <strong className="text-2xl">{selectedTransaction.clientName}</strong>, you just sent{' '}
                  {selectedTransaction.amount.toFixed(2)} {selectedTransaction.fromCurrency} to {country.name}.
                </p>
                <br />
                <p className="text-gray-800">
                  <strong>Receiving Amount:</strong>{' '}
                  {receiverInfo.currency || selectedTransaction.toCurrency}{' '}
                  {calculateReceivingAmount(
                    selectedTransaction,
                    receiverInfo.currency
                  ).toFixed(2)}
                </p>
                <p className="text-gray-800">
                  <strong>Exchange rate:</strong> 1{' '}
                  {selectedTransaction.fromCurrency} ={' '}
                  {getRateForPair(
                    selectedTransaction.fromCurrency,
                    receiverInfo.currency || selectedTransaction.toCurrency
                  ).toFixed(4)}{' '}
                  {receiverInfo.currency || selectedTransaction.toCurrency}
                </p>
                <p className="text-gray-800">
                  <strong>Unique Code:</strong> {selectedTransaction.uniqueCode}
                </p>
              </div>

              {/* Footer */}
              <div className="text-center border-t border-gray-300 pt-4">
                <div className="mt-4 flex justify-center">
                  <div className="bg-gray-200 px-4 py-2 rounded-lg">
                    <p className="text-xs text-gray-800 font-medium">
                      Unique Code: {selectedTransaction.uniqueCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-4 border-t">
            {/* Print Receipt and Complete Transaction */}
            <Button
              onClick={async () => {
                setIsSecuring(true);
                try {
                  // Step 1: Show loading animation for 2 seconds
                  toast.info("Printing receipt and completing transaction...");
                  await new Promise(resolve => setTimeout(resolve, 2000));

                  // Step 2: Print the receipt
                  printReceipt();

                  // Step 3: Update transaction status to completed
                  const updatedTransaction = {
                    ...selectedTransaction,
                    status: 'completed' as const,
                    receiptPrinted: true
                  };

                  // Update existing transaction status
                  if (onTransactionUpdated) {
                    onTransactionUpdated(updatedTransaction);
                  } else if (onTransactionCreated) {
                    // Fallback to onTransactionCreated if onTransactionUpdated is not provided
                    onTransactionCreated(updatedTransaction);
                  }

                  // Step 4: Show success animation/screen
                  toast.success("Transaction completed successfully!");
                  toast.info(`Status updated: Pending → Completed`);

                  // Close modal after success
                  setTimeout(() => {
                    onClose();
                  }, 1000);
                } catch (error) {
                  toast.error("Failed to complete transaction");
                } finally {
                  setIsSecuring(false);
                }
              }}
              disabled={isSecuring}
              className="w-full h-14 bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 hover:from-green-700 hover:via-green-800 hover:to-emerald-800 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl floating-button text-lg font-semibold"
            >
              {isSecuring ? (
                <div className="flex items-center gap-3">
                  <Printer className="h-6 w-6 animate-pulse" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm">Printing Receipt...</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-xs opacity-80">Completing Transaction</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Printer className="h-6 w-6" />
                  <span>Print Receipt & Complete Transaction</span>
                  <CheckCircle className="h-5 w-5" />
                </div>
              )}
            </Button>

            <Button
              onClick={() => setCurrentStep('receiver-info')}
              variant="outline"
              className="w-full h-12 border-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105"
            >
              <CaretLeft className="h-5 w-5 mr-2" />
              Edit Receiver Information
            </Button>
          </div>
        </div>
      )}
    </CardContent>
  );

  // Render transaction form step
  const renderTransactionForm = () => (
    <CardContent className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToOverview}
            className="h-10 w-10 p-0 hover:bg-muted"
          >
            <CaretLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="text-xl font-bold font-montserrat capitalize">
              {transactionType} {country.currency}
            </h3>
            <p className="text-sm text-muted-foreground">
              Fill in the details to create a new transaction
            </p>
          </div>
        </div>
        <div className="text-3xl animate-float">
          {country.flag}
        </div>
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Full Name - Mandatory */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Full Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={formData.fullName}
            onChange={(e) => handleFormChange('fullName', e.target.value)}
            placeholder="Enter full name"
            className="h-12"
            required
          />
        </div>

        {/* Email - Optional */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Email <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => handleFormChange('email', e.target.value)}
            placeholder="Enter email address"
            className="h-12"
          />
        </div>

        {/* Amount and Currencies - Mandatory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Amount <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={formData.amount}
              onChange={(e) => handleFormChange('amount', e.target.value)}
              placeholder="0.00"
              className="h-12"
              min="0"
              step="0.01"
              required
            />
          </div>

          {/* Receiver Currency */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Sender Currency <span className="text-red-500">*</span>
                  </label> {/* Use getCurrencySymbol here */}
            <select
              value={senderCurrency}
              onChange={(e) => setSenderCurrency(e.target.value)}
              className="h-12 px-3 border rounded-md bg-muted/50 w-full"
            >
              {availableCurrencies.map((c) => (
                <option key={`sender-${c}`} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Phone Number - Optional */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Phone Number <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleFormChange('phoneNumber', e.target.value)}
            placeholder="+1 234 567 8900"
            className="h-12"
          />
        </div>

        {/* Transaction Summary */}
        <Card className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Transaction Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <div className="font-medium capitalize">{transactionType}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Exchange Rate:</span>
                <div className="font-mono">{(getRateForPair(senderCurrency, receiverCurrency)).toFixed(4)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Amount:</span>
                    <div className="font-medium">{getCurrencySymbol(senderCurrency)}{formData.amount || '0.00'} {senderCurrency}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Estimated Fee:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={customFee !== null ? customFee : (formData.amount ? parseFloat(formData.amount) * 0.05 : 0)}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      setCustomFee(isNaN(value) ? null : value);
                    }}
                    className="font-mono w-20 h-8 text-sm"
                    step="0.01"
                    min="0"
                    placeholder={"0.00"}
                  />
                  <span className="text-xs text-muted-foreground">
                    (5% of amount)
                  </span>
                </div>
              </div>
            </div>

            {/* Fee Information */}
            <div className="flex items-center justify-between pt-2 border-t border-primary/10">
              <span className="text-sm font-medium">Transaction Fee</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  5% of transaction amount
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-4 border-t">
        {/* Save and Continue */}
        <Button
          onClick={() => handleSaveTransaction(true)}
          disabled={isCreating}
          className="w-full h-12 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
        >
          {isCreating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FloppyDisk className="h-5 w-5" />
              <span>Save and Continue</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </Button>

        {/* Save Only */}
        <Button
          onClick={() => handleSaveTransaction(false)}
          disabled={isCreating}
          variant="outline"
          className="w-full h-12 border-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105"
        >
          <FloppyDisk className="h-5 w-5 mr-2" />
          Save Only
        </Button>

        {/* Create Transaction (Floating) */}
        <div className="relative">
          <Button
            onClick={handleCreateTransaction}
            disabled={isSecuring}
            className="w-full h-14 bg-gradient-to-r from-green-600 via-green-700 to-emerald-700 hover:from-green-700 hover:via-green-800 hover:to-emerald-800 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl floating-button text-lg font-semibold"
          >
            {isSecuring ? (
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 animate-pulse" />
                <div className="flex flex-col items-start">
                  <span className="text-sm">Securing Connection...</span>
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    <span className="text-xs opacity-80">SSL Encryption Active</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="h-6 w-6" />
                <span>Create Transaction</span>
                <Lightning className="h-5 w-5" />
              </div>
            )}
          </Button>
        </div>
      </div>
    </CardContent>
  );

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <Card
        className="modal-content bg-card backdrop-blur-none border-2 border-primary/20 animate-scale-in shadow-2xl mobile-modal country-modal-scale overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Conditional Step Rendering */}
        {currentStep === 'transaction-form' ? (
          <React.Fragment>
            {/* Transaction Form Header */}
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 relative overflow-hidden px-4 sm:px-6">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToOverview}
                    className="h-10 w-10 p-0 hover:bg-muted"
                  >
                    <CaretLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold font-montserrat capitalize">
                      {transactionType} {country.currency}
                    </CardTitle>
                    <CardDescription className="text-sm font-montserrat text-muted-foreground">
                      Complete the transaction details
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            {renderTransactionForm()}
          </React.Fragment>
        ) : currentStep === 'pending-transactions' ? (
          <React.Fragment>
            {/* Pending Transactions Header */}
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 relative overflow-hidden px-4 sm:px-6">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-200/30 to-transparent animate-pulse dark:via-green-800/30"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackToOverview}
                    className="h-10 w-10 p-0 hover:bg-muted"
                  >
                    <CaretLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold font-montserrat">
                      Receive {country.currency}
                    </CardTitle>
                    <CardDescription className="text-sm font-montserrat text-muted-foreground">
                      Select a pending transaction to receive
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            {renderPendingTransactions()}
          </React.Fragment>
        ) : currentStep === 'receiver-info' ? (
          <React.Fragment>
            {/* Receiver Info Header */}
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 relative overflow-hidden px-4 sm:px-6">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/30 to-transparent animate-pulse dark:via-blue-800/30"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep('pending-transactions')}
                    className="h-10 w-10 p-0 hover:bg-muted"
                  >
                    <CaretLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold font-montserrat">
                      Receiver Information
                    </CardTitle>
                    <CardDescription className="text-sm font-montserrat text-muted-foreground">
                      Enter details for the money receiver
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            {renderReceiverInfo()}
          </React.Fragment>
        ) : currentStep === 'preview' ? (
          <React.Fragment>
            {/* Preview Header */}
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 relative overflow-hidden px-4 sm:px-6">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/30 to-transparent animate-pulse dark:via-amber-800/30"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep('receiver-info')}
                    className="h-10 w-10 p-0 hover:bg-muted"
                  >
                    <CaretLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold font-montserrat">
                      Transaction Preview
                    </CardTitle>
                    <CardDescription className="text-sm font-montserrat text-muted-foreground">
                      Review transaction details before finalizing
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            {renderPreview()}
          </React.Fragment>
        ) : (
          <>
            {/* Original Overview Header */}
            <CardHeader className="pb-4 border-b bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 relative overflow-hidden px-4 sm:px-6">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse"></div>
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="text-4xl sm:text-6xl animate-float flex-shrink-0">
                    {country.flag}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg sm:text-2xl font-bold font-montserrat bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mobile-header truncate">
                      {country.name}
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-lg font-montserrat text-muted-foreground mobile-text truncate">
                      {country.currency} Exchange • Live Rates
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 mobile-button flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Exchange Rate Info */}
            </CardHeader>
            <CardContent className="p-2 sm:p-3 overflow-hidden">
              {/* Filters */}
              {/* Send/Receive Buttons - Replacing Current Rate */}
              <div className="mb-4 country-modal-grid-low country-modal-actions-scale">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSendClick}
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                    <Upload className="h-5 w-5 mr-2 relative z-10" />
                    <span className="relative z-10">Send {country.currency}</span>
                  </Button>
                  <Button
                    onClick={handleReceiveClick}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                    <Download className="h-5 w-5 mr-2 relative z-10" />
                    <span className="relative z-10">Receive {country.currency}</span>
                  </Button>
                  {showCreateInvoice && onCreateInvoice && (
                    <Button
                      onClick={onCreateInvoice}
                      variant="outline"
                      className="flex-1 h-12 border-2 border-green-500/50 hover:bg-green-500/10 hover:border-green-500 transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
                      <Receipt className="h-5 w-5 mr-2 relative z-10" />
                      <span className="relative z-10">Create Invoice</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Transaction Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 country-modal-grid-low">
                <Card className="p-2 sm:p-3 hover:shadow-md transition-all duration-300 animate-card-entrance mobile-card" style={{animationDelay: '300ms'}}>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground font-montserrat mobile-text">Total Volume</p>
                    <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ${totalVolume.toLocaleString()}
                    </p>
                  </div>
                </Card>
                <Card className="p-2 sm:p-3 hover:shadow-md transition-all duration-300 animate-card-entrance mobile-card" style={{animationDelay: '400ms'}}>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground font-montserrat mobile-text">Total Fees</p>
                    <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                      ${totalFees.toLocaleString()}
                    </p>
                  </div>
                </Card>
                <Card className="p-2 sm:p-3 hover:shadow-md transition-all duration-300 animate-card-entrance mobile-card" style={{animationDelay: '500ms'}}>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground font-montserrat mobile-text">Completed</p>
                    <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {completedCount} / {filteredTransactions.length}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Filters */}
              <Card className="p-2 sm:p-3 mb-4 bg-gradient-to-r from-muted/20 via-muted/30 to-muted/20 border border-muted animate-card-entrance mobile-card" style={{animationDelay: '600ms'}}>
                <div className="flex flex-col gap-4">
                  {/* Search */}
                  <div className="relative">
                    <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background/50 backdrop-blur-sm border border-muted-foreground/20 focus:border-primary/50 transition-all duration-300 mobile-input h-12"
                    />
                  </div>

                  {/* Time Filters */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "6h", label: "6h" },
                      { value: "12h", label: "12h" },
                      { value: "24h", label: "24h" },
                      { value: "48h", label: "48h" },
                      { value: "3d", label: "3d" },
                      { value: "1w", label: "1w" },
                      { value: "1m", label: "1m" },
                      { value: "1y", label: "1y" },
                    ].map((filter) => (
                      <Button
                        key={filter.value}
                        variant={timeFilter === filter.value && !showCustomDate ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setTimeFilter(filter.value);
                          setShowCustomDate(false);
                        }}
                        className="h-10 transition-all duration-300 hover:scale-105 mobile-button text-sm"
                      >
                        {filter.label}
                      </Button>
                    ))}
                    <Button
                      variant={showCustomDate ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowCustomDate(!showCustomDate)}
                      className="h-10 transition-all duration-300 hover:scale-105 mobile-button text-sm"
                    >
                      <CalendarBlank className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Custom Date</span>
                      <span className="sm:hidden">Custom</span>
                    </Button>
                  </div>

                  {/* Custom Date Input */}
                  {showCustomDate && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 animate-fade-in">
                      <Input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full sm:w-auto bg-background/50 backdrop-blur-sm mobile-input h-12"
                      />
                      <p className="text-sm text-muted-foreground font-montserrat mobile-text">
                        Showing transactions from this date onwards
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Recent Transactions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between animate-card-entrance" style={{animationDelay: '700ms'}}>
                  <h3 className="text-base sm:text-lg font-semibold font-montserrat bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mobile-header">
                    Recent Transactions ({filteredTransactions.length})
                  </h3>
                  <Badge variant="outline" className="font-montserrat border-primary/50 text-primary text-xs">
                    {showCustomDate ? "Custom Period" : timeFilter.toUpperCase()}
                  </Badge>
                </div>

                {filteredTransactions.length > 0 ? (
                  <div className="space-y-2 max-h-60 sm:max-h-80 overflow-y-auto custom-scrollbar">
                    {filteredTransactions.map((transaction, index) => (
                      <Card
                        key={transaction.id}
                        className="p-2 sm:p-3 hover:bg-muted/50 hover:shadow-md hover:scale-[1.01] transition-all duration-200 animate-card-entrance border border-muted/50 hover:border-primary/30 mobile-card"
                        style={{animationDelay: `${800 + index * 100}ms`}}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 ring-2 ring-muted hover:ring-primary transition-all duration-300">
                            <AvatarFallback className="text-xs sm:text-sm font-medium bg-gradient-to-br from-primary/10 to-accent/10">
                              {transaction.clientName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                              <p className="font-medium truncate font-montserrat mobile-text text-sm sm:text-base">
                                {transaction.clientName}
                              </p>
                              <Badge className={`${getStatusColor(transaction.status)} flex-shrink-0 animate-pulse text-xs w-fit`}>
                                {getStatusIcon(transaction.status)}
                                <span className="ml-1 capitalize">{transaction.status}</span>
                              </Badge>
                            </div>
                            
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate font-montserrat mobile-text">
                              {transaction.clientEmail}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground font-montserrat mobile-text">Amount:</span>
                                <div className="font-semibold font-mono">${transaction.amount.toLocaleString()}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-montserrat mobile-text">Fee:</span>
                                <div className="font-semibold font-mono">${transaction.fee}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-montserrat mobile-text">Pair:</span>
                                <div className="font-mono text-primary text-xs">{transaction.fromCurrency} → {transaction.toCurrency}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground font-montserrat mobile-text">Date:</span>
                                <div className="font-mono text-xs">{new Date(transaction.createdAt).toLocaleDateString()}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-4 sm:p-6 text-center bg-gradient-to-br from-muted/20 to-muted/30 animate-card-entrance mobile-card" style={{animationDelay: '800ms'}}>
                    <div className="space-y-4">
                      <Funnel className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto animate-float" />
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold font-montserrat mobile-header">
                          No transactions found
                        </h3>
                        <p className="text-muted-foreground font-montserrat mobile-text text-sm">
                          No transactions match your current filter criteria for {country.name}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setSearchTerm("");
                          setTimeFilter("1m");
                          setShowCustomDate(false);
                          setCustomDate("");
                        }}
                        variant="outline"
                        className="mt-2 mobile-button h-10"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default CountryModal;
