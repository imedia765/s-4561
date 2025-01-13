import { supabase } from "@/integrations/supabase/client";
import { QueryClient } from '@tanstack/react-query';

export const clearAuthState = async () => {
  console.log('Clearing existing session...');
  try {
    // Clear any existing sessions with local scope
    await supabase.auth.signOut({ scope: 'local' });
    
    // Clear query cache
    await new QueryClient().clear();
    
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Remove any auth-specific cookies
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    console.log('Auth state cleared successfully');
  } catch (error) {
    console.error('Error clearing auth state:', error);
    throw error;
  }
};

export const verifyMember = async (memberNumber: string) => {
  console.log('Verifying member:', memberNumber);
  
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data: members, error: memberError } = await supabase
        .from('members')
        .select('id, member_number, status')
        .eq('member_number', memberNumber)
        .eq('status', 'active')
        .limit(1);

      if (memberError) {
        console.error(`Member verification error (attempt ${attempt}):`, memberError);
        if (attempt === maxRetries) throw memberError;
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      if (!members || members.length === 0) {
        throw new Error('Member not found or inactive');
      }

      return members[0];
    } catch (error: any) {
      if (error.message === 'Member not found or inactive') throw error;
      
      console.error(`Network error during verification (attempt ${attempt}):`, error);
      if (attempt === maxRetries) {
        throw new Error('Network connection error. Please check your connection and try again.');
      }
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw new Error('Failed to verify member after multiple attempts');
};

export const getAuthCredentials = (memberNumber: string) => ({
  email: `${memberNumber.toLowerCase()}@temp.com`,
  password: memberNumber,
});

export const handleSignInError = async (error: any, email: string, password: string) => {
  console.error('Sign in error:', error);
  
  if (error.message.includes('refresh_token_not_found')) {
    console.log('Refresh token error detected, clearing session and retrying...');
    await clearAuthState();
    
    // Retry sign in after clearing session
    const { error: retryError } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        redirectTo: window.location.origin
      }
    });
    
    if (retryError) {
      throw retryError;
    }
  } else {
    throw error;
  }
};