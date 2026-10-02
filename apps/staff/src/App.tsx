import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useStaffAuth } from './hooks/useStaffAuth';
import { useReviewQueue } from './hooks/useReviewQueue';
import { useAuditLog } from './hooks/useAuditLog';
import { Film } from './types';
import { StaffHeader } from './components/layout/StaffHeader';
import { StaffFooter } from './components/layout/StaffFooter';
import { QueueTable } from './components/queue/QueueTable';
import { ReviewModal } from './components/queue/ReviewModal';
import { RoleManager } from './components/admin/RoleManager';
import { AuditLogView } from './components/admin/AuditLogView';
import { StaffAuthModal } from './components/auth/StaffAuthModal';
import { LanguageProvider } from './context/LanguageContext';

export const App: React.FC = () => {
  const { user, profile, role, isStaff, isAdmin, loading: authLoading, signOut, refreshProfile } = useStaffAuth();
  const { films, loading: queueLoading, refreshQueue } = useReviewQueue(isStaff);
  const { logs, loading: auditLoading, refreshLogs } = useAuditLog(isAdmin);

  const [activeTab, setActiveTab] = useState<'queue' | 'roles' | 'audit'>('queue');
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-canvas text-ivory">
        <Loader2 className="h-10 w-10 text-signature animate-spin mb-3" />
        <p className="text-sm font-medium">Loading TPF Staff Console...</p>
      </div>
    );
  }

  // Gatekeeping: require staff role
  if (!user || !isStaff) {
    return (
      <StaffAuthModal
        currentRole={role}
        isLoggedIn={!!user}
        onSignOut={signOut}
        onSuccess={refreshProfile}
      />
    );
  }

  const pendingCount = films.filter((f) => f.status === 'submitted').length;

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-canvas text-ivory flex flex-col font-sans selection:bg-signature selection:text-black">
        {/* Unified Header */}
        <StaffHeader
          profile={profile}
          email={user.email}
          role={role}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSignOut={signOut}
          queueCount={pendingCount}
        />

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'queue' && (
            <QueueTable
              films={films}
              onSelectFilm={(film) => setSelectedFilm(film)}
            />
          )}

          {activeTab === 'roles' && isAdmin && (
            <RoleManager currentUserId={user.id} />
          )}

          {activeTab === 'audit' && isAdmin && (
            <AuditLogView
              logs={logs}
              loading={auditLoading}
              onRefresh={refreshLogs}
            />
          )}
        </main>

        {/* Review & Inspection Modal */}
        {selectedFilm && (
          <ReviewModal
            film={selectedFilm}
            onClose={() => setSelectedFilm(null)}
            isAdmin={isAdmin}
            onActionComplete={() => {
              refreshQueue();
              if (isAdmin) refreshLogs();
              setSelectedFilm(null);
            }}
          />
        )}

        {/* Unified Footer */}
        <StaffFooter />
      </div>
    </LanguageProvider>
  );
};

export default App;
