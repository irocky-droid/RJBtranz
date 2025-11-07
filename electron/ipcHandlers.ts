import { ipcMain } from 'electron';
import { createClient } from '@supabase/supabase-js';

// Using dotenv to load environment variables from .env file
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Supabase URL and Service Role Key must be defined in your .env file.");
}

// Create a Supabase client with the service_role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Initializes all IPC handlers for the application.
 */
export function initializeIpcHandlers() {
  // Handler to fetch all users
  ipcMain.handle('list-users', async () => {
    console.log('Main Process: Received request to list users.');
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      console.error('Error listing users:', error.message);
      return { error };
    }
    return { users: data.users };
  });

  // Handler to update a user's access
  ipcMain.handle('update-user-access', async (event, userId: string, grantAccess: boolean) => {
    console.log(`Main Process: Updating access for user ${userId} to ${grantAccess}`);
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { app_metadata: { 'access_granted': grantAccess } }
    );

    if (error) {
      console.error('Error updating user access:', error.message);
      return { error };
    }
    return { user: data.user };
  });
}