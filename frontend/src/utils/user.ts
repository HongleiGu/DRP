"use client"

// import { supabase } from '@/lib/supabase'
import globalStore from '@/store';
import { AuthResponse, SupabaseUser } from '@/types/datatypes'
import { BASE_URL, fetchJson } from './utils';

// this sends the OTP, since OTP is only used for auth, we ask the function to take username and password as well
export async function requestOtp(email: string, username: string, password: string): Promise<void> {
  await fetchJson<string>(`${BASE_URL}api/auth/requestOtp`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: username,
      email: email,
      password: password
    })
  })
}

export async function verifyOtp(otp: string, email: string): Promise<AuthResponse> {
  return await fetchJson<AuthResponse>(`${BASE_URL}api/auth/verifyOtp`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      otp,
      email
    })
  })
}

// can either sign in with password or email
export async function signIn(
  {
    identifier,
    password,
  }
    : 
  { 
    identifier: string, 
    password: string
  }
): Promise<SupabaseUser> {
  console.log(BASE_URL)
  const {user, token} = await fetchJson<{user: SupabaseUser, token: string}>(`${BASE_URL}api/auth/login`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier,
      password
    })
  })

  await globalStore.setItem<SupabaseUser>('lumiroom-user', user)
  await globalStore.setItem<string>('jwt-token', token);

  return user;
}

export async function signOut(): Promise<void> {
  await globalStore.removeItem('lumiroom-user')
  await globalStore.removeItem('jwt-token')
}

export async function updateUserProfile(
  updates: Partial<SupabaseUser>
): Promise<SupabaseUser> {
  const user = await fetchJson<SupabaseUser>(`${BASE_URL}api/auth/verifyOtp`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })
  await globalStore.setItem<SupabaseUser>('lumiroom-user', user);
  return user
}

export async function checkUsername(
  identifier: string
): Promise<boolean> {
  return await fetchJson<boolean>(`${BASE_URL}api/auth/checkUsername?identifier=${identifier}`, {
    method: 'GET'
  })
}

export async function findUserByIdentifierBlur(
  identifier: string
): Promise<SupabaseUser[]> {
  return await fetchJson<SupabaseUser[]>(`${BASE_URL}api/auth/checkUsername?query=${identifier}`, {
    method: 'GET'
  })
}