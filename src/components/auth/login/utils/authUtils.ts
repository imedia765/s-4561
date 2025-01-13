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
  const retryDelay = 3000; // 3 seconds between retries

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add delay between attempts (except first attempt)
      if (attempt > 1) {
        console.log(`Waiting ${retryDelay}ms before attempt ${attempt}...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }

      console.log(`Attempt ${attempt} to verify member ${memberNumber}`);
      
      // Simple connectivity check using a lightweight query
      const { data: healthCheck, error: healthError } = await supabase
        .from('members')
        .select('count')
        .limit(1)
        .single();

      if (healthError) {
        console.error(`Connectivity check failed (attempt ${attempt}):`, healthError);
        if (attempt === maxRetries) {
          throw new Error('Network connection error. Please check your connection and try again.');
        }
        continue;
      }

      console.log('Connectivity check passed, proceeding with member verification');
      
      const { data: members, error: memberError } = await supabase
        .from('members')
        .select('id, member_number, status')
        .eq('member_number', memberNumber)
        .eq('status', 'active')
        .maybeSingle();

      if (memberError) {
        console.error(`Member verification error (attempt ${attempt}):`, memberError);
        
        if (memberError.message?.includes('JWT') || memberError.message?.includes('token')) {
          console.log('JWT/token error detected, clearing session...');
          await clearAuthState();
        }
        
        if (attempt === maxRetries) {
          console.error('Max retries reached, throwing error');
          throw memberError;
        }
        continue;
      }

      if (!members) {
        console.log('No member found or inactive status');
        throw new Error('Member not found or inactive');
      }

      console.log('Member verified successfully:', members);
      return members;
    } catch (error: any) {
      if (error.message === 'Member not found or inactive') {
        console.error('Member verification failed: Not found or inactive');
        throw error;
      }
      
      console.error(`Error during verification (attempt ${attempt}):`, error);
      
      if (attempt === maxRetries) {
        console.error('Max retries reached after errors');
        throw new Error('Unable to verify member. Please try again later.');
      }
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
  
  if (error.message?.includes('refresh_token_not_found') || 
      error.message?.includes('token') || 
      error.message?.includes('JWT')) {
    console.log('Token error detected, clearing session and retrying...');
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
      console.error('Retry sign in failed:', retryError);
      throw retryError;
    }
  } else {
    throw error;
  }
};