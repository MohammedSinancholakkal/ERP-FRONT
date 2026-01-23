import React, { useState, useEffect } from "react";
import { Save, Star, X } from "lucide-react";
import toast from "react-hot-toast";
import PageLayout from "../../layout/PageLayout";
import { serverURL } from "../../services/serverURL";
import {
  getSettingsApi,
  addSettingsApi,
  updateSettingsApi,
  getCurrenciesApi,
  addCurrencyApi,
} from "../../services/allAPI";
import { useSettings } from "../../contexts/SettingsContext";
import { updateFavicon } from "../../utils/updateFavicon";
import { useTheme } from "../../context/ThemeContext";
import ContentCard from "../../components/ContentCard";
import AddModal from "../../components/modals/AddModal";
import InputField from "../../components/InputField";
import { hasPermission } from "../../utils/permissionUtils";
import { PERMISSIONS } from "../../constants/permissions";

const Settings = () => {
  const { theme } = useTheme();

  if (!hasPermission(PERMISSIONS.SETTINGS)) {
      return (
        <div className="flex items-center justify-center h-full text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-gray-400">You do not have permission to view this page.</p>
          </div>
        </div>
      );
  }

  const { setSettings: setGlobalSettings, refreshSettings } = useSettings();

  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [settingsId, setSettingsId] = useState(null);

  const [currencies, setCurrencies] = useState([]);
  const [currency, setCurrency] = useState("");

  const [taxPercentage, setTaxPercentage] = useState("");
  const [gstin, setGstin] = useState("");
  const [pan, setPan] = useState("");
  const [taxType, setTaxType] = useState("");

  const [currencyPosition, setCurrencyPosition] = useState("");
  const [footerText, setFooterText] = useState("");

  const [logo, setLogo] = useState(null);
  const [invoiceLogo, setInvoiceLogo] = useState(null);
  const [favicon, setFavicon] = useState(null);

  const [logoFile, setLogoFile] = useState(null);
  const [invoiceLogoFile, setInvoiceLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [newCurrencyName, setNewCurrencyName] = useState("");
  const [newCurrencySymbol, setNewCurrencySymbol] = useState("");

  const [errors, setErrors] = useState({});

  const handleImageSelect = (e, setPreview, setFile) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setFile(file);
    }
  };

  const removeImage = (setPreview, setFile) => {
    setPreview(null);
    setFile(null);
  };

  useEffect(() => {
    fetchCurrencies();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await getSettingsApi();

      if (res?.status === 200 && res.data) {
        const data = res.data;

        if (data.id) {
          const baseUrl = serverURL.replace("/api", "");
          setSettingsId(data.id);
          setCompanyName(data.companyName || "");
          setCompanyEmail(data.companyEmail || "");
          setAddress(data.address || "");
          setPhone(data.phone || "");
          setCurrency(data.currency || "");
          setCurrencyPosition(data.currencyPosition || "");
          setTaxPercentage(String(data.taxPercentage ?? ""));
          setGstin(data.gstin || "");
          setPan(data.pan || "");
          setTaxType(data.taxType || "");
          setFooterText(data.footerText || "");

          if (data.logoPath) setLogo(`${baseUrl}/${data.logoPath}`);
          else setLogo(null);

          if (data.invoiceLogoPath)
            setInvoiceLogo(`${baseUrl}/${data.invoiceLogoPath}`);
          else setInvoiceLogo(null);

          if (data.faviconPath) setFavicon(`${baseUrl}/${data.faviconPath}`);
          else setFavicon(null);

          /* =========================
           GLOBAL SETTINGS CONTEXT
        ========================= */
          setGlobalSettings((prev) => ({
            ...prev,
            id: data.id,
            companyName: data.companyName || "",
            companyEmail: data.companyEmail || "",
            address: data.address || "",
            phone: data.phone || "",
            currency: data.currency || "",
            currencyPosition: data.currencyPosition || "",
            taxPercentage: data.taxPercentage ?? "",
            gstin: data.gstin || "",
            pan: data.pan || "",
            taxType: data.taxType || "",
            footerText: data.footerText || "",
            logoPath: data.logoPath || "",
            invoiceLogoPath: data.invoiceLogoPath || "",
            faviconPath: data.faviconPath || "",
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await getCurrenciesApi(1, 1000);
      if (res.status === 200 && res.data.records) {
        setCurrencies(res.data.records);
      }
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  };

  const addCurrency = async () => {
    if (!newCurrencyName.trim() || !newCurrencySymbol.trim()) {
        toast.error("Currency Name and Symbol are required");
        return;
    }

    try {
      const reqBody = {
        currencyName: newCurrencyName,
        currencySymbol: newCurrencySymbol,
        userId: 1, // Hardcoded
      };
      const res = await addCurrencyApi(reqBody);

      if (res.status === 200 || res.status === 201) {
        await fetchCurrencies();
        
        // Auto-select the new currency
        setCurrency(newCurrencyName);

        setNewCurrencyName("");
        setNewCurrencySymbol("");
        setModalOpen(false);
        toast.success("Currency added successfully");
      } else {
          toast.error("Failed to add currency");
      }
    } catch (error) {
      console.error("Error adding currency:", error);
      toast.error("Error adding currency");
    }
  };

  const validateForm = () => {
    let newErrors = {};

    if (!companyName.trim()) newErrors.companyName = "Company Name is required";
    if (!String(taxPercentage).trim())
      newErrors.taxPercentage = "Tax Percentage is required";
    if (!taxType.trim()) newErrors.taxType = "Tax Type is required";
    if (!currencyPosition.trim())
      newErrors.currencyPosition = "Currency Position is required";
    if (!currency) newErrors.currency = "Currency is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (companyEmail && !emailRegex.test(companyEmail)) {
      newErrors.companyEmail = "Invalid email format";
    }

    if (phone && (phone.length !== 10 || isNaN(phone))) {
      newErrors.phone = "Invalid phone number (must be exactly 10 digits)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSave = async () => {
  if (!validateForm()) return;

  const formData = new FormData();

  /* =========================
     BASIC FIELDS
  ========================= */
  formData.append("companyName", companyName);
  formData.append("companyEmail", companyEmail);
  formData.append("address", address);
  formData.append("phone", phone);
  formData.append("currency", currency);
  formData.append("currencyPosition", currencyPosition);
  formData.append("taxPercentage", taxPercentage);
  formData.append("gstin", gstin);
  formData.append("pan", pan);
  formData.append("taxType", taxType);
  formData.append("footerText", footerText);
  formData.append("userId", 1); // TODO: replace with auth user

  const baseUrl = serverURL.replace("/api", "");

  /* =========================
     LOGO
  ========================= */
  if (logoFile) {
    formData.append("logo", logoFile);
  } else if (logo && !logo.startsWith("blob:")) {
    formData.append("logoPath", logo.replace(`${baseUrl}/`, ""));
  }

  /* =========================
     INVOICE LOGO
  ========================= */
  if (invoiceLogoFile) {
    formData.append("invoiceLogo", invoiceLogoFile);
  } else if (invoiceLogo && !invoiceLogo.startsWith("blob:")) {
    formData.append(
      "invoiceLogoPath",
      invoiceLogo.replace(`${baseUrl}/`, "")
    );
  }

  /* =========================
     FAVICON
  ========================= */
  if (faviconFile) {
    formData.append("favicon", faviconFile);
  } else if (favicon && !favicon.startsWith("blob:")) {
    formData.append(
      "faviconPath",
      favicon.replace(`${baseUrl}/`, "")
    );
  }

  try {
    let response;

    if (settingsId) {
      response = await updateSettingsApi(settingsId, formData);
    } else {
      response = await addSettingsApi(formData);
    }

if (response?.status === 200) {
  toast.success("Settings saved successfully");

  setGlobalSettings(response.data);
  updateFavicon(response.data?.faviconPath);
} else {
      toast.error("Failed to save settings");
    }
  } catch (error) {
    toast.error("Error saving settings");
    console.error("Error saving settings:", error);
  }
};



  return (
    <>
      <PageLayout>
        {/* ⭐ ONLY SETTINGS PAGE SCROLLABLE */}
        <div className={`max-h-[calc(100vh-90px)] overflow-y-auto p-6 ${theme === 'emerald' ? 'bg-gradient-to-br from-emerald-100 to-white text-gray-900' : theme === 'purple' ? 'bg-gradient-to-br from-gray-50 to-gray-200 text-gray-900' : 'bg-gradient-to-b from-gray-900 to-gray-800 text-white'}`}>
          <ContentCard>
            <h2 className={`text-xl font-bold mb-2 ${theme === 'purple' ? 'text-[#6448AE]' : ''}`}>Settings</h2>
            <hr className="mb-4 border-gray-300" />
            
          {/* SAVE BUTTON */}
          <button
            className={`flex items-center justify-center gap-2 border px-4 py-2 rounded text-sm mb-3 w-32 ${theme === 'emerald' || theme === 'purple' ?  ' bg-[#6448AE] hover:bg-[#6E55B6] text-white' : 'bg-gray-800 border-gray-600 text-blue-300'}`}
            onClick={handleSave}
          >
            <Save size={16} /> Save
          </button>

          <div className="max-w-[1500px]">
            {/* COMPANY NAME */}
            <div className="mb-3">
              <label className={`block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Company Name *</label>
              <input
                className={`w-full border rounded px-3 py-2 ${
                  errors.companyName ? "border-red-500" : (theme === 'emerald' || theme === 'purple' ? "border-gray-300 bg-white text-gray-900" : "border-gray-700 bg-gray-900 text-white")
                }`}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              {errors.companyName && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.companyName}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div className="mb-3">
              <label className={`block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Company Email</label>
              <input
                className={`w-full border rounded px-3 py-2 ${
                  errors.companyEmail ? "border-red-500" : (theme === 'emerald' || theme === 'purple' ? "border-gray-300 bg-white text-gray-900" : "border-gray-700 bg-gray-900 text-white")
                }`}
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
              />
              {errors.companyEmail && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.companyEmail}
                </p>
              )}
            </div>

            {/* ADDRESS */}
            <div className="mb-3">
              <label className={`block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Address</label>
              <input
                className={`w-full border rounded px-3 py-2 ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* PHONE */}
            <div className="mb-3">
              <label className={`block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Phone</label>
              <input
                className={`w-full border rounded px-3 py-2 ${
                  errors.phone ? "border-red-500" : (theme === 'emerald' || theme === 'purple' ? "border-gray-300 bg-white text-gray-900" : "border-gray-700 bg-gray-900 text-white")
                }`}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
              {errors.phone && (
                <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* CURRENCY SECTION */}
            <label className={`block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Currency</label>
            <div className="flex items-center gap-2">
              <select
                className={`flex-1 border rounded px-3 py-2 ${
                  errors.currency ? "border-red-500" : (theme === 'emerald' || theme === 'purple' ? "border-gray-300 bg-white text-gray-900" : "border-gray-700 bg-gray-900 text-white")
                }`}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="">--select--</option>
                {currencies.map((c) => (
                  <option key={c.id} value={c.currencyName}>
                    {c.currencyName} ({c.currencySymbol})
                  </option>
                ))}
              </select>

              {hasPermission(PERMISSIONS.CURRENCIES.CREATE) && (
              <button
                onClick={() => setModalOpen(true)}
                className={`p-2  border rounded flex items-center justify-center  ${theme === 'emerald' ? 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' : theme === 'purple' ? 'bg-purple-50 border-purple-200 text-purple-600 hover:bg-purple-100' : 'bg-gray-800 border-gray-600 text-yellow-400'}`}
              >
                <Star size={16} className="" />
              </button>
              )}
            </div>
            {errors.currency && (
              <p className="text-red-400 text-sm mt-1 mb-6">
                {errors.currency}
              </p>
            )}
            {!errors.currency && <div className="mb-6"></div>}

            {/* VAT ROW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Tax % */}
              <div>
                <label className={`block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Tax Percentage *</label>
                <input
                  className={`w-full border rounded px-3 py-2 ${
                    errors.taxPercentage ? "border-red-500" : (theme === 'emerald' || theme === 'purple' ? "border-gray-300 bg-white text-gray-900" : "border-gray-700 bg-gray-900 text-white")
                  }`}
                  value={taxPercentage}
                  onChange={(e) => setTaxPercentage(e.target.value)}
                />
                {errors.taxPercentage && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.taxPercentage}
                  </p>
                )}
              </div>

              {/* GSTIN */}
              <div>
                <label className={`block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>GSTIN</label>
                <input
                  className={`w-full border rounded px-3 py-2 ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}`}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                />
              </div>

             {/* PAN No */}
             <div>
                <label className={`block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>PAN No</label>
                <input
                  className={`w-full border rounded px-3 py-2 ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}`}
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                />
              </div>

              {/* Tax TYPE */}
              <div>
                <label className={`block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Tax Type *</label>
                <select
                  className={`w-full border rounded px-3 py-2 ${
                    errors.taxType ? "border-red-500" : (theme === 'emerald' || theme === 'purple' ? "border-gray-300 bg-white text-gray-900" : "border-gray-700 bg-gray-900 text-white")
                  }`}
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value)}
                >
                  <option value="">--select--</option>
                  <option value="inclusive">Inclusive Tax</option>
                  <option value="exclusive">Exclusive Tax</option>
                </select>
                {errors.taxType && (
                  <p className="text-red-400 text-sm mt-1">{errors.taxType}</p>
                )}
              </div>
            </div>

            {/* LOGOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Logo */}
              <div>
                <label className={`block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Logo</label>
                <div className={`w-full h-40 border rounded flex items-center justify-center relative ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 border-gray-300' : 'bg-gray-900 border-gray-700'}`}>
                  {!logo ? (
                    <label className={`cursor-pointer px-4 py-2 border rounded ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100' : 'bg-gray-800 border-gray-600 text-white'}`}>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          handleImageSelect(e, setLogo, setLogoFile)
                        }
                      />
                      Select File
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={logo}
                        className={`h-36 rounded border ${theme === 'emerald' || theme === 'purple' ? 'border-gray-300' : 'border-gray-700'}`}
                      />
                      <button
                        className="absolute top-1 right-1 bg-red-600 p-1 rounded-full text-white"
                        onClick={() => removeImage(setLogo, setLogoFile)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Logo */}
              <div>
                <label className={`block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Invoice Logo</label>
                <div className={`w-full h-40 border rounded flex items-center justify-center relative ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 border-gray-300' : 'bg-gray-900 border-gray-700'}`}>
                  {!invoiceLogo ? (
                    <label className={`cursor-pointer px-4 py-2 border rounded ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100' : 'bg-gray-800 border-gray-600 text-white'}`}>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          handleImageSelect(
                            e,
                            setInvoiceLogo,
                            setInvoiceLogoFile
                          )
                        }
                      />
                      Select File
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={invoiceLogo}
                        className={`h-36 rounded border ${theme === 'emerald' || theme === 'purple' ? 'border-gray-300' : 'border-gray-700'}`}
                      />
                      <button
                        className="absolute top-1 right-1 bg-red-600 p-1 rounded-full text-white"
                        onClick={() =>
                          removeImage(setInvoiceLogo, setInvoiceLogoFile)
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Favicon */}
              <div>
                <label className={`block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Favicon</label>
                <div className={`w-full h-40 border rounded flex items-center justify-center relative ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 border-gray-300' : 'bg-gray-900 border-gray-700'}`}>
                  {!favicon ? (
                    <label className={`cursor-pointer px-4 py-2 border rounded ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100' : 'bg-gray-800 border-gray-600 text-white'}`}>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          handleImageSelect(e, setFavicon, setFaviconFile)
                        }
                      />
                      Select File
                    </label>
                  ) : (
                    <div className="relative">
                      <img
                        src={favicon}
                        className={`h-36 rounded border ${theme === 'emerald' || theme === 'purple' ? 'border-gray-300' : 'border-gray-700'}`}
                      />
                      <button
                        className="absolute top-1 right-1 bg-red-600 p-1 rounded-full text-white"
                        onClick={() => removeImage(setFavicon, setFaviconFile)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CURRENCY POSITION */}
            <label className={`block mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Currency Position *</label>
            <select
              className={`w-full border rounded px-3 py-2 mb-1 ${
                errors.currencyPosition ? "border-red-500" : (theme === 'emerald' || theme === 'purple' ? "border-gray-300 bg-white text-gray-900" : "border-gray-700 bg-gray-900 text-white")
              }`}
              value={currencyPosition}
              onChange={(e) => setCurrencyPosition(e.target.value)}
            >
              <option value="">--select--</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            {errors.currencyPosition && (
              <p className="text-red-400 text-sm mt-1">
                {errors.currencyPosition}
              </p>
            )}

            {/* FOOTER TEXT */}
            <label className={`block mb-1 mt-4 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>Footer Text</label>
            <textarea
              rows={4}
              className={`w-full border rounded px-3 py-2 ${theme === 'emerald' || theme === 'purple' ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-900 border-gray-700 text-white'}`}
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
            />
          </div>

          {/* MODAL */}
          <AddModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={addCurrency}
            title="Add Currency"
            saveText="Add"
          >
              <div className="space-y-4 p-1">
                  <div>
                    <InputField
                      label="Currency Name *"
                      type="text"
                      value={newCurrencyName}
                      onChange={(e) => setNewCurrencyName(e.target.value)}
                      placeholder="Enter currency name (e.g. Dollar)"
                    />
                  </div>
                  <div>
                    <InputField
                      label="Currency Symbol *"
                      type="text"
                      value={newCurrencySymbol}
                      onChange={(e) => setNewCurrencySymbol(e.target.value)}
                      placeholder="Enter symbol (e.g. $)"
                    />
                  </div>
              </div>
          </AddModal>
          </ContentCard>
        </div>
      </PageLayout>
    </>
  );
};

export default Settings;
