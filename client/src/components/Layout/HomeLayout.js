import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileDock from '../UI/MobileDock';

const HomeLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pb-safe-bottom">
        <Outlet />
      </main>
      <Footer />
      <MobileDock />
    </div>
  );
};

export default HomeLayout;
