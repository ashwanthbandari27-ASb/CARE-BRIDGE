import React, { useState } from 'react';
import {
  Bell,
  Database,
  Globe,
  Eye,
  LogOut,
  User,
  Shield,
  Stethoscope,
  HeartHandshake,
  Check,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageCode } from '../i18n/translations';
import { AppDataStore } from '../services/store';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenSupabase: () => void;
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenSupabase, currentView, onNavigate }) => {
  const { currentUser, currentRole, isAuthenticated, logout, switchRole } = useAuth();
  const { language, setLanguage, t, easyAccessMode, toggleEasyAccessMode } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const notifications = AppDataStore.getNotifications();
  const userNotifs = currentUser
    ? notifications.filter((n) => n.recipientProfileId === currentUser.id && !n.isRead)
    : [];

  const handleRoleSelect = (role: 'patient' | 'doctor' | 'admin' | 'donor') => {
    switchRole(role);
    setShowRoleMenu(false);
    setShowMobileMenu(false);
    onNavigate(role);
  };

  const navigateToSection = (sectionId: string) => {
    setShowMobileMenu(false);
    onNavigate('landing');
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const getDashboardPath = () => {
    if (!currentRole) return 'patient';
    return currentRole;
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'admin':
        return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'donor':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      default:
        return 'text-teal-700 bg-teal-50 border-teal-200';
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Mobile Navigation Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowMobileMenu((prev) => !prev)}
            className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label={showMobileMenu ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={showMobileMenu}
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Zone 1: Brand Wordmark (Single text element, no adjacent secondary badges) */}
          <button
            type="button"
            onClick={() => {
              setShowMobileMenu(false);
              onNavigate('landing');
            }}
            className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-1.5 focus:outline-none"
          >
            <span className="text-teal-600">Care</span>
            <span>Bridge</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block mb-1" />
          </button>
        </div>

        {/* Zone 2: 4–5 single-line clean text nav links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-slate-900 ${
              currentView === 'landing' ? 'text-teal-700 font-semibold' : ''
            }`}
          >
            {t('nav_home')}
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('departments-section')}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-900"
          >
            {t('nav_departments')}
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('doctors-section')}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-900"
          >
            {t('nav_doctors')}
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('how-it-works-section')}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-900"
          >
            {t('nav_how_it_works')}
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('emergency-section')}
            className="whitespace-nowrap shrink-0 transition-colors hover:text-slate-900"
          >
            {t('nav_emergency')}
          </button>
        </nav>

        {/* Zone 3: Primary Action + Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Easy Access Mode Toggle */}
          <button
            onClick={toggleEasyAccessMode}
            title={easyAccessMode ? 'Disable Easy Access Mode' : 'Enable Easy Access Mode (Larger Text)'}
            className={`p-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              easyAccessMode
                ? 'bg-teal-100 text-teal-800 border border-teal-300'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="hidden xl:inline text-xs">{easyAccessMode ? 'A+' : 'A'}</span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-medium"
              title="Switch Language"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase text-xs font-semibold">{language}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                {(['en', 'hi', 'te'] as LanguageCode[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      setLanguage(code);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 ${
                      language === code ? 'text-teal-600 font-semibold bg-teal-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>{code === 'en' ? 'English' : code === 'hi' ? 'हिंदी' : 'తెలుగు'}</span>
                    {language === code && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Database Setup Status Trigger */}
          <button
            onClick={onOpenSupabase}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            title="Supabase Database Status"
          >
            <Database className="w-4 h-4 text-teal-600" />
            <span className="hidden lg:inline text-xs font-medium text-slate-600">Database</span>
          </button>

          {/* Notifications Dropdown (if authenticated) */}
          {isAuthenticated && (
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {userNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">{t('notifications')}</span>
                    <span className="text-[11px] text-slate-400 tabular-nums">{userNotifs.length} new</span>
                  </div>
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {userNotifs.length === 0 ? (
                      <p className="text-xs text-slate-500 py-3 text-center">{t('no_notifications')}</p>
                    ) : (
                      userNotifs.map((n) => (
                        <div key={n.id} className="p-2 rounded-lg bg-slate-50 hover:bg-teal-50/50 transition-colors">
                          <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Authenticated User Menu or Access Portal Button */}
          {isAuthenticated && currentUser ? (
            <div className="relative">
              <div className="flex items-center gap-2">
                {/* 1-Click Role Switcher Pill */}
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${getRoleBadgeStyle(
                    currentRole || 'patient'
                  )}`}
                >
                  <span className="capitalize">{currentRole || 'User'}</span>
                  <span className="text-[10px] text-slate-400">▼</span>
                </button>

                {/* Primary Action Button: Enter Dashboard */}
                <button
                  onClick={() => onNavigate(getDashboardPath())}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
                >
                  {currentView === 'landing' ? 'Open Dashboard' : 'My Portal'}
                </button>
              </div>

              {/* Role Dropdown */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <div className="text-xs font-bold text-slate-900 truncate">{currentUser.fullName}</div>
                    <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                  </div>

                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Test Persona
                  </div>

                  <button
                    onClick={() => handleRoleSelect('patient')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-teal-50 flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span>Patient (Eleanor Vance)</span>
                  </button>

                  <button
                    onClick={() => handleRoleSelect('doctor')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                    <span>Doctor (Dr. David Chen)</span>
                  </button>

                  <button
                    onClick={() => handleRoleSelect('admin')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-purple-50 flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    <span>System Administrator</span>
                  </button>

                  <button
                    onClick={() => handleRoleSelect('donor')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-rose-600" />
                    <span>Donor (Liam Gallagher)</span>
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              {t('btn_portal')}
            </button>
          )}
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {showMobileMenu && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg"
        >
          <button
            type="button"
            onClick={() => {
              setShowMobileMenu(false);
              onNavigate('landing');
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'landing'
                ? 'bg-teal-50 text-teal-700 font-semibold'
                : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t('nav_home')}
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('departments-section')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {t('nav_departments')}
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('doctors-section')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {t('nav_doctors')}
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('how-it-works-section')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {t('nav_how_it_works')}
          </button>
          <button
            type="button"
            onClick={() => navigateToSection('emergency-section')}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {t('nav_emergency')}
          </button>

          {isAuthenticated && (
            <div className="pt-2 mt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleRoleSelect('patient')}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 text-left"
              >
                Patient Portal
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('doctor')}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 text-left"
              >
                Doctor Portal
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('admin')}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 text-left"
              >
                Admin Control
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('donor')}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 text-left"
              >
                Donor Hub
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
};
