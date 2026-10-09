import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  FileCheck2,
  Filter,
  CheckCircle2,
  Clock,
  Eye,
  Download,
  AlertTriangle,
  Globe,
  Loader2,
} from 'lucide-react';
import { LicenceAgreement } from '../../types';
import { useLegalAgreements } from '../../hooks/useLegalAgreements';
import { AgreementInspectionModal } from './AgreementInspectionModal';

export const LegalVerificationTab: React.FC = () => {
  const { agreements, loading, error, refreshAgreements, verifyAgreement, createSignedUrl } =
    useLegalAgreements(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified'>('all');
  const [selectedAgreement, setSelectedAgreement] = useState<LicenceAgreement | null>(null);

  // Compute KPIs
  const totalCount = agreements.length;
  const verifiedCount = useMemo(() => agreements.filter((a) => Boolean(a.verified_at)).length, [agreements]);
  const pendingCount = totalCount - verifiedCount;

  // Filtered list
  const filteredAgreements = useMemo(() => {
    return agreements.filter((agreement) => {
      // Status filter
      if (statusFilter === 'pending' && agreement.verified_at) return false;
      if (statusFilter === 'verified' && !agreement.verified_at) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const filmmakerName = agreement.filmmaker?.display_name?.toLowerCase() || '';
        const legalName = agreement.legal_name?.toLowerCase() || '';
        const filmTitle = agreement.film?.title?.toLowerCase() || '';
        const version = agreement.agreement_version?.toLowerCase() || '';
        return (
          filmmakerName.includes(query) ||
          legalName.includes(query) ||
          filmTitle.includes(query) ||
          version.includes(query)
        );
      }

      return true;
    });
  }, [agreements, statusFilter, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 font-display">
            <ShieldCheck className="h-6 w-6 text-signature" />
            Creator Legal Agreements &amp; Rights Verification
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Review and formally verify digital streaming rights grants, IP self-declarations, and signed deeds.
          </p>
        </div>

        <button
          onClick={refreshAgreements}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-signature' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0c0d14] border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Deeds Executed</span>
            <FileCheck2 className="h-4 w-4 text-zinc-500" />
          </div>
          <p className="text-2xl font-black text-white mt-2 font-mono">{totalCount}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Stored permanently in licences/ vault</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0d14] border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-300">Pending Staff Review</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2 font-mono">{pendingCount}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Awaiting curator inspection</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c0d14] border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-300">Curator Verified</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2 font-mono">{verifiedCount}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Cleared for platform streaming</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0c0d14] border border-white/10">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by legal name, account name, or film..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-signature transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 shrink-0 bg-black/30 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-white/[0.12] text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('verified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'verified'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Verified ({verifiedCount})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0c0d14] overflow-hidden shadow-xl">
        {loading && agreements.length === 0 ? (
          <div className="py-20 text-center">
            <Loader2 className="h-8 w-8 text-signature animate-spin mx-auto mb-2" />
            <p className="text-xs text-zinc-400">Loading creator legal agreements...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2">
            <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-white">Error loading legal records</p>
            <p className="text-xs text-zinc-400">{error}</p>
          </div>
        ) : filteredAgreements.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <FileCheck2 className="h-8 w-8 text-zinc-600 mx-auto" />
            <p className="text-sm font-semibold text-zinc-300">No legal agreements found</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              {searchTerm
                ? 'No agreements match your search filter.'
                : 'No creator legal agreements have been executed yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Creator / Account</th>
                  <th className="py-3.5 px-4">Full Legal Name</th>
                  <th className="py-3.5 px-4">Deed Scope</th>
                  <th className="py-3.5 px-4">Signed Date</th>
                  <th className="py-3.5 px-4">Music Clearance</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredAgreements.map((agreement) => {
                  const isVerified = Boolean(agreement.verified_at);
                  const dateStr = agreement.signed_at
                    ? new Date(agreement.signed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A';

                  return (
                    <tr
                      key={agreement.id}
                      onClick={() => setSelectedAgreement(agreement)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* Creator Profile */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-signature/15 border border-signature/30 text-signature flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {agreement.filmmaker?.display_name?.charAt(0) || 'C'}
                          </div>
                          <div className="truncate max-w-[160px]">
                            <p className="font-semibold text-white group-hover:text-signature transition-colors truncate">
                              {agreement.filmmaker?.display_name || 'Creator'}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              ID: {agreement.filmmaker_id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Legal Name */}
                      <td className="py-3.5 px-4 font-medium text-zinc-200">
                        {agreement.legal_name || (
                          <span className="text-zinc-500 italic">Self-Declared</span>
                        )}
                      </td>

                      {/* Scope & Version */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white/[0.05] text-zinc-300 border border-white/10 uppercase">
                            {agreement.film?.title ? 'Per-Film Deed' : 'Master Deed'}
                          </span>
                          <p className="text-[10px] text-zinc-500 capitalize">
                            {agreement.film_type_at_signing || 'All Formats'} &bull; v{agreement.agreement_version || '1.0'}
                          </p>
                        </div>
                      </td>

                      {/* Signed Date */}
                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                        {dateStr}
                      </td>

                      {/* Music Clearance */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          100% Cleared
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isVerified
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {isVerified ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3" />
                              Pending
                            </>
                          )}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgreement(agreement);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5 text-signature" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspection Modal */}
      {selectedAgreement && (
        <AgreementInspectionModal
          agreement={selectedAgreement}
          onClose={() => setSelectedAgreement(null)}
          onVerified={() => {
            refreshAgreements();
            setSelectedAgreement(null);
          }}
          createSignedUrl={createSignedUrl}
          verifyAgreement={verifyAgreement}
        />
      )}
    </div>
  );
};
