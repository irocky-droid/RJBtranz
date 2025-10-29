import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Trash,
  MagnifyingGlass,
  Crown,
  Warning
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'denied' | 'active';
  createdAt: string;
  lastLogin?: string;
  lastActivity?: string;
  isOnline?: boolean;
}

interface SuperAdminPanelProps {
  onBack: () => void;
  currentUser: User;
}

const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ onBack, currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load users from Supabase
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Crosscheck super admin authorization
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !currentUser) {
          toast.error('Unauthorized access to admin panel');
          onBack();
          return;
        }

        // Verify user is super admin
        if (currentUser.email !== 'admin@rjbtranz.com') {
          toast.error('Super admin access required');
          onBack();
          return;
        }

        // Get all users from auth.users (admin only)
        const { data: authUsers, error: authError2 } = await supabase.auth.admin.listUsers();

        if (authError2) throw authError2;

        // Transform auth users to our User format
        const transformedUsers: User[] = (authUsers.users || []).map(user => {
          const lastActivity = user.user_metadata?.lastActivity || user.last_sign_in_at;
          const isOnline = lastActivity ? (Date.now() - new Date(lastActivity).getTime()) < 300000 : false; // 5 minutes

          return {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown',
            role: user.user_metadata?.role || 'user',
            status: (user.user_metadata?.status as User['status']) || 'approved',
            createdAt: user.created_at,
            lastLogin: user.last_sign_in_at || undefined,
            lastActivity: lastActivity,
            isOnline: isOnline
          };
        });

        setUsers(transformedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
        // Fallback to empty array
        setUsers([]);
      }
    };

    loadUsers();
  }, [onBack]);

  const handleUserAction = async (userId: string, action: 'approve' | 'deny' | 'remove') => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      switch (action) {
        case 'approve': {
          // Update user metadata to approved status
          const { error: approveError } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { ...user, status: 'approved' }
          });
          if (approveError) throw approveError;

          setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, status: 'approved' } : u
          ));
          toast.success(`User ${user.name} has been approved and granted access`);
          break;
        }

        case 'deny': {
          // Update user metadata to denied status
          const { error: denyError } = await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { ...user, status: 'denied' }
          });
          if (denyError) throw denyError;

          setUsers(prev => prev.map(u =>
            u.id === userId ? { ...u, status: 'denied' } : u
          ));
          toast.error(`User ${user.name} has been denied access`);
          break;
        }

        case 'remove': {
          // Delete user from Supabase Auth
          const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
          if (deleteError) throw deleteError;

          setUsers(prev => prev.filter(u => u.id !== userId));
          toast.warning(`User ${user.name} has been permanently removed`);
          break;
        }
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(`Failed to ${action} user`);
    }
  };

  const getStatusIcon = (status: string, isOnline?: boolean) => {
    if (isOnline) {
      return <div className="h-4 w-4 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>;
    }

    switch (status) {
      case 'active':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Warning className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityStatus = (user: User) => {
    if (user.isOnline) {
      return <span className="text-xs text-green-600 font-medium">Active now</span>;
    }

    if (user.lastActivity) {
      const timeDiff = Date.now() - new Date(user.lastActivity).getTime();
      if (timeDiff < 60000) { // Less than 1 minute
        return <span className="text-xs text-green-600">Active {Math.floor(timeDiff / 1000)}s ago</span>;
      } else if (timeDiff < 3600000) { // Less than 1 hour
        return <span className="text-xs text-gray-600">Active {Math.floor(timeDiff / 60000)}m ago</span>;
      } else if (timeDiff < 86400000) { // Less than 1 day
        return <span className="text-xs text-gray-600">Active {Math.floor(timeDiff / 3600000)}h ago</span>;
      } else {
        return <span className="text-xs text-gray-400">Active {Math.floor(timeDiff / 86400000)}d ago</span>;
      }
    }

    return <span className="text-xs text-gray-400">Never active</span>;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: users.length,
    online: users.filter(u => u.isOnline).length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved' || u.status === 'active').length,
    denied: users.filter(u => u.status === 'denied').length
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="flex h-16 items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Button>
          <div className="flex items-center gap-3">
            <Crown className="h-6 w-6 text-yellow-500" />
            <div>
              <h1 className="text-lg font-bold">Super Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage user access and permissions</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="p-6 grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-green-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <div className="h-3 w-3 bg-white rounded-full"></div>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.online}</p>
                <p className="text-sm text-muted-foreground">Online Now</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approved Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.denied}</p>
                <p className="text-sm text-muted-foreground">Denied Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="px-6 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-md bg-background"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="active">Active</option>
            <option value="denied">Denied</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="px-6 pb-6">
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getStatusColor(user.status)}>
                          {getStatusIcon(user.status, user.isOnline)}
                          <span className="ml-1 capitalize">{user.status}</span>
                        </Badge>
                        {user.isOnline && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                            Online
                          </Badge>
                        )}
                        {user.role === 'admin' && (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1">
                        {getActivityStatus(user)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'approve')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleUserAction(user.id, 'deny')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Deny
                        </Button>
                      </>
                    )}

                    {user.status !== 'pending' && user.id !== currentUser.id && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUserAction(user.id, 'remove')}
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Created:</span> {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    {user.lastLogin && (
                      <div>
                        <span className="font-medium">Last Login:</span> {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== 'all'
                ? "Try adjusting your search or filter criteria"
                : "No users match the current criteria"}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPanel;