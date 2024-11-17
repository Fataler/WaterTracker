import React, { createContext, useContext, useState, useCallback } from 'react';

const WaterContext = createContext();

export const useWater = () => {
  const context = useContext(WaterContext);
  if (!context) {
    throw new Error('useWater must be used within a WaterProvider');
  }
  return context;
};

export const WaterProvider = ({ children }) => {
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const refreshData = useCallback(() => {
    setShouldRefresh(prev => !prev);
  }, []);

  return (
    <WaterContext.Provider value={{ shouldRefresh, refreshData }}>
      {children}
    </WaterContext.Provider>
  );
};
