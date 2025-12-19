// // src/contexts/SettingsContext.jsx
// import React, { createContext, useContext, useEffect, useState } from "react";
// import { getSettingsApi } from "../services/allAPI";

// const SettingsContext = createContext();

// export const SettingsProvider = ({ children }) => {
//   const [settings, setSettings] = useState({
//     id: null,
//     companyName: "",
//     companyEmail: "",
//     address: "",
//     phone: "",
//     currency: "",
//     currencyPosition: "",
//     vatPercent: "",
//     vatNo: "",
//     vatType: "",
//     footerText: "",
//     logoPath: "",
//     invoiceLogoPath: "",
//     faviconPath: "",
//     // add any other keys you want globally available
//   });
//   const [loading, setLoading] = useState(true);

//   const refreshSettings = async () => {
//     try {
//       const res = await getSettingsApi();
//       if (res?.status === 200 && res.data) {
//         // Normalize server response to the shape we want
//         const d = res.data;
//         setSettings((prev) => ({
//           ...prev,
//           id: d.id || prev.id,
//           companyName: d.companyName || "",
//           companyEmail: d.companyEmail || "",
//           address: d.address || "",
//           phone: d.phone || "",
//           currency: d.currency || "",
//           currencyPosition: d.currencyPosition || "",
//           vatPercent: d.vatPercent ?? "",
//           vatNo: d.vatNo || "",
//           vatType: d.vatType || "",
//           footerText: d.footerText || "",
//           logoPath: d.logoPath || "",
//           invoiceLogoPath: d.invoiceLogoPath || "",
//           faviconPath: d.faviconPath || "",
//         }));
//       }
//     } catch (err) {
//       console.error("Failed to load settings in SettingsProvider:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     refreshSettings();
//   }, []);

//   return (
//     <SettingsContext.Provider
//       value={{
//         settings,
//         setSettings,
//         refreshSettings,
//         loading,
//       }}
//     >
//       {children}
//     </SettingsContext.Provider>
//   );
// };

// export const useSettings = () => {
//   const ctx = useContext(SettingsContext);
//   if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
//   return ctx;
// };



import { createContext, useContext, useEffect, useState } from "react";
import { getSettingsApi } from "../services/allAPI";
import { updateFavicon } from "../utils/updateFavicon";

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);

  const fetchSettings = async () => {
    const res = await getSettingsApi();
    if (res.status === 200) {
      setSettings(res.data);
      updateFavicon(res.data?.faviconPath); // 🔥 HERE
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
