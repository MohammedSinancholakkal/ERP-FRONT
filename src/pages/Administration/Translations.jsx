import React, { useState, useEffect, useRef } from "react";
import { Search, Save } from "lucide-react";
import PageLayout from "../../layout/PageLayout";
import toast from "react-hot-toast";

const Translation = () => {
  // MOCK LANGUAGES
  const languagesMock = [
    { code: "en", name: "English" },
    { code: "ar", name: "Arabic" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "hi", name: "Hindi" },
  ];

  // MOCK DATA
  const initialRows = [
    {
      key: "HOME_TITLE",
      sourceEffective: "Home",
      userTranslation: "",
      targetEffective: "Accueil",
    },
    {
      key: "SETTINGS",
      sourceEffective: "Settings",
      userTranslation: "",
      targetEffective: "Paramètres",
    },
    {
      key: "LOGOUT",
      sourceEffective: "Logout",
      userTranslation: "",
      targetEffective: "Déconnexion",
    },
  ];

  const [rows, setRows] = useState(initialRows);
  const [languages] = useState(languagesMock);

  // LANGUAGE SELECT
  const [sourceLang, setSourceLang] = useState("");
  const [targetLang, setTargetLang] = useState("");

  const [sourceSearch, setSourceSearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");

  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showTargetDropdown, setShowTargetDropdown] = useState(false);

  // REFS FOR CLICK OUTSIDE HANDLING
  const sourceRef = useRef(null);
  const targetRef = useRef(null);

  // CLOSE DROPDOWNS ON OUTSIDE CLICK
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sourceRef.current && !sourceRef.current.contains(e.target)) {
        setShowSourceDropdown(false);
      }
      if (targetRef.current && !targetRef.current.contains(e.target)) {
        setShowTargetDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // SEARCH TRANSLATION ROWS
  const [searchText, setSearchText] = useState("");

  const filteredRows = !searchText.trim()
    ? rows
    : rows.filter((r) => r.key.toLowerCase().includes(searchText.toLowerCase()));

  // SAVE
  const handleSave = () => {
    toast.success("Translations saved (local only)");
  };

  return (
    <>
      <PageLayout>
        <div className="p-4 text-white bg-gradient-to-b from-gray-900 to-gray-700">
          <div className="flex flex-col h-full overflow-hidden">

            <h2 className="text-2xl font-semibold mb-4">Translations</h2>

            {/* ACTION BAR */}
            <div className="flex flex-wrap items-center gap-3 mb-4">

              {/* SEARCH INPUT */}
              <div className="flex items-center bg-gray-700 px-2 py-1.5 rounded-md border border-gray-600 w-full sm:w-60">
                <Search size={16} className="text-gray-300" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="search..."
                  className="bg-transparent outline-none pl-2 text-gray-200 w-full text-sm"
                />
              </div>

              {/* SAVE BUTTON */}
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-gray-700 px-3 py-1.5 rounded-md border border-gray-600 text-sm text-blue-300 hover:bg-gray-600"
              >
                <Save size={16} /> Save Changes
              </button>

              {/* SOURCE LANGUAGE DROPDOWN */}
              <div className="relative" ref={sourceRef}>
                <input
                  type="text"
                  placeholder="Source Language"
                  value={sourceSearch}
                  onChange={(e) => {
                    setSourceSearch(e.target.value);
                    setShowSourceDropdown(true);
                  }}
                  onClick={() => setShowSourceDropdown(true)}
                  className="bg-gray-700 border border-gray-600 px-3 py-1.5 rounded-md text-sm w-48 outline-none"
                />

                {showSourceDropdown && (
                  <div className="absolute mt-1 w-full max-h-40 overflow-auto bg-gray-800 border border-gray-600 rounded shadow-lg z-20">
                    {languages
                      .filter((l) =>
                        l.name.toLowerCase().includes(sourceSearch.toLowerCase())
                      )
                      .map((l) => (
                        <div
                          key={l.code}
                          onClick={() => {
                            setSourceLang(l.code);
                            setSourceSearch(l.name);
                            setShowSourceDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                        >
                          {l.name}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* TARGET LANGUAGE DROPDOWN */}
              <div className="relative" ref={targetRef}>
                <input
                  type="text"
                  placeholder="Target Language"
                  value={targetSearch}
                  onChange={(e) => {
                    setTargetSearch(e.target.value);
                    setShowTargetDropdown(true);
                  }}
                  onClick={() => setShowTargetDropdown(true)}
                  className="bg-gray-700 border border-gray-600 px-3 py-1.5 rounded-md text-sm w-48 outline-none"
                />

                {showTargetDropdown && (
                  <div className="absolute mt-1 w-full max-h-40 overflow-auto bg-gray-800 border border-gray-600 rounded shadow-lg z-20">
                    {languages
                      .filter((l) =>
                        l.name.toLowerCase().includes(targetSearch.toLowerCase())
                      )
                      .map((l) => (
                        <div
                          key={l.code}
                          onClick={() => {
                            setTargetLang(l.code);
                            setTargetSearch(l.name);
                            setShowTargetDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm"
                        >
                          {l.name}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* TABLE */}
            <div className="w-full flex-grow min-h-0 mt-3">
              <div className="overflow-auto max-h-[calc(100vh-260px)] w-full">
                <table className="min-w-[1500px] border-separate border-spacing-y-1 text-sm">
                  <thead className="sticky top-0 bg-gray-900 z-10">
                    <tr className="text-white">
                      <th className="pb-1 border-b border-white text-center">Local Key</th>
                      <th className="pb-1 border-b border-white text-center">
                        Effective Translation (Source)
                      </th>
                      <th className="pb-1 border-b border-white text-center">
                        User Translation (Target)
                      </th>
                      <th className="pb-1 border-b border-white text-center">
                        Effective Translation (Target)
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr className="bg-gray-900 rounded shadow-sm">
                        <td
                          colSpan={4}
                          className="px-3 py-4 text-center text-gray-400"
                        >
                          No matching results
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row, i) => (
                        <tr
                          key={i}
                          className="bg-gray-900 hover:bg-gray-700 rounded shadow-sm"
                        >
                          <td className="px-3 py-2 text-center">{row.key}</td>
                          <td className="px-3 py-2 text-center">{row.sourceEffective}</td>

                          <td className="px-3 py-2 text-center">
                            <input
                              value={row.userTranslation}
                              onChange={(e) => {
                                const updated = [...rows];
                                updated[i].userTranslation = e.target.value;
                                setRows(updated);
                              }}
                              className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
                            />
                          </td>

                          <td className="px-3 py-2 text-center">{row.targetEffective}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </PageLayout>
    </>
  );
};

export default Translation;

