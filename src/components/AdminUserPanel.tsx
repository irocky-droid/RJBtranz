import React, { useState, useEffect, useCallback } from 'react';
import type { SupabaseUser } from '../electron.d';

export function AdminUserPanel() {
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!window.electronAPI) {
        throw new Error('Electron API is not available.');
      }
      const { users: fetchedUsers, error: fetchError } = await window.electronAPI!.listUsers();
      if (fetchError) {
        throw new Error(fetchError.message);
      }
      setUsers(fetchedUsers || []);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Failed to fetch users: ${err.message}`);
      } else {
        setError('An unknown error occurred while fetching users.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAccessChange = async (userId: string, grantAccess: boolean) => {
    if (!window.electronAPI) {
      return;
    }
    const { error: updateError } = await window.electronAPI!.updateUserAccess(userId, grantAccess);
    if (updateError) {
      alert(`Failed to update access: ${updateError.message}`);
    } else {
      // Refresh the user list to show the change
      fetchUsers();
    }
  };

  if (isLoading) return <div>Loading users...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  // Example: "Active" means signed in within the last 15 minutes
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const activeUsers = users.filter(user =>
    user.last_sign_in_at && new Date(user.last_sign_in_at) > fifteenMinutesAgo
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Admin Panel</h1>

      <h2>Active Users ({activeUsers.length})</h2>
      {activeUsers.length > 0 ? (
        <ul>{activeUsers.map(u => <li key={u.id}>{u.email || u.phone}</li>)}</ul>
      ) : <p>No users currently active.</p>}

      <hr style={{ margin: '20px 0' }} />

      <h2>All Users ({users.length})</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th style={{ padding: '8px' }}>Email/Phone</th>
            <th style={{ padding: '8px' }}>Access Status</th>
            <th style={{ padding: '8px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>{user.email || user.phone}</td>
              <td style={{ padding: '8px' }}>
                <span style={{ color: user.app_metadata?.access_granted === false ? 'red' : 'green' }}>
                  {user.app_metadata?.access_granted === false ? 'Denied' : 'Granted'}
                </span>
              </td>
              <td style={{ padding: '8px' }}>
                <button onClick={() => handleAccessChange(user.id, true)} disabled={user.app_metadata?.access_granted !== false}>
                  Grant
                </button>
                <button onClick={() => handleAccessChange(user.id, false)} disabled={user.app_metadata?.access_granted === false} style={{ marginLeft: '8px' }}>
                  Deny
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}