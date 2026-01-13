import React, { createContext, useContext, useState, useEffect } from "react";
import { getDashboardStatsApi } from "../services/allAPI";

const DashboardContext = createContext();

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(true); // Start stale to fetch on first load

  // Function to fetch data
  const fetchDashboardData = async (forceString = false) => {
    // If not stale and we have data, don't fetch unless forced
    if (!isStale && dashboardData && !forceString) {
        return;
    }

    setLoading(true);
    try {
      const res = await getDashboardStatsApi();
      if (res.status === 200) {
        setDashboardData(res.data);
        setIsStale(false);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data (Context)", error);
    } finally {
      setLoading(false);
    }
  };

  // Call this when a transaction happens (Sale, Purchase, etc.)
  const invalidateDashboard = () => {
    setIsStale(true);
  };

  return (
    <DashboardContext.Provider
      value={{
        dashboardData,
        loading,
        fetchDashboardData,
        invalidateDashboard,
        isStale
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
