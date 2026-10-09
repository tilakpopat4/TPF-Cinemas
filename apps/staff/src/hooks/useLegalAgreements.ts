import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { LicenceAgreement } from '../types';

export function useLegalAgreements(isStaff: boolean) {
  const [agreements, setAgreements] = useState<LicenceAgreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgreements = useCallback(async () => {
    if (!isStaff) {
      setAgreements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchErr } = await supabase
        .from('licence_agreements')
        .select(`
          *,
          filmmaker:profiles!licence_agreements_filmmaker_id_fkey(id, display_name, avatar_url),
          verifier:profiles!licence_agreements_verified_by_fkey(display_name),
          film:films(id, title, slug)
        `)
        .order('signed_at', { ascending: false });

      if (fetchErr) {
        throw fetchErr;
      }

      setAgreements((data || []) as unknown as LicenceAgreement[]);
    } catch (err: any) {
      console.error('Error fetching legal agreements for staff:', err);
      setError(err?.message || 'Failed to load legal agreements');
    } finally {
      setLoading(false);
    }
  }, [isStaff]);

  useEffect(() => {
    fetchAgreements();

    if (!isStaff) return;

    // Realtime channel
    const channel = supabase
      .channel('staff_licence_agreements_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'licence_agreements',
        },
        () => {
          fetchAgreements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isStaff, fetchAgreements]);

  const verifyAgreement = useCallback(
    async (agreementId: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const { error: rpcErr } = await supabase.rpc('verify_creator_agreement', {
          p_agreement_id: agreementId,
        });

        if (rpcErr) {
          throw rpcErr;
        }

        await fetchAgreements();
        return { success: true };
      } catch (err: any) {
        console.error('Error verifying agreement:', err);
        return {
          success: false,
          error: err?.message || 'Failed to verify legal agreement',
        };
      }
    },
    [fetchAgreements]
  );

  const createSignedUrl = useCallback(async (path: string): Promise<string | null> => {
    if (!path) return null;
    try {
      const { data, error: urlErr } = await supabase.storage
        .from('licences')
        .createSignedUrl(path, 3600);

      if (urlErr) throw urlErr;
      return data?.signedUrl || null;
    } catch (err) {
      console.error('Error creating signed download URL:', err);
      return null;
    }
  }, []);

  return {
    agreements,
    loading,
    error,
    refreshAgreements: fetchAgreements,
    verifyAgreement,
    createSignedUrl,
  };
}
