import React, { useState, useCallback, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileDock from '../UI/MobileDock';
import DesktopDock from '../UI/DesktopDock';
import CreditsModal from '../UI/CreditsModal';
import Img2PromptPanel from '../UI/Img2PromptPanel';
import InviteModal from '../UI/InviteModal';
import MeshBackground from '../UI/MeshBackground';
import { useSidebar } from '../../contexts/SidebarContext';
import { useGeneration } from '../../contexts/GenerationContext';

const Layout = () => {
  const { collapsed } = useSidebar();
  const navigate = useNavigate();
  const { prefillJob, clearPrefill } = useGeneration();
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [img2promptOpen, setImg2promptOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  // Called by GenerateTab on generate — navigate and keep panel open (MeiGen style)
  const handleStartGeneration = useCallback(() => {
    navigate('/generate-history');
  }, [navigate]);

  // When "Use Idea" sets a prefill, auto-open the panel
  useEffect(() => {
    if (prefillJob) {
      setImg2promptOpen(true);
    }
  }, [prefillJob]);

  return (
    <div className="flex min-h-screen" style={{ position: 'relative' }}>
      {/* Dynamic mesh gradient background */}
      <MeshBackground />

      {/* Desktop sidebar: sticky, hidden on mobile */}
      <div
        className="hidden md:block sticky top-0 h-screen flex-shrink-0 overflow-visible"
        style={{
          width: collapsed ? 64 : 264,
          transition: 'width 0.25s ease',
        }}
      >
        <Sidebar onCreditsClick={() => setCreditsOpen(true)} onInviteClick={() => setInviteOpen(true)} />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile header only */}
        <div className="md:hidden">
          <Header />
        </div>

        {/* pb-20 on desktop to avoid DesktopDock overlap */}
        <main className="flex-1 pb-safe-bottom md:pb-20">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom dock */}
      <MobileDock />

      {/* Desktop floating dock (bottom-center, md+ only) */}
      <DesktopDock onImg2PromptClick={() => setImg2promptOpen(v => !v)} />

      {/* Credits pricing modal */}
      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />

      {/* Generate panel (Reverse Prompt + Generate Image tabs) */}
      <Img2PromptPanel
        open={img2promptOpen}
        onClose={() => setImg2promptOpen(false)}
        onStartGeneration={handleStartGeneration}
        prefillJob={prefillJob}
        onPrefillConsumed={clearPrefill}
      />

      {/* Invite modal */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
};

export default Layout;
