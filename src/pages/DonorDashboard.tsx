import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Heart,
  Droplet,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Bell,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { AppDataStore } from '../services/store';
import { BloodService } from '../services/bloodService';
import { Donor, BloodRequest } from '../types';

export const DonorDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const donors = AppDataStore.getDonors();

  const activeDonor: Donor =
    donors.find((d) => d.profileId === currentUser?.id) || donors[0];

  const [isAvailable, setIsAvailable] = useState<boolean>(activeDonor?.isAvailableForBlood ?? true);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [organPledgeTypes, setOrganPledgeTypes] = useState<string[]>(
    activeDonor?.organPledgeTypes || ['Cornea', 'Kidney', 'Bone Marrow']
  );
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const refreshRequests = () => {
    setBloodRequests(BloodService.getBloodRequests());
  };

  useEffect(() => {
    refreshRequests();
  }, []);

  const handleToggleAvailability = () => {
    const nextVal = !isAvailable;
    setIsAvailable(nextVal);
    const updated = donors.map((d) => (d.id === activeDonor.id ? { ...d, isAvailableForBlood: nextVal } : d));
    AppDataStore.setDonors(updated);
  };

  const handleAcceptRequest = (requestId: string) => {
    const res = BloodService.acceptBloodRequest(requestId, activeDonor.id, currentUser?.fullName || 'Verified Donor');
    setStatusMsg(res.message);
    refreshRequests();
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleSaveOrganPledge = () => {
    const res = BloodService.registerOrganPledge(activeDonor.id, organPledgeTypes, true);
    setStatusMsg(res.message);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const toggleOrganType = (type: string) => {
    if (organPledgeTypes.includes(type)) {
      setOrganPledgeTypes(organPledgeTypes.filter((t) => t !== type));
    } else {
      setOrganPledgeTypes([...organPledgeTypes, type]);
    }
  };

  // Matching requests based on blood group compatibility
  const matchingRequests = bloodRequests.filter((r) => {
    if (r.status !== 'open') return false;
    // O- can donate to all; exact matches always match
    if (activeDonor.bloodGroup === 'O-') return true;
    return r.bloodGroup === activeDonor.bloodGroup;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Donor Top Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                {activeDonor.bloodGroup}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900">{currentUser?.fullName || 'Liam Gallagher'}</h1>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                    Verified Donor
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Location: <strong className="text-slate-800">{activeDonor.city}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Total Life Donations: <strong className="text-rose-700 tabular-nums">{activeDonor.totalDonations}</strong></span>
                  <span aria-hidden="true">·</span>
                  <span>Eligibility: <strong className="text-emerald-700">Eligible Now</strong></span>
                </div>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">Rapid Response Dispatch:</span>
              <button
                onClick={handleToggleAvailability}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  isAvailable
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {isAvailable ? '✓ Available for Emergency Dispatch' : 'Unavailable / On Standby'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {statusMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Matching Urgent Blood Requests */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">Matching Blood Needs</div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                Hospital Requests Compatible with {activeDonor.bloodGroup} in {activeDonor.city}
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">
              {matchingRequests.length} Active Request(s)
            </span>
          </div>

          <div className="space-y-3">
            {matchingRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-xs text-slate-500">
                No open emergency requests for {activeDonor.bloodGroup} at this time. You will receive an immediate
                push notification when an urgent need arises nearby.
              </div>
            ) : (
              matchingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-xl bg-rose-50/40 border border-rose-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-rose-800">
                        {req.bloodGroup} · {req.unitsRequired} Unit(s) Needed
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          req.urgency === 'critical_stat'
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {req.urgency.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900">{req.hospitalName}, {req.city}</div>
                    <div className="text-slate-500">Patient: {req.patientName} · Coordinator: {req.contactPhone}</div>
                  </div>

                  <button
                    onClick={() => handleAcceptRequest(req.id)}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs self-start sm:self-auto"
                  >
                    Accept & Commit Donation
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Organ Donor Pledge Registry Card */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Heart className="w-5 h-5 fill-current" />
              <h2 className="text-base font-bold text-slate-900">CareBridge Organ Pledge Registry</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Registering your organ donation intent coordinates verified records with hospitals during critical trauma
              evaluations. Select the tissue types you wish to authorize for donation:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs">
              {['Cornea / Eyes', 'Kidneys', 'Heart Valves', 'Liver Tissue', 'Bone Marrow', 'Lungs'].map((tissue) => {
                const isSelected = organPledgeTypes.includes(tissue);
                return (
                  <button
                    key={tissue}
                    type="button"
                    onClick={() => toggleOrganType(tissue)}
                    className={`p-3 rounded-xl border text-left font-medium transition-all ${
                      isSelected
                        ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{tissue}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-rose-600" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Legally binding digital pledge in PostgreSQL registry</span>
              </div>
              <button
                onClick={handleSaveOrganPledge}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Update Pledge Preferences
              </button>
            </div>
          </div>

          {/* Donation History Strip */}
          <div className="md:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Your Donation Milestones</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-500">Last Whole Blood Donation</div>
                <div className="font-bold text-slate-900 mt-0.5">{activeDonor.lastDonationDate || '2026-08-15'}</div>
                <div className="text-emerald-700 font-semibold text-[11px] mt-1">✓ Next Eligible Donation: Available Now</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-slate-500">CareBridge Impact Recognition</div>
                <div className="font-bold text-slate-900 mt-0.5">Gold Tier Humanitarian Donor</div>
                <div className="text-slate-500 text-[11px] mt-1">7 lives touched across Austin medical centers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
