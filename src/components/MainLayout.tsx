import React from 'react';
import {
  ArrowLeft,
  Database,
  HeartHandshake,
  QrCode,
  Shield,
  Stethoscope,
  User,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { useAuth } from '../auth/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: () => void;
  onOpenSupabase: () => void;
  onOpenEmergencyPreview?: () => void;
  hideHeader?: boolean;
}

const PORTAL_META: Record<
  string,
  {
    label: string;
    subtitle: string;
    accentClass: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  patient: {
    label: 'Patient Continuity Portal',
    subtitle: 'Health journey, care gaps, prescriptions & emergency QR',
    accentClass: 'text-teal-700 bg-teal-50 border-teal-200',
    Icon: User,
  },
  doctor: {
    label: 'Clinician Workspace',
    subtitle: 'Assigned visits, vitals, clinical notes & lab ordering',
    accentClass: 'text-blue-700 bg-blue-50 border-blue-200',
    Icon: Stethoscope,
  },
  admin: {
    label: 'Hospital Administration',
    subtitle: 'Credential verification, analytics & audit compliance',
    accentClass: 'text-purple-700 bg-purple-50 border-purple-200',
    Icon: Shield,
  },
  donor: {
    label: 'Blood & Organ Donor Hub',
    subtitle: 'Urgent blood matching & organ pledge registry',
    accentClass: 'text-rose-700 bg-rose-50 border-rose-200',
    Icon: HeartHandshake,
  },
};

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenSupabase,
  onOpenEmergencyPreview,
  hideHeader = false,
}) => {
  const { isSupabaseLive } = useAuth();
  const portalMeta = PORTAL_META[currentView];
  const isPortalView = Boolean(portalMeta);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Accessible Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-slate-900 focus:text-white focus:text-xs focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Persistent Header & Navigation Wrapper */}
      {!hideHeader && (
        <div className="sticky top-0 z-40">
          <Navbar
            onOpenAuth={onOpenAuth}
            onOpenSupabase={onOpenSupabase}
            currentView={currentView}
            onNavigate={onNavigate}
          />

          {/* Secondary Clinical Portal Context Bar for Role Dashboards */}
          {isPortalView && portalMeta && (
            <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200/80">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onNavigate('landing')}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Public Home</span>
                  </button>

                  <span className="hidden sm:inline-block h-4 w-px bg-slate-200" aria-hidden="true" />

                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-semibold shrink-0 ${portalMeta.accentClass}`}
                    >
                      <portalMeta.Icon className="w-3.5 h-3.5" />
                      <span>{portalMeta.label}</span>
                    </span>
                    <span className="hidden lg:inline text-xs text-slate-500 truncate">
                      {portalMeta.subtitle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onOpenEmergencyPreview && (
                    <button
                      type="button"
                      onClick={onOpenEmergencyPreview}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Emergency QR View</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onOpenSupabase}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200/80 transition-colors"
                    title="Inspect database connection details"
                  >
                    <Database className="w-3.5 h-3.5 text-teal-600" />
                    <span>{isSupabaseLive ? 'Supabase Connected' : 'Local Demo Mode'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Content Viewport */}
      <main id="main-content" className="flex-1 w-full">
        {children}
      </main>

      {/* Portal Footer (LandingPage renders its own full marketing footer) */}
      {!hideHeader && currentView !== 'landing' && (
        <footer className="bg-white border-t border-slate-200 py-5 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">
                <span className="text-teal-600">Care</span>Bridge
              </span>
              <span className="text-slate-300">·</span>
              <span>Connect care. Close gaps. Support better journeys.</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
              CLINICAL DEMO NOTICE: Fictional healthcare records for continuity workflow demonstration only. Not a
              substitute for licensed medical advice or emergency dispatch.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
};
