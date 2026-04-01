import React from 'react';
import Hero from '../components/Home/Hero';
import { useHomeSEO } from '../hooks/useSEO';

const Home = () => {
  useHomeSEO();
  return <Hero />;
};

export default Home;
