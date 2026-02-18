import { getSupabase } from './cloud';
import { createClient } from '@supabase/supabase-js';

// Need environment variables to create a temporary client
// Fallback for environments where import.meta.env is not populated correctly
const env = (import.meta.env || {}) as any;
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://ewqhndyjsrplgsjrwyvl.supabase.co';
const SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JqoQpKprStqz27WeCzfJkA_mTdLCY_Q';

/**
 * REGISTER USER DIRECTLY (Admin Panel)
 * Uses a separate client instance with persistence disabled to avoid
 * logging out the current admin user when creating a new account.
 */
export const registerUser = async (email: string, password: string, fullName: string, role: string) => {
    // 1. Create a temporary client that doesn't save the session
    const tempClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: false, // CRITICAL: Don't overwrite admin session
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    // 2. Sign up the new user
    const { data, error } = await tempClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: role,
                is_admin_created: 'true' // Flag for DB Trigger
            }
        }
    });

    if (error) throw error;
    return data;
};

/**
 * INVITE USER (Team View)
 * Generates a temporary password and creates the user.
 * Optionally assigns a sponsor.
 */
export const inviteUser = async (email: string, fullName: string, role: string, sponsorId?: string) => {
    // 1. Create a temporary client that doesn't save the session
    const tempClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });

    // 2. Generate a temporary password
    const tempPassword = 'Welcome' + Math.floor(Math.random() * 9000 + 1000) + '!';

    // 3. Sign up the new user
    const { data, error } = await tempClient.auth.signUp({
        email,
        password: tempPassword,
        options: {
            data: {
                full_name: fullName,
                role: role,
                is_admin_created: 'true'
            }
        }
    });

    if (error) throw error;

    // 4. Assign Sponsor if provided
    if (sponsorId && data.user) {
        const supabase = getSupabase();
        if (supabase) {
             // We use the main client (admin session) to insert the edge
             const currentUser = (await supabase.auth.getUser()).data.user;
             
             const { error: edgeError } = await supabase.from('team_edges').insert({
                 child_id: data.user.id,
                 parent_id: sponsorId,
                 valid_from: new Date().toISOString(),
                 created_by: currentUser?.id
             });
             
             if (edgeError) {
                 console.error("Failed to assign sponsor:", edgeError);
                 // We don't throw here to avoid failing the whole invite, but log it.
             }
        }
    }

    return { user: data.user, tempPassword };
};

/**
 * CHANGE SPONSOR (Admin Only)
 */
export const changeSponsor = async (childId: string, newParentId: string | null) => {
    const supabase = getSupabase();
    if (!supabase) throw new Error("No connection");
    
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("Unauthorized");

    // 1. Close active edge
    const { error: closeError } = await supabase
        .from('team_edges')
        .update({ valid_to: new Date().toISOString() })
        .eq('child_id', childId)
        .is('valid_to', null);
    
    if (closeError) throw closeError;

    // 2. Create new edge
    const { error: createError } = await supabase
        .from('team_edges')
        .insert({
            child_id: childId,
            parent_id: newParentId,
            valid_from: new Date().toISOString(),
            valid_to: null,
            created_by: user.id
        });

    if (createError) throw createError;
    
    return true;
};