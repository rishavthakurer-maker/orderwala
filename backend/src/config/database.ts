import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to handle errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return {
    success: false,
    message: error.message || 'Database error',
    error: error.code,
  };
};

// Helper function for database queries
export const dbQuery = async (query: string, params: any[] = []) => {
  try {
    const { data, error } = await supabase.rpc('execute_query', {
      query,
      params,
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return handleSupabaseError(error);
  }
};
