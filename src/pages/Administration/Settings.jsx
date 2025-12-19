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

const Settings = () => {
  const { setSettings: setGlobalSettings, refreshSettings } = useSettings();

  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [settingsId, setSettingsId] = useState(null);

  const [currencies, setCurrencies] = useState([]);
  const [currency, setCurrency] = useState("");

  const [vatPercent, setVatPercent] = useState("");
  const [vatNo, setVatNo] = useState("");
  const [vatType, setVatType] = useState("");

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
          setVatPercent(String(data.vatPercent ?? ""));
          setVatNo(data.vatNo || "");
          setVatType(data.vatType || "");
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
            vatPercent: data.vatPercent ?? "",
            vatNo: data.vatNo || "",
            vatType: data.vatType || "",
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
    if (!newCurrencyName.trim() || !newCurrencySymbol.trim()) return;

    try {
      const reqBody = {
        currencyName: newCurrencyName,
        currencySymbol: newCurrencySymbol,
        userId: 1, // Hardcoded
      };
      const res = await addCurrencyApi(reqBody);

      if (res.status === 200) {
        await fetchCurrencies();
        setNewCurrencyName("");
        setNewCurrencySymbol("");
        setModalOpen(false);
        toast.success("Currency added successfully");
      }
    } catch (error) {
      console.error("Error adding currency:", error);
    }
  };

  const validateForm = () => {
    let newErrors = {};

    if (!companyName.trim()) newErrors.companyName = "Company Name is required";
    if (!String(vatPercent).trim())
      newErrors.vatPercent = "VAT Percentage is required";
    if (!vatType.trim()) newErrors.vatType = "VAT Type is required";
    if (!currencyPosition.trim())
      newErrors.currencyPosition = "Currency Position is required";
    if (!currency) newErrors.currency = "Currency is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (companyEmail && !emailRegex.test(companyEmail)) {
      newErrors.companyEmail = "Invalid email format";
    }

    if (phone && (phone.length < 10 || isNaN(phone))) {
      newErrors.phone = "Invalid phone number (min 10 digits)";
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
  formData.append("vatPercent", vatPercent);
  formData.append("vatNo", vatNo);
  formData.append("vatType", vatType);
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
        <div className="max-h-[calc(100vh-90px)] overflow-y-auto p-6 text-white bg-gradient-to-b from-gray-900 to-gray-800">
          {/* SAVE BUTTON */}
          <button
            className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300 mb-3"
            onClick={handleSave}
          >
            <Save size={16} /> Save
          </button>

          <div className="max-w-[1500px]">
            {/* COMPANY NAME */}
            <div className="mb-3">
              <label className="block mb-1">Company Name *</label>
              <input
                className={`w-full bg-gray-900 border rounded px-3 py-2 ${
                  errors.companyName ? "border-red-500" : "border-gray-700"
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
              <label className="block mb-1">Company Email</label>
              <input
                className={`w-full bg-gray-900 border rounded px-3 py-2 ${
                  errors.companyEmail ? "border-red-500" : "border-gray-700"
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
              <label className="block mb-1">Address</label>
              <input
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* PHONE */}
            <div className="mb-3">
              <label className="block mb-1">Phone</label>
              <input
                className={`w-full bg-gray-900 border rounded px-3 py-2 ${
                  errors.phone ? "border-red-500" : "border-gray-700"
                }`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {errors.phone && (
                <p className="text-red-400 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            {/* CURRENCY SECTION */}
            <label className="block mb-1">Currency</label>
            <div className="flex items-center gap-2">
              <select
                className={`flex-1 bg-gray-900 border rounded px-3 py-2 ${
                  errors.currency ? "border-red-500" : "border-gray-700"
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

              <button
                onClick={() => setModalOpen(true)}
                className="p-2 bg-gray-800 border border-gray-600 rounded hover:bg-gray-700"
              >
                <Star size={18} className="text-yellow-400" />
              </button>
            </div>
            {errors.currency && (
              <p className="text-red-400 text-sm mt-1 mb-6">
                {errors.currency}
              </p>
            )}
            {!errors.currency && <div className="mb-6"></div>}

            {/* VAT ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* VAT % */}
              <div>
                <label className="block mb-1">VAT Percentage *</label>
                <input
                  className={`w-full bg-gray-900 border rounded px-3 py-2 ${
                    errors.vatPercent ? "border-red-500" : "border-gray-700"
                  }`}
                  value={vatPercent}
                  onChange={(e) => setVatPercent(e.target.value)}
                />
                {errors.vatPercent && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.vatPercent}
                  </p>
                )}
              </div>

              {/* VAT # */}
              <div>
                <label className="block mb-1">VAT #</label>
                <input
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
                  value={vatNo}
                  onChange={(e) => setVatNo(e.target.value)}
                />
              </div>

              {/* VAT TYPE */}
              <div>
                <label className="block mb-1">VAT Type *</label>
                <select
                  className={`w-full bg-gray-900 border rounded px-3 py-2 ${
                    errors.vatType ? "border-red-500" : "border-gray-700"
                  }`}
                  value={vatType}
                  onChange={(e) => setVatType(e.target.value)}
                >
                  <option value="">--select--</option>
                  <option value="inclusive">Inclusive Vat</option>
                  <option value="exclusive">Exclusive Vat</option>
                </select>
                {errors.vatType && (
                  <p className="text-red-400 text-sm mt-1">{errors.vatType}</p>
                )}
              </div>
            </div>

            {/* LOGOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Logo */}
              <div>
                <label className="block mb-1">Logo</label>
                <div className="w-full h-40 bg-gray-900 border border-gray-700 rounded flex items-center justify-center relative">
                  {!logo ? (
                    <label className="cursor-pointer px-4 py-2 bg-gray-800 border border-gray-600 rounded">
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
                        className="h-36 rounded border border-gray-700"
                      />
                      <button
                        className="absolute top-1 right-1 bg-red-600 p-1 rounded-full"
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
                <label className="block mb-1">Invoice Logo</label>
                <div className="w-full h-40 bg-gray-900 border border-gray-700 rounded flex items-center justify-center relative">
                  {!invoiceLogo ? (
                    <label className="cursor-pointer px-4 py-2 bg-gray-800 border border-gray-600 rounded">
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
                        className="h-36 rounded border border-gray-700"
                      />
                      <button
                        className="absolute top-1 right-1 bg-red-600 p-1 rounded-full"
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
                <label className="block mb-1">Favicon</label>
                <div className="w-full h-40 bg-gray-900 border border-gray-700 rounded flex items-center justify-center relative">
                  {!favicon ? (
                    <label className="cursor-pointer px-4 py-2 bg-gray-800 border border-gray-600 rounded">
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
                        className="h-36 rounded border border-gray-700"
                      />
                      <button
                        className="absolute top-1 right-1 bg-red-600 p-1 rounded-full"
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
            <label className="block mb-1">Currency Position *</label>
            <select
              className={`w-full bg-gray-900 border rounded px-3 py-2 mb-1 ${
                errors.currencyPosition ? "border-red-500" : "border-gray-700"
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
            <label className="block mb-1 mt-4">Footer Text</label>
            <textarea
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
            />
          </div>

          {/* MODAL */}
          {modalOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
              <div className="w-[600px] bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700">
                {/* HEADER */}
                <div className="flex justify-between items-center px-5 py-3 border-b border-gray-700">
                  <h2 className="text-lg font-semibold">Add Currency</h2>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="text-gray-300 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* BODY */}
                <div className="p-6">
                  <label className="block text-sm mb-1">Currency Name *</label>
                  <input
                    type="text"
                    value={newCurrencyName}
                    onChange={(e) => setNewCurrencyName(e.target.value)}
                    placeholder="Enter currency name (e.g. Dollar)"
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none mb-4"
                  />

                  <label className="block text-sm mb-1">
                    Currency Symbol *
                  </label>
                  <input
                    type="text"
                    value={newCurrencySymbol}
                    onChange={(e) => setNewCurrencySymbol(e.target.value)}
                    placeholder="Enter symbol (e.g. $)"
                    className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:border-white outline-none"
                  />
                </div>

                {/* FOOTER */}
                <div className="px-5 py-3 border-t border-gray-700 flex justify-end">
                  <button
                    onClick={addCurrency}
                    className="flex items-center gap-2 bg-gray-800 border border-gray-600 px-4 py-2 rounded text-sm text-blue-300"
                  >
                    <Save size={16} /> Add
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageLayout>
    </>
  );
};

export default Settings;
