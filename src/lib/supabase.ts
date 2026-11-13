import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

// Verify if valid Supabase configuration is present
export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl === 'MY_SUPABASE_URL' || supabaseAnonKey === 'MY_SUPABASE_KEY') return false;
  try {
    const url = new URL(supabaseUrl);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

// Create real Supabase client if configured, otherwise null
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * EventBus for Realtime State Synchronization
 * When running in connected Supabase mode, this mirrors Supabase Realtime channels.
 * When running in clearly-labelled Local Demo mode, this ensures all dashboards
 * (Doctor, Patient, Admin, Donor) receive instant updates on new appointments,
 * prescriptions, care gaps, blood requests, and notifications without page refresh.
 */
type Listener = (payload: unknown) => void;

class RealtimeEventBus {
  private listeners: Map<string, Set<Listener>> = new Map();

  subscribe(event: string, callback: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  emit(event: string, payload: unknown) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(payload);
        } catch (err) {
          console.error(`Error executing event bus listener for ${event}:`, err);
        }
      });
    }
  }
}

export const realtimeBus = new RealtimeEventBus();
