import React, { useState } from 'react';
import { X, User, Stethoscope, ShieldCheck, HeartHandshake, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login', onSuccess }) => {
  const { login, register, loginAsDemoRole } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [statusMsg, setStatusMsg] = useState<{ text: string; error: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDemoLogin = (selectedRole: UserRole) => {
    loginAsDemoRole(selectedRole);
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    if (mode === 'login') {
      if (!email.trim()) {
        setStatusMsg({ text: 'Please enter a valid email address.', error: true });
        setIsSubmitting(false);
        return;
      }
      const ok = await login(email, role);
      if (ok) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setStatusMsg({ text: 'Login failed. Please check credentials or use demo roles.', error: true });
      }
    } else {
      if (!fullName.trim() || !email.trim()) {
        setStatusMsg({ text: 'Please provide full name and email.', error: true });
        setIsSubmitting(false);
        return;
      }
      const res = await register({
        fullName,
        email,
        role,
        phone,
        specialty,
        bloodGroup,
      });
      if (res.success) {
        setStatusMsg({ text: res.message, error: false });
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 1200);
      } else {
        setStatusMsg({ text: res.message, error: true });
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {mode === 'login' ? 'Sign In to CareBridge' : 'Create CareBridge Account'}
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Connect care. Close gaps. Support better journeys.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 1-Click Fast Demo Login Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Instant 1-Click Test Personas
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('patient')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700">Eleanor Vance</div>
                  <div className="text-[11px] text-slate-500">Patient Dashboard</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('doctor')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">Dr. David Chen</div>
                  <div className="text-[11px] text-slate-500">Cardiology Doctor</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700">System Admin</div>
                  <div className="text-[11px] text-slate-500">Admin Control</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('donor')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 text-left transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-rose-700">Liam Gallagher</div>
                  <div className="text-[11px] text-slate-500">Donor (O+ / Pledge)</div>
                </div>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] text-slate-400 uppercase tracking-widest font-medium">
              Or Sign In With Email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@carebridge.org"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Select Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                  >
                    <option value="patient">Patient</option>
                    <option value="doctor">Doctor (Requires Admin Approval)</option>
                    <option value="donor">Blood & Organ Donor</option>
                  </select>
                </div>

                {role === 'doctor' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Medical Specialty</label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="e.g. Cardiologist, Neurologist, Pediatrics"
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                )}

                {(role === 'patient' || role === 'donor') && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Blood Group</label>
                    <select
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {statusMsg && (
              <div
                className={`p-3 rounded-lg text-xs ${
                  statusMsg.error
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {statusMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>{mode === 'login' ? 'Continue with Email' : 'Register Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center pt-2">
            {mode === 'login' ? (
              <p className="text-xs text-slate-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setStatusMsg(null);
                  }}
                  className="text-teal-600 font-semibold hover:underline"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-600">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setStatusMsg(null);
                  }}
                  className="text-teal-600 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
