import React, { useEffect } from 'react';
import { toast } from 'sonner';

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
}

interface InAppNotificationsProps {
  transactions: Transaction[];
  currentUser: string;
}

// Simulate other users in the system
const SYSTEM_USERS = [
  { id: 'user1', name: 'Alice Johnson', initials: 'AJ' },
  { id: 'user2', name: 'Bob Smith', initials: 'BS' },
  { id: 'user3', name: 'Carol Davis', initials: 'CD' },
  { id: 'admin', name: 'System Admin', initials: 'SA' }
];

const InAppNotifications: React.FC<InAppNotificationsProps> = ({
  transactions: _transactions,
  currentUser: _currentUser
}) => {
  // const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // Simulate receiving notifications from other users
  useEffect(() => {
    const generateRandomNotification = () => {
      const notificationTypes = [
        'transaction_created',
        'transaction_completed', 
        'transaction_printed'
      ] as const;
      
      const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      const randomUser = SYSTEM_USERS[Math.floor(Math.random() * SYSTEM_USERS.length)];
      const randomAmount = Math.floor(Math.random() * 5000) + 100;
      const currencies = ['USD', 'GHS', 'NGN', 'EUR', 'GBP'];
      const fromCurrency = currencies[Math.floor(Math.random() * currencies.length)];
      const toCurrency = currencies[Math.floor(Math.random() * currencies.length)];
      
      let title = '';
      let message = '';
      
      switch (randomType) {
        case 'transaction_created':
          title = 'New Transaction Created';
          message = `${randomUser.name} created a transaction for $${randomAmount.toLocaleString()} (${fromCurrency} → ${toCurrency})`;
          break;
        case 'transaction_completed':
          title = 'Transaction Completed';
          message = `${randomUser.name} completed a transaction for $${randomAmount.toLocaleString()}`;
          break;
        case 'transaction_printed':
          title = 'Receipt Printed';
          message = `${randomUser.name} printed a receipt for transaction #TXN-${Math.floor(Math.random() * 1000)}`;
          break;
      }
      
      // Show toast notification
      toast.success(title, {
        description: message,
        duration: 4000
      });
    };

    // Set up random notification generation
    const interval = setInterval(() => {
      // Generate notification every 15-45 seconds
      if (Math.random() > 0.7) { // 30% chance every interval
        generateRandomNotification();
      }
    }, 15000 + Math.random() * 30000);

    return () => clearInterval(interval);
  }, []);


  return (
    <>
      {/* Notification Bell and Dropdown - Removed */}
    </>
  );
};

export default InAppNotifications;