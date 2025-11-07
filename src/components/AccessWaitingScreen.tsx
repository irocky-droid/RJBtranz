import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowsClockwise,
  Shield,
  User,
  Warning
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { supabase } from '../lib/supabase';

interface AccessWaitingScreenProps {
  userEmail: string;
  onLogout: () => void;
}

const AccessWaitingScreen: React.FC<AccessWaitingScreenProps> = ({ userEmail, onLogout }) => {
  const [status, setStatus] = useState<'waiting' | 'approved' | 'denied'>('waiting');
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Check approval status by polling current user session
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (user) {
          const userStatus = user.user_metadata?.status || 'approved';

          if (userStatus === 'approved') {
            setStatus('approved');
            toast.success("🎉 Access granted! Welcome to RJB TRANZ!");
            // Trigger page reload to enter main app
            setTimeout(() => window.location.reload(), 2000);
          } else if (userStatus === 'denied') {
            setStatus('denied');
            toast.error("❌ Access denied. Please contact support.");
          }
          // If still pending, continue polling
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };

    // Check immediately and then every 5 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update time elapsed
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'approved') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
              <CheckCircle className="h-8 w-8 text-green-600" weight="fill" />
            </div>
            <CardTitle className="text-2xl text-green-800">Access Granted!</CardTitle>
            <CardDescription className="text-green-600">
              Welcome to RJB TRANZ Admin System
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                Your account has been approved by the Super Admin.
                You now have full access to the system.
              </p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <XCircle className="h-8 w-8 text-red-600" weight="fill" />
            </div>
            <CardTitle className="text-2xl text-red-800">Access Denied</CardTitle>
            <CardDescription className="text-red-600">
              Your access request was not approved
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700">
                The Super Admin has denied your access request.
                Please contact support for more information.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onLogout}
                className="flex-1"
              >
                Logout
              </Button>
              <Button
                onClick={() => window.location.href = 'mailto:support@rjbtranz.com'}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-blue-200 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Clock className="h-8 w-8 text-blue-600 animate-pulse" />
          </div>
          <CardTitle className="text-xl">Waiting for Approval</CardTitle>
          <CardDescription>
            Your account is pending Super Admin approval
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <User className="h-5 w-5 text-blue-600" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userEmail}</p>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Pending
            </Badge>
          </div>

          {/* Status Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Time elapsed:</span>
              <span className="font-mono">{formatTime(timeElapsed)}</span>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Warning className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Approval Required</p>
                  <p>Your account needs to be approved by the Super Admin before you can access the system. This process typically takes a few minutes to a few hours.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onLogout}
              className="flex-1"
            >
              Logout
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex-1"
              disabled
            >
              <ArrowsClockwise className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </Button>
          </div>

          {/* Admin Contact */}
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground mb-2">
              Need immediate assistance?
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = 'mailto:admin@rjbtranz.com'}
              className="text-xs"
            >
              <Shield className="h-3 w-3 mr-1" />
              Contact Super Admin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessWaitingScreen;