import React, { useState, useEffect } from 'react';
import {
  Users,
  Stethoscope,
  HeartHandshake,
  Calendar,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
  FileText,
  Mail,
  Database,
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AdminService, AdminAnalytics } from '../services/adminService';
import { AppDataStore } from '../services/store';
import { Doctor, UserProfile, Appointment, Department, ContactMessage, AuditLog } from '../types';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics>(AdminService.getAnalytics());
  const [doctors, setDoctors] = useState<Doctor[]>(AppDataStore.getDoctors());
  const [profiles, setProfiles] = useState<UserProfile[]>(AppDataStore.getProfiles());
  const [appointments, setAppointments] = useState<Appointment[]>(AppDataStore.getAppointments());
  const [departments, setDepartments] = useState<Department[]>(AppDataStore.getDepartments());
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(AdminService.getContactMessages());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(AdminService.getAuditLogs());

  const [activeTab, setActiveTab] = useState<
    'analytics' | 'doctors' | 'users' | 'appointments' | 'departments' | 'messages' | 'audit'
  >('analytics');

  // New Department Form state
  const [showAddDept, setShowAddDept] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  const refreshAll = () => {
    setAnalytics(AdminService.getAnalytics());
    setDoctors(AppDataStore.getDoctors());
    setProfiles(AppDataStore.getProfiles());
    setAppointments(AppDataStore.getAppointments());
    setDepartments(AppDataStore.getDepartments());
    setContactMessages(AdminService.getContactMessages());
    setAuditLogs(AdminService.getAuditLogs());
  };

  const handleApproveDoctor = (id: string) => {
    AdminService.approveDoctor(id);
    refreshAll();
  };

  const handleRejectDoctor = (id: string) => {
    AdminService.rejectDoctor(id);
    refreshAll();
  };

  const handleResolveMessage = (id: string) => {
    AdminService.markMessageResolved(id);
    refreshAll();
  };

  const handleCreateDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) return;
    AdminService.addDepartment({
      name: deptName,
      code: deptCode.toUpperCase(),
      headOfDepartment: deptHead || 'Clinical Lead',
      description: deptDesc || 'Specialized clinical care continuity department.',
      icon: 'Activity',
      isActive: true,
    });
    setDeptName('');
    setDeptCode('');
    setDeptHead('');
    setDeptDesc('');
    setShowAddDept(false);
    refreshAll();
  };

  // Recharts Data
  const chartData = [
    { name: 'Cardiology', appointments: 18, consultations: 14 },
    { name: 'Neurology', appointments: 12, consultations: 10 },
    { name: 'Orthopedics', appointments: 9, consultations: 7 },
    { name: 'Pediatrics', appointments: 15, consultations: 13 },
    { name: 'Endocrine', appointments: 8, consultations: 8 },
  ];

  const pieData = [
    { name: 'Patients', value: analytics.totalPatients, color: '#0d9488' },
    { name: 'Doctors', value: analytics.totalDoctors, color: '#0284c7' },
    { name: 'Donors', value: analytics.totalDonors, color: '#e11d48' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Admin Top Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold text-slate-900">CareBridge Central Administration</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                PostgreSQL system governance, doctor credential verification, and HIPAA audit trails.
              </p>
            </div>

            {/* Quick KPI count badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200">
                {analytics.pendingDoctorApprovals} Pending Doctor Review(s)
              </span>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-1 overflow-x-auto pt-6 border-t border-slate-100 mt-6 scrollbar-none">
            {[
              { id: 'analytics', label: 'Platform Analytics' },
              { id: 'doctors', label: `Doctor Verifications (${doctors.length})` },
              { id: 'users', label: `Users (${profiles.length})` },
              { id: 'appointments', label: `Appointments (${appointments.length})` },
              { id: 'departments', label: `Departments (${departments.length})` },
              { id: 'messages', label: `Support Messages (${contactMessages.length})` },
              { id: 'audit', label: `Audit Trail (${auditLogs.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* TAB 1: ANALYTICS & CHARTS */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* KPI Metric Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Registered Patients</div>
                <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{analytics.totalPatients}</div>
                <div className="text-[11px] text-teal-600 font-medium mt-0.5">360° Records Active</div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Certified Physicians</div>
                <div className="text-2xl font-black text-blue-600 mt-1 tabular-nums">{analytics.totalDoctors}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{analytics.approvedDoctors} Approved</div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Active Donors</div>
                <div className="text-2xl font-black text-rose-600 mt-1 tabular-nums">{analytics.totalDonors}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Blood & Organ Pledges</div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">Care Gaps Resolved</div>
                <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">{analytics.closedCareGaps}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{analytics.openCareGaps} Under Surveillance</div>
              </div>
            </div>

            {/* Recharts Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Department Volume Bar Chart */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Clinical Encounters by Department</h3>
                  <span className="text-xs text-slate-500 font-medium">Appointments vs Consultations</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="appointments" fill="#0d9488" radius={[4, 4, 0, 0]} name="Appointments" />
                      <Bar dataKey="consultations" fill="#0284c7" radius={[4, 4, 0, 0]} name="Consultations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* User Distribution Pie Chart */}
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">User Role Distribution</h3>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                    <span>Patients ({analytics.totalPatients})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>Doctors ({analytics.totalDoctors})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    <span>Donors ({analytics.totalDonors})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCTOR CREDENTIAL APPROVALS */}
        {activeTab === 'doctors' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Doctor Credential & License Verification</h2>
              <p className="text-xs text-slate-500">
                To guarantee patient safety, all physician accounts require administrator verification of their state medical license.
              </p>
            </div>

            <div className="space-y-3">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{doc.profile?.fullName || doc.specialty}</span>
                      <span className="font-mono text-slate-500">License: {doc.medicalLicenseNumber}</span>
                    </div>
                    <div className="text-slate-600">
                      {doc.qualification} · {doc.experienceYears}y experience · Fee: ${doc.consultationFee.toFixed(2)}
                    </div>
                    <div className="text-teal-700 font-semibold">{doc.specialty}</div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {doc.isApprovedByAdmin ? (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Approved</span>
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleApproveDoctor(doc.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shadow-xs"
                        >
                          Approve License
                        </button>
                        <button
                          onClick={() => handleRejectDoctor(doc.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-semibold transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: REGISTERED USERS */}
        {activeTab === 'users' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">User Account Directory</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">City</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-900">{p.fullName}</td>
                      <td className="py-3 text-slate-600 font-mono">{p.email}</td>
                      <td className="py-3 capitalize">
                        <span className="px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                          {p.role}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{p.city || 'Austin'}</td>
                      <td className="py-3">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: APPOINTMENTS OVERSIGHT */}
        {activeTab === 'appointments' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">All Scheduled Consultations</h2>
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div key={apt.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{apt.patientName} with {apt.doctorName}</div>
                    <div className="text-slate-500 mt-0.5">{apt.chiefComplaint}</div>
                    <div className="text-slate-400 font-mono mt-0.5">{apt.appointmentDate} · {apt.startTime.slice(0, 5)} - {apt.endTime.slice(0, 5)}</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md font-bold uppercase text-[10px] bg-slate-200 text-slate-800">
                    {apt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: MEDICAL DEPARTMENTS */}
        {activeTab === 'departments' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Hospital Departments</h2>
                <p className="text-xs text-slate-500">Configure medical centers and clinical division heads.</p>
              </div>
              <button
                onClick={() => setShowAddDept(!showAddDept)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Department</span>
              </button>
            </div>

            {showAddDept && (
              <form onSubmit={handleCreateDept} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Department Name</label>
                    <input
                      type="text"
                      required
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      placeholder="e.g. Oncology & Infusion"
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Code</label>
                    <input
                      type="text"
                      required
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      placeholder="e.g. ONC"
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Head of Department</label>
                    <input
                      type="text"
                      value={deptHead}
                      onChange={(e) => setDeptHead(e.target.value)}
                      placeholder="e.g. Dr. Jordan Hayes, MD"
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
                >
                  Save Department
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{dept.name}</span>
                    <span className="font-mono text-teal-700 font-bold">{dept.code}</span>
                  </div>
                  <div className="text-slate-500">{dept.headOfDepartment}</div>
                  <p className="text-slate-600 text-[11px] leading-relaxed pt-1">{dept.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CONTACT MESSAGES */}
        {activeTab === 'messages' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Support & Clinic Outreach Inquiries</h2>
            <div className="space-y-3">
              {contactMessages.map((msg) => (
                <div key={msg.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">{msg.name}</span>
                      <span className="text-slate-500 ml-2 font-mono">({msg.email})</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800">{msg.subject}</div>
                  <p className="text-slate-600 leading-relaxed">{msg.message}</p>
                  <div className="pt-2 flex justify-end">
                    {msg.status === 'unread' ? (
                      <button
                        onClick={() => handleResolveMessage(msg.id)}
                        className="px-3 py-1 rounded bg-teal-600 text-white font-semibold hover:bg-teal-700"
                      >
                        Mark Handled
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: IMMUTABLE AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">HIPAA & System Security Audit Trail</h2>
                <p className="text-xs text-slate-500">
                  Tamper-resistant log of logins, prescription creations, role changes, and emergency QR tokens.
                </p>
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs max-h-[500px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-slate-900 text-slate-100 flex items-start justify-between gap-4">
                  <div>
                    <span className="text-teal-400 font-bold">[{log.action}]</span>
                    <span className="text-slate-300 ml-2">{log.actorName || 'System'}</span>
                    <div className="text-[11px] text-slate-400 mt-1 font-sans">
                      Entity: {log.entityType} · Details: {JSON.stringify(log.details)}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
