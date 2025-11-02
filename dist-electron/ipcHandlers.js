"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeIpcHandlers = initializeIpcHandlers;
const electron_1 = require("electron");
const supabase_js_1 = require("@supabase/supabase-js");
// Using dotenv to load environment variables from .env file
require("dotenv/config");
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase URL and Service Role Key must be defined in your .env file.");
}
// Create a Supabase client with the service_role key
const supabaseAdmin = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
/**
 * Initializes all IPC handlers for the application.
 */
function initializeIpcHandlers() {
    // Handler to fetch all users
    electron_1.ipcMain.handle('list-users', async () => {
        console.log('Main Process: Received request to list users.');
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) {
            console.error('Error listing users:', error.message);
            return { error };
        }
        return { users: data.users };
    });
    // Handler to update a user's access
    electron_1.ipcMain.handle('update-user-access', async (event, userId, grantAccess) => {
        console.log(`Main Process: Updating access for user ${userId} to ${grantAccess}`);
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, { app_metadata: { 'access_granted': grantAccess } });
        if (error) {
            console.error('Error updating user access:', error.message);
            return { error };
        }
        return { user: data.user };
    });
}
