import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSettings } from "../../contexts/SettingsContext";
import { getPurchaseOrderByIdApi, getSuppliersApi, getTaxTypesApi, getStatesApi, getCitiesApi } from "../../services/allAPI";
import { useTheme } from "../../context/ThemeContext";
import ContentCard from "../../components/ContentCard";

const parseArrayFromResponse = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data?.records) return res.data.records;
  if (res.records) return res.records;
  const maybeArray = Object.values(res).find((v) => Array.isArray(v));
  return Array.isArray(maybeArray) ? maybeArray : [];
};

const PurchaseOrderPreview = () => {
  const { id } = useParams();
  const { settings } = useSettings(); 
  const { theme } = useTheme();
  const [purchase, setPurchase] = useState(null);
  const [details, setDetails] = useState([]);
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taxTypeName, setTaxTypeName] = useState("");

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await getPurchaseOrderByIdApi(id);
        if (res.status === 200) {
          const purchaseData = res.data.purchase;
          setPurchase(purchaseData);
          setDetails(res.data.details);

          if (purchaseData?.TaxTypeId) {
              getTaxTypesApi(1, 1000).then(taxRes => {
                  if(taxRes.status === 200) {
                      const found = taxRes.data.records.find(t => String(t.typeId) === String(purchaseData.TaxTypeId) || String(t.id) === String(purchaseData.TaxTypeId));
                      if(found) setTaxTypeName(found.typeName || found.name || "");
                  }
              });
          }

          if (purchaseData?.SupplierId) {
             // Parallel fetch
            const [suppliersRes, statesRes, citiesRes] = await Promise.all([
                 getSuppliersApi(1, 1000),
                 getStatesApi(1, 5000),
                 getCitiesApi(1, 5000)
            ]);

            if (suppliersRes?.status === 200) {
              const supplierRecord = (suppliersRes.data?.records || []).find(
                (s) => s.id === purchaseData.SupplierId || s.Id === purchaseData.SupplierId
              );
              
              if (supplierRecord) {
                 // Resolve City and State Names
                  let cityName = supplierRecord.city || supplierRecord.City || "";
                  let stateName = supplierRecord.state || supplierRecord.State || "";
                  
                  const cityList = parseArrayFromResponse(citiesRes);
                  const stateList = parseArrayFromResponse(statesRes);

                  const cityId = supplierRecord.CityId || supplierRecord.cityId;
                  const stateId = supplierRecord.StateId || supplierRecord.stateId;

                  if (!cityName && cityId && citiesRes?.status === 200) {
                      const foundCity = cityList.find(c => String(c.id || c.Id || c.CityId) === String(cityId));
                      if(foundCity) cityName = foundCity.name || foundCity.Name || foundCity.CityName;
                  }

                  if (!stateName && stateId && statesRes?.status === 200) {
                      const foundState = stateList.find(st => String(st.id || st.Id || st.StateId) === String(stateId));
                      if(foundState) stateName = foundState.name || foundState.Name || foundState.StateName;
                  }

                setSupplier({
                  companyName: supplierRecord.companyName || supplierRecord.CompanyName || "",
                  contactName: supplierRecord.contactName || supplierRecord.ContactName || "",
                  email: supplierRecord.email || supplierRecord.Email || "",
                  phone: supplierRecord.phone || supplierRecord.Phone || "",
                  address: supplierRecord.address || supplierRecord.AddressLine1 || "",
                  addressLine2: supplierRecord.addressLine2 || supplierRecord.AddressLine2 || "",
                  city: cityName,
                  state: stateName,
                  zipCode: supplierRecord.postalCode || supplierRecord.PostalCode || supplierRecord.zipCode || "",
                  gstin: supplierRecord.gstin || supplierRecord.GSTIN || ""
                });
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching purchase order", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 text-gray-900' : 'bg-gray-900 text-white'}`}>Loading...</div>;
  if (!purchase) return <div className={`min-h-screen flex items-center justify-center ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 text-gray-900' : 'bg-gray-900 text-white'}`}>Purchase Order not found</div>;

  return (
    <div className={`h-screen overflow-hidden p-4 md:p-10 flex justify-center font-sans ${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 text-gray-900' : 'bg-gray-900 text-white'}`}>
      <ContentCard className="w-full max-w-[1280px] !p-0">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {/* HEADER */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-4 mb-8 gap-4 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-600'}`}>
          <h1 className={`text-2xl font-medium opacity-90 ${theme === 'purple' ? 'text-purple-800' : (theme === 'emerald' ? 'text-gray-900' : 'text-white')}`}>Purchase Order</h1>
          <div className="text-left md:text-right">
            <p className={`text-lg font-medium ${theme === 'emerald' || theme === 'purple' ? 'text-gray-600' : 'text-gray-300'}`}>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* ADDRESS SECTION */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 mb-10 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-600' : 'text-gray-300'}`}>
          <div>
            <p className={`mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-gray-400'}`}>From</p>
            <h3 className={`text-xl font-bold mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-900' : 'text-white'}`}>{settings?.companyName || "Home Button"}</h3>
            <p>Phone: {settings?.phone || ""}</p>
            <p>Email: {settings?.companyEmail || ""}</p>
            {supplier?.gstin && <p>GSTIN: {supplier.gstin}</p>}
          </div>
          <div>
            <p className={`mb-2 font-semibold ${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-gray-400'}`}>To</p>
            <h3 className={`text-xl font-bold mb-3 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-900' : 'text-white'}`}>
              {supplier?.companyName || "Supplier Name Not Available"}
            </h3>
            <p className={`mb-4 whitespace-pre-wrap ${theme === 'emerald' || theme === 'purple' ? 'text-gray-800' : 'text-gray-200'}`}>
              {supplier?.address || "Address not available"}
              {supplier?.address && <br />}
              {supplier?.addressLine2 && <>{supplier.addressLine2} </>}
              {supplier?.state ? `"${supplier.state}" ` : ""}{supplier?.city ? `"${supplier.city}"` : ""}{supplier?.zipCode ? ` - ${supplier.zipCode}` : ""}
            </p>
            
            <p className="mb-1">
              Email:{" "}
              <span className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-900' : 'text-white'}`}>
                {supplier?.email || "-"}
              </span>
            </p>
            <p className="mb-3">
              Phone:{" "}
              <span className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-900' : 'text-white'}`}>
                {supplier?.phone || "-"}
              </span>
            </p>

            <p className={`mb-1 ${theme === 'emerald' || theme === 'purple' ? 'text-gray-500' : 'text-gray-400'}`}>PO #{
  (purchase.POSequence || purchase.poSequence) 
    ? String(purchase.POSequence || purchase.poSequence).padStart(5, '0') 
    : (purchase.VNo || purchase.vno || purchase.InvoiceNo || String(purchase.Id || purchase.id).padStart(5, '0'))
}</p>
            <p>Order Date: {new Date(purchase.Date).toLocaleDateString()}</p>
          </div>
        </div>

        {/* TABLE */}
        <div className="mb-8 overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-1 min-w-[600px] text-sm">
            <thead className={`border-b ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200 text-gray-700' : 'border-gray-600 text-gray-200'}`}>
              <tr className="font-semibold">
                <th className="py-2 px-2">Product</th>
                <th className="py-2 px-2 text-right">Unit Price</th>
                <th className="py-2 px-2 text-center">Quantity</th>
                <th className="py-2 px-2 text-center">Discount (%)</th>
                <th className="py-2 px-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className={`${theme === 'emerald' || theme === 'purple' ? 'text-gray-800' : 'text-gray-300'}`}>
              {details.map((item, index) => (
                <tr key={index} className={`${theme === 'emerald' || theme === 'purple' ? 'bg-gray-50 hover:bg-gray-100' : 'bg-gray-800 hover:bg-gray-700/50'} transition-colors`}>
                  <td className="py-3 px-2">{item.productName}</td>
                  <td className="py-3 px-2 text-right">{parseFloat(item.UnitPrice).toFixed(2)}</td>
                  <td className="py-3 px-2 text-center">{item.Quantity}</td>
                  <td className="py-3 px-2 text-center">{parseFloat(item.Discount).toFixed(2)}</td>
                  <td className="py-3 px-2 text-right">{parseFloat(item.Total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TOTALS */}
        <div className="flex justify-start md:justify-end">
          <div className={`w-full md:w-[420px] space-y-3 text-sm ${theme === 'emerald' || theme === 'purple' ? 'text-gray-700' : 'text-gray-300'}`}>
            <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
              <span>Subtotal:</span>
              <span>{parseFloat(purchase.GrandTotal).toFixed(2)}</span>
            </div>
            <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
              <span>Fix Discount:</span>
              <span>{parseFloat(purchase.Discount).toFixed(2)}</span>
            </div>
            <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
              <span>Total Discount:</span>
              <span>{parseFloat(purchase.TotalDiscount).toFixed(2)}</span>
            </div>
            <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
            {purchase.TaxTypeId && (
                <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                  <span>Tax Type:</span>
                  <span>{taxTypeName}</span>
                </div>
            )}
            
            {(parseFloat(purchase.IGSTRate) > 0) ? (
                 <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                    <span>IGST ({parseFloat(purchase.IGSTRate)}%):</span>
                    <span>{parseFloat(purchase.Vat || purchase.TotalTax).toFixed(2)}</span>
                 </div>
            ) : (parseFloat(purchase.CGSTRate) > 0 || parseFloat(purchase.SGSTRate) > 0) ? (
                 <>
                  <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                    <span>CGST ({parseFloat(purchase.CGSTRate)}%):</span>
                    <span>{(parseFloat(purchase.Vat || purchase.TotalTax)/2).toFixed(2)}</span>
                 </div>
                 <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                    <span>SGST ({parseFloat(purchase.SGSTRate)}%):</span>
                    <span>{(parseFloat(purchase.Vat || purchase.TotalTax)/2).toFixed(2)}</span>
                 </div>
                 </>
            ) : (
                 <div className={`flex justify-between border-b pb-2 ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200' : 'border-gray-700'}`}>
                    <span>Tax:</span>
                    <span>{parseFloat(purchase.Vat || purchase.TotalTax).toFixed(2)}</span>
                 </div>
            )}
            </div>
            <div className={`flex justify-between font-bold text-lg pt-2 border-t ${theme === 'emerald' || theme === 'purple' ? 'border-gray-200 text-gray-900' : 'border-gray-600 text-white'}`}>
              <span>Grand Total:</span>
              <span>{parseFloat(purchase.NetTotal).toFixed(2)}</span>
            </div>
          </div>
        </div>
        </div>
      </ContentCard>
    </div>
  );
};

export default PurchaseOrderPreview;
