/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
 import React, { useEffect, useState } from 'react';
import { Bell, X, Check, AlertTriangle, Clock, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface PushNotificationServiceProps {
  transactions: Transaction[];
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: Date;
  transactionId?: string;
  read: boolean;
  persistent?: boolean;
}

interface NotificationClickData {
  transactionId?: string;
  action?: string;
}

export default function PushNotificationService({ transactions }: PushNotificationServiceProps) {
  const [permission, setPermission] = useState(Notification.permission);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [lastTransactionCount, setLastTransactionCount] = useState(0);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Initialize service worker and push notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        setIsSupported(false);
        console.warn('Push notifications not supported in this browser');
        return;
      }

      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service workers not supported');
        return;
      }

      try {
        // Register service worker for push notifications
        const registration = await navigator.serviceWorker.register('/sw.js');
        setServiceWorkerRegistration(registration);
        console.log('Service Worker registered:', registration);

        // Request notification permission
        if (permission === 'default') {
          const result = await Notification.requestPermission();
          setPermission(result);
        }

        // Handle background notifications
        if ('onmessage' in navigator.serviceWorker) {
          navigator.serviceWorker.onmessage = (event) => {
            if (event.data.type === 'NOTIFICATION_CLICK') {
              handleNotificationClick(event.data.notificationData);
            }
          };
        }

        // Send welcome notification
        if (permission === 'granted') {
          sendLocalNotification(
            'RJB TRANZ CRM Ready! 🚀',
            'Push notifications are now active. You\'ll receive updates on transactions and system events.',
            'success'
          );
        }
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  // Monitor transaction changes
  useEffect(() => {
    if (transactions.length > lastTransactionCount) {
      // New transaction added
      const newTransactions = transactions.slice(lastTransactionCount);
      newTransactions.forEach(transaction => {
        sendTransactionNotification(transaction, 'created');
      });
    } else if (transactions.length === lastTransactionCount) {
      // Check for status changes in existing transactions
      transactions.forEach(transaction => {
        const existingNotification = notifications.find(n => n.transactionId === transaction.id);
        if (!existingNotification && transaction.status !== 'pending') {
          sendTransactionNotification(transaction, 'updated');
        }
      });
    }
    
    setLastTransactionCount(transactions.length);
  }, [transactions, lastTransactionCount, notifications]);

  // Send transaction-specific notifications
  const sendTransactionNotification = async (transaction: Transaction, action: 'created' | 'updated') => {
    let title: string;
    let body: string;
    let type: 'success' | 'warning' | 'error' | 'info';
    let icon = '💰';

    switch (action) {
      case 'created':
        title = 'New Transaction Created! 📝';
        body = `Transaction for ${transaction.clientName} - $${transaction.amount} ${transaction.fromCurrency}`;
        type = 'info';
        icon = '📝';
        break;
      case 'updated':
        switch (transaction.status) {
          case 'completed':
            title = 'Transaction Completed! ✅';
            body = `$${transaction.amount} sent to ${transaction.clientName} successfully`;
            type = 'success';
            icon = '✅';
            break;
          case 'failed':
            title = 'Transaction Failed! ❌';
            body = `Transaction for ${transaction.clientName} needs attention`;
            type = 'error';
            icon = '❌';
            break;
          default:
            title = 'Transaction Updated 🔄';
            body = `Status changed for ${transaction.clientName}`;
            type = 'info';
            icon = '🔄';
        }
        break;
    }

    // Send native notification safely
    if (permission === 'granted') {
      try {
        if (serviceWorkerRegistration && serviceWorkerRegistration.showNotification) {
          // Use Service Worker registration for better notification support
          await serviceWorkerRegistration.showNotification(title, {
            body,
            icon: 'https://i.ibb.co/6LY7bxR/rjb-logo.jpg',
            badge: 'https://i.ibb.co/6LY7bxR/rjb-logo.jpg',
            tag: `transaction-${transaction.id}`,
            requireInteraction: transaction.status === 'failed',
            silent: false,
            data: {
              transactionId: transaction.id,
              url: `/transactions/${transaction.id}`,
              action: action,
              timestamp: new Date().toISOString()
            }
          });
        } else {
          // Fallback to regular Notification constructor - wrap in try/catch
          try {
            const notification = new Notification(title, {
              body,
              icon: 'https://i.ibb.co/6LY7bxR/rjb-logo.jpg',
              tag: `transaction-${transaction.id}`,
              silent: false
            });

            notification.onclick = () => {
              handleNotificationClick({
                transactionId: transaction.id,
                action: 'view'
              });
              notification.close();
            };

            // Auto-close after 10 seconds for non-critical notifications
            if (transaction.status !== 'failed') {
              setTimeout(() => notification.close(), 10000);
            }
          } catch (notificationError) {
            console.warn('Failed to create Notification:', notificationError);
            // Continue with just the internal notification and toast
          }
        }
      } catch (error) {
        console.warn('Failed to send push notification:', error);
        // Continue with internal notification and toast as fallback
      }
    }

    // Add to internal notification list
    const internalNotification: NotificationItem = {
      id: `${transaction.id}-${action}-${Date.now()}`,
      title,
      body,
      type,
      timestamp: new Date(),
      transactionId: transaction.id,
      read: false,
      persistent: transaction.status === 'failed'
    };

    setNotifications(prev => [internalNotification, ...prev.slice(0, 19)]); // Keep last 20
    
    // Show toast notification as fallback
    toast[type](title, {
      description: body,
      action: {
        label: 'View',
        onClick: () => handleNotificationClick({ transactionId: transaction.id, action: 'view' })
      }
    });
  };

  // Send local notification
  const sendLocalNotification = async (title: string, body: string, type: 'success' | 'warning' | 'error' | 'info', persistent = false) => {
    const notification: NotificationItem = {
      id: `local-${Date.now()}`,
      title,
      body,
      type,
      timestamp: new Date(),
      read: false,
      persistent
    };

    setNotifications(prev => [notification, ...prev.slice(0, 19)]);

    if (permission === 'granted') {
      try {
        if (serviceWorkerRegistration && serviceWorkerRegistration.showNotification) {
          await serviceWorkerRegistration.showNotification(title, {
            body,
            icon: 'https://i.ibb.co/6LY7bxR/rjb-logo.jpg',
            badge: 'https://i.ibb.co/6LY7bxR/rjb-logo.jpg',
            tag: notification.id,
            silent: false
          });
        } else {
          // Fallback to regular Notification constructor - wrap in try/catch
          try {
            new Notification(title, {
              body,
              icon: 'https://i.ibb.co/6LY7bxR/rjb-logo.jpg',
              tag: notification.id,
              silent: false
            });
          } catch (notificationError) {
            console.warn('Failed to create local notification:', notificationError);
            // Continue with toast only
          }
        }
      } catch (error) {
        console.warn('Failed to send local notification:', error);
        // Continue with toast as fallback
      }
    }

    toast[type](title, { description: body });
  };

  // Handle notification clicks
  const handleNotificationClick = (data: NotificationClickData) => {
    if (data.transactionId) {
      // Navigate to transaction or trigger action
      const customEvent = new CustomEvent('switchToTransactions', {
        detail: { transactionId: data.transactionId }
      });
      window.dispatchEvent(customEvent);
    }
    
    // Mark as read
    setNotifications(prev => 
      prev.map(n => 
        n.transactionId === data.transactionId ? { ...n, read: true } : n
      )
    );
  };

  // Request permission handler
  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        sendLocalNotification(
          'Notifications Enabled! 🔔',
          'You\'ll now receive real-time updates on your transactions.',
          'success'
        );
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications');
    }
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Get icon for notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <X className="h-4 w-4 text-red-600" />;
      default: return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Push notifications bell and panel - Hidden */}
    </>
  );
}