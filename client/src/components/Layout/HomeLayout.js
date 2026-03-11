import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileDock from '../UI/MobileDock';
import MeshBackground from '../UI/MeshBackground';

const HomeLayout = () => {
  return (
    <div className="relative isolate min-h-screen">
      <MeshBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 pb-safe-bottom">
          <Outlet />
        </main>
        <Footer />
        <MobileDock />
      </div>
    </div>
  );
};

export default HomeLayout;
