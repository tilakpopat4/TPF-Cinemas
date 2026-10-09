import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { LicenceAgreement } from '../types';

export function useCreatorAgreement(userId?: string) {
  const [agreement, setAgreement] = useState<LicenceAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgreement = useCallback(async () => {
    if (!userId) {
      setAgreement(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check for any signed agreement for this filmmaker (master onboarding or film-specific)
      const { data, error: fetchErr } = await supabase
        .from('licence_agreements')
        .select('*')
        .eq('filmmaker_id', userId)
        .not('signed_at', 'is', null)
        .order('signed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchErr) {
        throw fetchErr;
      }

      setAgreement(data as LicenceAgreement | null);
    } catch (err: any) {
      console.error('Error fetching creator legal agreement:', err);
      setError(err?.message || 'Failed to check legal agreement status');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAgreement();

    if (!userId) return;

    // Realtime listener for agreement updates
    const channel = supabase
      .channel(`licence_agreements_user_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'licence_agreements',
          filter: `filmmaker_id=eq.${userId}`,
        },
        () => {
          fetchAgreement();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchAgreement]);

  const getSignedPdfUrl = useCallback(async (): Promise<string | null> => {
    if (!agreement?.agreement_pdf_url) return null;

    try {
      const { data, error: urlErr } = await supabase.storage
        .from('licences')
        .createSignedUrl(agreement.agreement_pdf_url, 3600);

      if (urlErr) throw urlErr;
      return data?.signedUrl || null;
    } catch (err) {
      console.error('Error getting signed PDF download URL:', err);
      return null;
    }
  }, [agreement]);

  const hasSignedAgreement = Boolean(agreement && agreement.signed_at);

  return {
    agreement,
    hasSignedAgreement,
    loading,
    error,
    refreshAgreement: fetchAgreement,
    getSignedPdfUrl,
  };
}
