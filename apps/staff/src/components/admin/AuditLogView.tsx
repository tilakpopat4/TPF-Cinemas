import React from 'react';
import { History, Shield, Activity, RefreshCw } from 'lucide-react';
import { AuditLogItem } from '../../types';
import { formatDate } from '../../lib/utils';

interface AuditLogViewProps {
  logs: AuditLogItem[];
  loading: boolean;
  onRefresh: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, loading, onRefresh }) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
            <History className="h-5 w-5 text-signature" />
            <span>Platform Audit Log (Admin Only)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Immutable system logs recorded by database triggers and functions for publishing, takedowns, and role modifications.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="btn btn-secondary btn-sm flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-signature' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="console-card overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Activity className="h-10 w-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No audit logs recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Actions like publishing, featuring, takedown, and role changes will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Target Type</th>
                  <th>Target ID</th>
                  <th>Actor</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-xs text-slate-400">
                      {formatDate(log.created_at)}
                    </td>

                    <td>
                      <span className="rounded-full bg-signature/10 px-2 py-0.5 text-[11px] font-medium text-signature font-mono">
                        {log.action}
                      </span>
                    </td>

                    <td className="text-xs text-slate-300 capitalize">
                      {log.target_type}
                    </td>

                    <td className="font-mono text-xs text-slate-400">
                      {log.target_id.slice(0, 8)}...
                    </td>

                    <td>
                      <div className="text-xs text-slate-200 font-semibold">
                        {log.actor?.display_name || log.actor_id?.slice(0, 8) || 'System / Service'}
                      </div>
                    </td>

                    <td className="font-mono text-[11px] text-slate-400 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
