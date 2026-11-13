import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, ExternalLink, X, Shield, Terminal } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const isConnected = isSupabaseConfigured();

  if (!isOpen) return null;

  const envSnippet = `VITE_SUPABASE_URL="https://your-project-id.supabase.co"\nVITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi..."`;

  const copySnippet = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Supabase PostgreSQL Integration</h3>
              <p className="text-xs text-slate-300 mt-0.5">Database status & setup instructions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isConnected
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-semibold text-sm">
                {isConnected ? 'Supabase Database Connected' : 'Local Demo Mode Active (No Cloud Credentials)'}
              </h4>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {isConnected
                  ? 'CareBridge is actively connected to your remote Supabase PostgreSQL project with realtime updates and RLS policies.'
                  : 'Operating in a safe, fully functional local mode with realistic clinical records, role switching, care gap engine, pharmacy orders, and emergency QR.'}
              </p>
            </div>
          </div>

          {/* Setup Guide */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              How to Connect Your Supabase Project
            </h4>
            <ol className="mt-3 space-y-3 text-xs text-slate-700 leading-relaxed list-decimal list-inside">
              <li>
                Create a free project at{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-600 font-medium inline-flex items-center gap-1 hover:underline"
                >
                  supabase.com <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                In your Supabase project dashboard, open <strong className="font-semibold">Project Settings → API</strong>.
              </li>
              <li>
                Copy your <strong className="font-semibold">Project URL</strong> and{' '}
                <strong className="font-semibold">Project API Key (anon / public)</strong>.
              </li>
              <li>
                Set the keys in your environment file or deployment secrets:
              </li>
            </ol>
          </div>

          {/* Code block */}
          <div className="relative bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
            <button
              onClick={copySnippet}
              className="absolute top-3 right-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied' : 'Copy'}
            </button>
            <pre>{envSnippet}</pre>
          </div>

          {/* SQL Migrations Location */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Terminal className="w-4 h-4 text-teal-600" />
              <span>SQL Schema Migrations Included</span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Complete PostgreSQL tables, RLS policies, double-booking triggers, and seed data are located in{' '}
              <code className="text-teal-700 bg-teal-50 px-1 py-0.5 rounded font-mono">
                supabase/migrations/20261112000000_carebridge_schema.sql
              </code>{' '}
              and <code className="text-teal-700 bg-teal-50 px-1 py-0.5 rounded font-mono">supabase/seed/seed.sql</code>.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>HIPAA-aligned data isolation design</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
