

// Common types for the application

export interface Transaction {
  id: string;
  clientName: string;
  clientEmail?: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  fee: number;
  status: "pending" | "completed" | "failed" | "cancelled";
  createdAt: string;
  receiptPrinted: boolean;
  phoneNumber?: string;
  transactionType: "send" | "receive";
  uniqueId: string;
  formatId: string;
}

export interface Client {
  id: string;
  name: string;
  totalTransactions: number;
  totalVolume: number;
  verificationStatus: "pending" | "verified" | "rejected";
}

export interface Invoice {
  id: string;
  senderName: string;
  senderEmail?: string;
  senderAmount: string;
  senderCurrency: string;
  senderCountry: string;
  senderPhone: string;
  receiverName: string;
  receiverEmail?: string;
  receiverAmount: string;
  receiverCurrency: string;
  receiverCountry: string;
  receiverPhone: string;
  feeAmount: number;
  feeRate: number;
  feeCurrency: string;
  feeOnSender: boolean;
  exchangeRate: number;
  totalFee: number;
  isRateEditable: boolean;
  amount: number; // For backward compatibility with UI
  description?: string;
  dueDate?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
}

export interface ExchangeRate {
  pair: string;
  rate: number;
  change: number;
  changePercent: number;
  lastUpdated: string;
  region: string;
}

export interface SystemConfig {
  [key: string]: unknown; // Flexible for system configuration
}

export type TimeRange = "7d" | "30d" | "90d" | "1y";
