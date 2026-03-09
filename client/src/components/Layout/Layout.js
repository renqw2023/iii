import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import MobileDock from '../UI/MobileDock';
import DesktopDock from '../UI/DesktopDock';
import CreditsModal from '../UI/CreditsModal';
import Img2PromptPanel from '../UI/Img2PromptPanel';
import InviteModal from '../UI/InviteModal';
import { useSidebar } from '../../contexts/SidebarContext';

const Layout = () => {
  const { collapsed } = useSidebar();
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [img2promptOpen, setImg2promptOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar: sticky, hidden on mobile */}
      <div
        className="hidden md:block sticky top-0 h-screen flex-shrink-0 overflow-hidden"
        style={{
          width: collapsed ? 64 : 240,
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

        <Footer />
      </div>

      {/* Mobile bottom dock */}
      <MobileDock />

      {/* Desktop floating dock (bottom-center, md+ only) */}
      <DesktopDock onImg2PromptClick={() => setImg2promptOpen(v => !v)} />

      {/* Credits pricing modal */}
      <CreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />

      {/* Img2Prompt right panel */}
      <Img2PromptPanel open={img2promptOpen} onClose={() => setImg2promptOpen(false)} />

      {/* Invite modal */}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
};

export default Layout;
