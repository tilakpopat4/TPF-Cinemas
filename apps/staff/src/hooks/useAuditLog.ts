import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AuditLogItem } from '../types';

export function useAuditLog(isAdmin: boolean) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!isAdmin) {
      setLogs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_log')
        .select(`
          id, actor_id, action, target_type, target_id, details, created_at,
          actor:actor_id (
            display_name, role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data as unknown as AuditLogItem[]) ?? []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchLogs();
  }, [isAdmin, fetchLogs]);

  return { logs, loading, refreshLogs: fetchLogs };
}
