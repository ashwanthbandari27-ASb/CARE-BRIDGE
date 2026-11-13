import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { AppDataStore } from '../services/store';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSupabaseLive: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  loginAsDemoRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  register: (data: {
    fullName: string;
    email: string;
    role: UserRole;
    phone?: string;
    city?: string;
    specialty?: string;
    bloodGroup?: string;
  }) => Promise<{ success: boolean; message: string }>;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isSupabaseLive = isSupabaseConfigured();

  // Load existing session from storage
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const storedUserId = localStorage.getItem('carebridge_active_user_id');
        const profiles = AppDataStore.getProfiles();

        if (storedUserId) {
          const user = profiles.find((p) => p.id === storedUserId);
          if (user) {
            setCurrentUser(user);
          } else {
            // Default to demo patient if user was deleted
            setCurrentUser(profiles[0] || null);
          }
        } else {
          // Default to Eleanor Vance for immediate interactive exploration
          const defaultPatient = profiles.find((p) => p.role === 'patient') || profiles[0];
          if (defaultPatient) {
            setCurrentUser(defaultPatient);
            localStorage.setItem('carebridge_active_user_id', defaultPatient.id);
          }
        }
      } catch (err) {
        console.error('Failed to initialize CareBridge authentication:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, roleHint?: UserRole): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (isSupabaseLive && supabase) {
        // Live Supabase flow (if configured)
        const { data, error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        // In otp flow, notification sent
      }

      // Find in profiles database
      const profiles = AppDataStore.getProfiles();
      let match = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

      if (!match && roleHint) {
        match = profiles.find((p) => p.role === roleHint);
      }

      if (match) {
        setCurrentUser(match);
        localStorage.setItem('carebridge_active_user_id', match.id);
        setIsLoading(false);
        return true;
      }

      // If user not found, create a patient profile
      const newProfile: UserProfile = {
        id: 'usr_' + Date.now(),
        email,
        fullName: email.split('@')[0],
        role: roleHint || 'patient',
        isVerified: true,
        isActive: true,
        languagePreference: 'en',
        createdAt: new Date().toISOString(),
      };
      const updated = [newProfile, ...profiles];
      AppDataStore.setProfiles(updated);
      setCurrentUser(newProfile);
      localStorage.setItem('carebridge_active_user_id', newProfile.id);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      return false;
    }
  };

  const loginAsDemoRole = (role: UserRole) => {
    const profiles = AppDataStore.getProfiles();
    const found = profiles.find((p) => p.role === role);
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('carebridge_active_user_id', found.id);
    }
  };

  const switchRole = (role: UserRole) => {
    loginAsDemoRole(role);
  };

  const logout = async () => {
    if (isSupabaseLive && supabase) {
      await supabase.auth.signOut();
    }
    setCurrentUser(null);
    localStorage.removeItem('carebridge_active_user_id');
  };

  const register = async (data: {
    fullName: string;
    email: string;
    role: UserRole;
    phone?: string;
    city?: string;
    specialty?: string;
    bloodGroup?: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const profiles = AppDataStore.getProfiles();
      if (profiles.some((p) => p.email.toLowerCase() === data.email.toLowerCase())) {
        return { success: false, message: 'An account with this email address already exists.' };
      }

      const profileId = 'usr_' + Date.now();
      const newProfile: UserProfile = {
        id: profileId,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        phone: data.phone,
        city: data.city || 'Austin',
        languagePreference: 'en',
        isVerified: data.role !== 'doctor', // Doctors require administrator approval
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      AppDataStore.setProfiles([newProfile, ...profiles]);

      if (data.role === 'patient') {
        const patients = AppDataStore.getPatients();
        const newPatient = {
          id: 'pat_' + Date.now(),
          profileId,
          patientIdentifier: `CB-PAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          bloodGroup: (data.bloodGroup as any) || 'O+',
          allergies: [],
          chronicConditions: [],
          primaryLanguage: 'English',
        };
        AppDataStore.setPatients([newPatient, ...patients]);
      } else if (data.role === 'doctor') {
        const doctors = AppDataStore.getDoctors();
        const newDoctor = {
          id: 'doc_' + Date.now(),
          profileId,
          doctorIdentifier: `CB-DOC-${Math.floor(100 + Math.random() * 900)}`,
          departmentId: 'd1111111-1111-1111-1111-111111111111',
          departmentName: data.specialty || 'General Medicine',
          specialty: data.specialty || 'General Physician',
          medicalLicenseNumber: `TX-LIC-${Math.floor(10000 + Math.random() * 90000)}`,
          experienceYears: 5,
          qualification: 'MD, Board Certified',
          consultationFee: 100,
          bio: 'Dedicated clinician committed to patient-centered care continuity and proactive chronic disease monitoring.',
          isApprovedByAdmin: false, // Requires admin approval!
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          slotDurationMinutes: 30,
        };
        AppDataStore.setDoctors([newDoctor, ...doctors]);
      } else if (data.role === 'donor') {
        const donors = AppDataStore.getDonors();
        const newDonor = {
          id: 'don_' + Date.now(),
          profileId,
          bloodGroup: (data.bloodGroup as any) || 'O+',
          isAvailableForBlood: true,
          organPledgeRegistered: false,
          organPledgeTypes: [],
          city: data.city || 'Austin',
          contactSharingConsent: true,
          totalDonations: 0,
        };
        AppDataStore.setDonors([newDonor, ...donors]);
      }

      setCurrentUser(newProfile);
      localStorage.setItem('carebridge_active_user_id', newProfile.id);

      return {
        success: true,
        message:
          data.role === 'doctor'
            ? 'Doctor registration submitted. Administrator approval is pending.'
            : 'Registration successful! Welcome to CareBridge.',
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Registration failed.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        isLoading,
        isSupabaseLive,
        login,
        loginAsDemoRole,
        logout,
        register,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
