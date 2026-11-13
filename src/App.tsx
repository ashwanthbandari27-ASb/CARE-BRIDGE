/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { MainLayout } from './components/MainLayout';
import { LandingPage } from './pages/LandingPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { DonorDashboard } from './pages/DonorDashboard';
import { EmergencyParamedicView } from './pages/EmergencyParamedicView';
import { SupabaseModal } from './components/SupabaseModal';
import { AuthModal } from './components/AuthModal';
import { BookingModal } from './components/BookingModal';
import { Doctor } from './types';

function MainAppContent() {
  const { currentRole } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('landing');
  const [showSupabaseModal, setShowSupabaseModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false);
  const [activeEmergencyToken, setActiveEmergencyToken] = useState<string>('cb_er_9a87f12e3b44c');

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookDoctor = (doc: Doctor) => {
    setBookingDoctor(doc);
    setShowBookingModal(true);
  };

  const handleOpenEmergencyPreview = (tokenHash: string = 'cb_er_9a87f12e3b44c') => {
    setActiveEmergencyToken(tokenHash);
    setCurrentView('emergency_paramedic');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <MainLayout
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenSupabase={() => setShowSupabaseModal(true)}
        onOpenEmergencyPreview={() => handleOpenEmergencyPreview('cb_er_9a87f12e3b44c')}
        hideHeader={currentView === 'emergency_paramedic'}
      >
        {currentView === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onBookDoctor={handleBookDoctor}
            onOpenEmergencyPreview={() => handleOpenEmergencyPreview('cb_er_9a87f12e3b44c')}
          />
        )}

        {currentView === 'patient' && (
          <PatientDashboard onOpenEmergencyParamedic={handleOpenEmergencyPreview} />
        )}

        {currentView === 'doctor' && <DoctorDashboard />}

        {currentView === 'admin' && <AdminDashboard />}

        {currentView === 'donor' && <DonorDashboard />}

        {currentView === 'emergency_paramedic' && (
          <EmergencyParamedicView
            tokenHash={activeEmergencyToken}
            onBackToApp={() => handleNavigate('landing')}
          />
        )}
      </MainLayout>

      {/* Modals */}
      <SupabaseModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          if (currentRole) handleNavigate(currentRole);
        }}
      />

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setBookingDoctor(null);
        }}
        preselectedDoctor={bookingDoctor}
        onBookingSuccess={() => {
          // If in patient view, data automatically updates via event bus
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainAppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
