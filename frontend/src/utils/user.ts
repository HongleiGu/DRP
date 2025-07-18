"use client"

import { supabase } from '@/lib/supabase'
import globalStore from '@/store';
import { SignInArgs, SupabaseUser } from '@/types/datatypes'
import {
  AuthResponse
} from '@supabase/supabase-js'

import { PostgrestError } from "@supabase/supabase-js";

export class AuthError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "AuthError";
  }
}

// this sends the OTP
export async function sendOtp(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email
  });

  if (error) throw error;
}

// this verifies the OTP and creates the user if they don't exist
// but we enforce password to be set
export async function verifyOtp(otp: string, user: SupabaseUser, password: string): Promise<AuthResponse> {
  const { data, error } = await supabase.auth.verifyOtp({
    email: user.email,
    token: otp,
    type: 'email',
  });

  if (error || !data.user) throw new AuthError(error?.code || "auth_error", error?.message || "Unknown error");

  const { error: authError } = await supabase.auth.updateUser({
    password: password,
  });

  if (authError) {
    throw new AuthError(authError.code ?? "", authError.message);
  }

  const userId = data.user.id;

  const supabaseuser = {
    id: userId,
    username: user.username,
    onboarding_complete: true,
    avatar_id: user.avatar_id,
    email: user.email
  } as SupabaseUser

  const { error: insertError } = await supabase.from("users").insert([
    supabaseuser
  ]);

  if (insertError) {
    const code = (insertError as PostgrestError).code;
    const msg = insertError.message.toLowerCase();
    if (msg.includes("username")) {
      throw new AuthError("duplicate_username", "Username already taken, Original messsge" + insertError.message);
    } else if (msg.includes("email")) {
      throw new AuthError("duplicate_email", "Email already registered, Original messsge" + insertError.message);
    } else {
      throw new AuthError(code, insertError.message);
    }
  }


  globalStore.setItem('lumiroom-user', JSON.stringify(supabaseuser))


  return { data, error: null };
}

export async function signIn({
  email,
  username,
  password,
}: SignInArgs): Promise<SupabaseUser> {
  let userProfile: SupabaseUser;
  let emailToUse = email;

  if (!email && username) {
    // Resolve user by username
    userProfile = await fetchUserByUsername(username);
    emailToUse = userProfile.email;
  } else if (email) {
    // Resolve user by email
    userProfile = await fetchUserByEmail(email);
  } else {
    throw new Error("Either email or username must be provided for sign in");
  }

  if (!emailToUse) {
    throw new Error("Email not found");
  }


  const { error } = await supabase.auth.signInWithPassword({
    email: emailToUse,
    password,
  });

  if (error) throw error;

  globalStore.setItem('lumiroom-user', JSON.stringify(userProfile))

  // useGlobalStore.setState({ user: userProfile });

  return userProfile;
}

export async function signInWithOtp({
  email,
  username,
  password,
}: SignInArgs): Promise<SupabaseUser> {
  let userProfile: SupabaseUser;
  let emailToUse = email;

  if (!email && username) {
    // Resolve user by username
    userProfile = await fetchUserByUsername(username);
    emailToUse = userProfile.email;
  } else if (email) {
    // Resolve user by email
    userProfile = await fetchUserByEmail(email);
  } else {
    throw new Error("Either email or username must be provided for sign in");
  }

  if (!emailToUse) {
    throw new Error("Email not found");
  }

  console.log(emailToUse, password)

  const { error } = await supabase.auth.signInWithOtp({
    email: emailToUse
  });

  if (error) throw error;

  return userProfile;
}


export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  // useGlobalStore.setState({ user: null });
  globalStore.removeItem('lumiroom-user')
  if (error) throw error
}

export async function fetchUserById(id: string): Promise<SupabaseUser> {
  const { data, error } = await supabase.from("users").select("*").eq("id", id).single();

  if (error) throw error;
  if (!data) throw new Error("User not found");

  return data as SupabaseUser;
}

export async function fetchUserByEmail(email: string): Promise<SupabaseUser> {
  const { data, error } = await supabase.from("users").select("*").eq("email", email).single();

  if (error) throw error;
  if (!data) throw new Error("User not found");

  return data as SupabaseUser;
}

export async function fetchUserByUsername(username: string): Promise<SupabaseUser> {
  const { data, error } = await supabase.from("users").select("*").eq("username", username).single();

  if (error) throw error;
  if (!data) throw new Error("User not found");

  return data as SupabaseUser;
}

export async function getCurrentUserProfile(): Promise<SupabaseUser> {
  // should attempt to directly fetch the user profile from the store
  return JSON.parse(await globalStore.getItem("lumiroom-user") ?? "")
  // useGlobalStore.getState().user as SupabaseUser
}

export async function updateUserProfile(
  updates: Partial<SupabaseUser>
): Promise<SupabaseUser> {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error || !user) throw error ?? new Error('User not found')

  const { data, error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (updateError) throw updateError

  return data as SupabaseUser
}
