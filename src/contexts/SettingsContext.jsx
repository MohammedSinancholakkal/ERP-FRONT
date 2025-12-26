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
