import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';

const GenerationContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return { ...state, generations: [action.job, ...state.generations] };
    case 'UPDATE':
      return {
        ...state,
        generations: state.generations.map(g =>
          g.id === action.id ? { ...g, ...action.patch } : g
        ),
      };
    case 'REMOVE':
      return { ...state, generations: state.generations.filter(g => g.id !== action.id) };
    case 'TICK':
      return {
        ...state,
        generations: state.generations.map(g => {
          if (g.status !== 'loading' || g.progress >= 95) return g;
          let next;
          if (g.progress < 60) next = Math.min(g.progress + 7, 95);
          else if (g.progress < 85) next = Math.min(g.progress + 3, 95);
          else next = Math.min(g.progress + 1, 95);
          return { ...g, progress: next };
        }),
      };
    case 'SET_PREFILL':
      return { ...state, prefillJob: action.payload };
    case 'CLEAR_PREFILL':
      return { ...state, prefillJob: null };
    default:
      return state;
  }
}

export const GenerationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, { generations: [], prefillJob: null });
  const intervalRef = useRef(null);
  const hasLoadingRef = useRef(false);

  // Track whether any loading jobs exist
  hasLoadingRef.current = state.generations.some(g => g.status === 'loading');

  useEffect(() => {
    if (hasLoadingRef.current && !intervalRef.current) {
      intervalRef.current = window.setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 700);
    } else if (!hasLoadingRef.current && intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [state.generations]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const addGeneration = (job) => dispatch({ type: 'ADD', job });
  const updateGeneration = (id, patch) => dispatch({ type: 'UPDATE', id, patch });
  const removeGeneration = (id) => dispatch({ type: 'REMOVE', id });
  const setPrefill = (payload) => dispatch({ type: 'SET_PREFILL', payload });
  const clearPrefill = () => dispatch({ type: 'CLEAR_PREFILL' });

  return (
    <GenerationContext.Provider value={{
      activeGenerations: state.generations,
      prefillJob: state.prefillJob,
      addGeneration,
      updateGeneration,
      removeGeneration,
      setPrefill,
      clearPrefill,
    }}>
      {children}
    </GenerationContext.Provider>
  );
};

export const useGeneration = () => {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error('useGeneration must be used within GenerationProvider');
  return ctx;
};
