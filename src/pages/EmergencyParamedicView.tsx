import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  AlertTriangle,
  Heart,
  Pill,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { EmergencyService } from '../services/emergencyService';

interface EmergencyParamedicViewProps {
  tokenHash?: string;
  onBackToApp: () => void;
}

export const EmergencyParamedicView: React.FC<EmergencyParamedicViewProps> = ({
  tokenHash = 'cb_er_9a87f12e3b44c',
  onBackToApp,
}) => {
  const [accessResult, setAccessResult] = useState<ReturnType<typeof EmergencyService.verifyAndAccessData> | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated paramedic verification & retrieval
    const res = EmergencyService.verifyAndAccessData(tokenHash, {
      ip: '198.51.100.22',
      userAgent: 'Austin EMS First Responder iPad Pro / Mobile Safari',
      location: 'Emergency Triage Field Unit',
    });
    setAccessResult(res);
    setLoading(false);
  }, [tokenHash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Verifying Emergency Access Token...</p>
        </div>
      </div>
    );
  }

  if (!accessResult?.valid || !accessResult.data) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-800 border border-rose-500/30 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white">Emergency Token Invalid</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {accessResult?.reason || 'This emergency access token has either expired or been revoked by the patient.'}
          </p>
          <div className="pt-2">
            <button
              onClick={onBackToApp}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Back to Main Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { data } = accessResult;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Header Bar for First Responders */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToApp}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to CareBridge Portal</span>
          </button>
          <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Audit Logged: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Triage Banner */}
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-600/40 text-rose-200 flex items-start gap-3.5">
          <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider">
              Emergency Responder Minimum Triage Record
            </h1>
            <p className="text-xs text-rose-200/90 mt-0.5">
              Authorized emergency facts under CareBridge Safe Harbor. Token hash: <span className="font-mono text-white">{tokenHash}</span>
            </p>
          </div>
        </div>

        {/* Primary Identity Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-mono text-slate-400">ID: {data.patientIdentifier}</span>
              <h2 className="text-2xl font-black text-white mt-0.5">{data.patientName}</h2>
            </div>
            {/* Blood Group Hero Badge */}
            <div className="p-3 rounded-xl bg-rose-600 text-white text-center shadow-lg">
              <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Blood Type</div>
              <div className="text-2xl font-black tracking-tight">{data.bloodGroup}</div>
            </div>
          </div>

          {/* Organ Donor & Critical Indicators */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80 text-xs">
            {data.organDonor && (
              <span className="px-2.5 py-1 rounded-md bg-emerald-950/70 text-emerald-400 border border-emerald-700/50 flex items-center gap-1 font-semibold">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Registered Organ Donor</span>
              </span>
            )}
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium">
              CareBridge Verified Profile
            </span>
          </div>
        </div>

        {/* Critical Allergies (High Contrast Alert) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-rose-900/60 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Documented Anaphylactic & Drug Allergies</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {data.allergies.map((allergy, i) => (
              <span
                key={i}
                className="px-3 py-1.5 rounded-lg bg-rose-900/40 text-rose-200 border border-rose-600/40 text-xs font-semibold"
              >
                ⚠️ {allergy}
              </span>
            ))}
          </div>
        </div>

        {/* Emergency Primary Contact Card (with 1-Click Call) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Primary Emergency Contact
          </div>
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div>
              <div className="text-sm font-bold text-white">{data.primaryContact.name}</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">
                Relation: <span className="text-slate-200">{data.primaryContact.relation}</span>
              </div>
            </div>
            <a
              href={`tel:${data.primaryContact.phone}`}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Contact</span>
            </a>
          </div>
        </div>

        {/* Active Medications & Chronic Conditions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider">
              <Pill className="w-4 h-4 text-teal-400" />
              <span>Active Medications</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
              {data.activeMedications.map((med, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  <span>{med}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Chronic Conditions
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
              {data.chronicConditions.map((cond, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>{cond}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Critical Clinical Notes */}
        {data.criticalNotes && (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
            <div className="font-bold text-slate-400 uppercase tracking-wider">Additional Clinical Notes</div>
            <p className="text-slate-300 leading-relaxed">{data.criticalNotes}</p>
          </div>
        )}

        <div className="text-center pt-2 text-[11px] text-slate-500">
          CareBridge Paramedic Portal · Austin Emergency Medical Services Protocol
        </div>
      </div>
    </div>
  );
};
