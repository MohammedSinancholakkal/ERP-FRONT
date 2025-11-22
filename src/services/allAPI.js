import { commonAPI } from "../services/commonAPI";
import { serverURL } from "../services/serverURL";
import axios from "axios";

// Login API
export const LoginApi = async (reqBody) => {
  return await commonAPI("POST", `${serverURL}/auth/login`, reqBody, "");
};


export const changePasswordApi = async (data) => {
  return await commonAPI("PUT",`${serverURL}/auth/change-password`,data);
};



export const requestResetApi = async (data) =>
  await commonAPI("POST", `${serverURL}/auth/request-reset`, data);

export const resetPasswordApi = async (data) =>
  await commonAPI("PUT", `${serverURL}/auth/reset-password`, data);


/* ============================================================
   COUNTRIES API  (NO PAGINATION)
============================================================ */
// COUNTRIES
export const addCountryApi = (data) =>
  commonAPI("POST", `${serverURL}/countries/add`, data, "");

export const getCountriesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/countries?page=${page}&limit=${limit}`, "", "");

export const updateCountryApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/countries/update/${id}`, data, "");

export const deleteCountryApi = (id, data) =>
  commonAPI("DELETE", `${serverURL}/countries/delete/${id}`, data, "");

// export const searchCountryApi = (q) =>
//   commonAPI("GET", `${serverURL}/countries/search?q=${q}`, "", "");

export const searchCountryApi = (q) =>
  commonAPI("GET", `${serverURL}/countries/search?q=${encodeURIComponent(q)}`, "", "");



// STATES
export const getStatesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/states/all?page=${page}&limit=${limit}`, "", "");

export const addStateApi = (data) =>
  commonAPI("POST", `${serverURL}/states/add`, data, "");

export const updateStateApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/states/update/${id}`, data, "");

export const deleteStateApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/states/delete/${id}`, data, "");

// export const searchStateApi = (q) =>
//   commonAPI("GET", `${serverURL}/states/search?q=${q}`, "", "");

export const searchStateApi = (q) =>
  commonAPI("GET", `${serverURL}/states/search?q=${encodeURIComponent(q)}`, "", "");


/* ============================================================
   CITIES API  (NO PAGINATION)
============================================================ */

// LIST
export const getCitiesApi = (page, limit) =>
  commonAPI("GET",`${serverURL}/cities/all?page=${page}&limit=${limit}`,"","");


// ADD
export const addCityApi = (data) =>
  commonAPI("POST", `${serverURL}/cities/add`, data);

// UPDATE
export const updateCityApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/cities/update/${id}`, data);

// DELETE
export const deleteCityApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/cities/delete/${id}`, data);

// STATES BY COUNTRY
// export const getStatesByCountryApi = (countryId) =>
//   commonAPI("GET", `${serverURL}/cities/states/${countryId}`);
// states by country — used by Cities.jsx

export const getStatesByCountryApi = (countryId) =>
  commonAPI("GET", `${serverURL}/cities/states/${countryId}`, "", "");


// SEARCH CITIES
// export const searchCityApi = (q) =>
//   commonAPI("GET", `${serverURL}/cities/search?q=${q}`);


export const searchCityApi = (q) =>
  commonAPI("GET", `${serverURL}/cities/search?q=${encodeURIComponent(q)}`, "", "");






// ------------------- REGIONS -------------------
export const getRegionsApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/regions/all?page=${page}&limit=${limit}`, "", "");

export const addRegionApi = (data) =>
  commonAPI("POST", `${serverURL}/regions/add`, data, "");

export const updateRegionApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/regions/update/${id}`, data, "");

export const deleteRegionApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/regions/delete/${id}`, data, "");

export const searchRegionApi = (q) =>
  commonAPI("GET", `${serverURL}/regions/search?q=${encodeURIComponent(q)}`, "", "");

// ------------------- TERRITORIES -------------------
// GET Territories — PAGINATED
export const getTerritoriesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/territories/all?page=${page}&limit=${limit}`, "", "");

// Add Territory
export const addTerritoryApi = (data) =>
  commonAPI("POST", `${serverURL}/territories/add`, data, "");

// Update Territory
export const updateTerritoryApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/territories/update/${id}`, data, "");

// Delete Territory
export const deleteTerritoryApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/territories/delete/${id}`, data, "");

// SEARCH TERRITORY
export const searchTerritoryApi = (q) =>
  commonAPI("GET", `${serverURL}/territories/search?q=${encodeURIComponent(q)}`, "", "");

       

// ============================
// EXPENSE TYPES APIS
// ============================

// EXPENSE TYPES — PAGINATED LIST
export const getExpenseTypesApi = (page, limit) =>
  commonAPI("GET",`${serverURL}/expense-types/all?page=${page}&limit=${limit}`,"","");


// Add Expense Type
export const addExpenseTypeApi = (data) =>
  commonAPI("POST", `${serverURL}/expense-types/add`, data);

// Update Expense Type
export const updateExpenseTypeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/expense-types/update/${id}`, data);

// Delete Expense Type (soft delete)
export const deleteExpenseTypeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/expense-types/delete/${id}`, data);

// Search Expense Type
export const searchExpenseTypeApi = (q) =>
  commonAPI("GET", `${serverURL}/expense-types/search?q=${q}`);




// ============================
// BANKS APIS
// ============================

// GET All Banks
// BANKS — PAGINATED LIST
export const getBanksApi = (page, limit) =>
  commonAPI("GET",`${serverURL}/banks/all?page=${page}&limit=${limit}`,"","");


// Add Bank
// export const addBankApi = (data) =>
//   commonAPI("POST", `${serverURL}/banks/add`, data);

// Update Bank
// export const updateBankApi = (id, data) =>
//   commonAPI("PUT", `${serverURL}/banks/update/${id}`, data);


// ADD BANK — uses Axios directly (FormData)
export const addBankApi = (data) => {
  const formData = new FormData();
  formData.append("BankName", data.BankName);
  formData.append("ACName", data.ACName);
  formData.append("ACNumber", data.ACNumber);
  formData.append("Branch", data.Branch);
  formData.append("userId", data.userId);

  if (data.SignaturePicture) {
    formData.append("signature", data.SignaturePicture);
  }

  return axios.post(`${serverURL}/banks/add`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};


// UPDATE BANK — uses Axios directly (FormData)
export const updateBankApi = (id, data) => {
  const formData = new FormData();
  formData.append("BankName", data.BankName);
  formData.append("ACName", data.ACName);
  formData.append("ACNumber", data.ACNumber);
  formData.append("Branch", data.Branch);
  formData.append("userId", data.userId);

  if (data.SignaturePicture) {
    formData.append("signature", data.SignaturePicture);
  }

  return axios.put(`${serverURL}/banks/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};





// Delete Bank (soft)
export const deleteBankApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/banks/delete/${id}`, data);

// Dropdown
export const getBanksDropdownApi = () =>
  commonAPI("GET", `${serverURL}/banks/dropdown`);

// Search
export const searchBankApi = (q) =>
  commonAPI("GET", `${serverURL}/banks/search?q=${q}`);







// ========================= SERVICES =========================

// Get all services
export const getServicesApi = (page, limit) =>
  commonAPI("GET",`${serverURL}/services/all?page=${page}&limit=${limit}`,"","");

// Add service
export const addServiceApi = (data) =>
  commonAPI("POST", `${serverURL}/services/add`, data);

// Update service
export const updateServiceApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/services/update/${id}`, data);

// Delete service (soft delete)
export const deleteServiceApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/services/delete/${id}`, data);

// Search services
export const searchServiceApi = (q) =>
  commonAPI("GET", `${serverURL}/services/search?q=${q}`);






// ========================= INCOMES API =========================

// Get all incomes (with pagination)
export const getIncomesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/incomes/all?page=${page}&limit=${limit}`);

// Add Income
export const addIncomeApi = (data) =>
  commonAPI("POST", `${serverURL}/incomes/add`, data);

// Update Income
export const updateIncomeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/incomes/update/${id}`, data);

// Delete Income
export const deleteIncomeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/incomes/delete/${id}`, data);

// Search Income
export const searchIncomeApi = (query) =>
  commonAPI("GET", `${serverURL}/incomes/search?q=${query}`);




// ========================= SHIPPERS API =========================

export const getShippersApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/shippers/all?page=${page}&limit=${limit}`);

export const addShipperApi = (data) =>
  commonAPI("POST", `${serverURL}/shippers/add`, data);

export const updateShipperApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/shippers/update/${id}`, data);

export const deleteShipperApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/shippers/delete/${id}`, data);

export const searchShipperApi = (q) =>
  commonAPI("GET", `${serverURL}/shippers/search?q=${q}`);





// ======================= Customer Groups =======================

// Get all customer groups (with pagination)
export const getCustomerGroupsApi = (page, limit) =>
  commonAPI(
    "GET",
    `${serverURL}/customer-groups/all?page=${page}&limit=${limit}`
  );

// Add new customer group
export const addCustomerGroupApi = (data) =>
  commonAPI("POST", `${serverURL}/customer-groups/add`, data);

// Update customer group
export const updateCustomerGroupApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/customer-groups/update/${id}`, data);

// Soft delete customer group
export const deleteCustomerGroupApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/customer-groups/delete/${id}`, data);

// Search customer groups
export const searchCustomerGroupApi = (query) =>
  commonAPI("GET", `${serverURL}/customer-groups/search?q=${query}`);




//   Supplier Groups APIs
export const getSupplierGroupsApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/supplier-groups/all?page=${page}&limit=${limit}`);

export const addSupplierGroupApi = (data) =>
  commonAPI("POST", `${serverURL}/supplier-groups/add`, data);

export const updateSupplierGroupApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/supplier-groups/update/${id}`, data);

export const deleteSupplierGroupApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/supplier-groups/delete/${id}`, data);

export const searchSupplierGroupApi = (q) =>
  commonAPI("GET", `${serverURL}/supplier-groups/search?q=${q}`);



// ======================= Agenda Item Types APIs =======================
export const getAgendaItemTypesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/agenda-item-types/all?page=${page}&limit=${limit}`);

export const addAgendaItemTypeApi = (data) =>
  commonAPI("POST", `${serverURL}/agenda-item-types/add`, data);

export const updateAgendaItemTypeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/agenda-item-types/update/${id}`, data);

export const deleteAgendaItemTypeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/agenda-item-types/delete/${id}`, data);

export const searchAgendaItemTypeApi = (q) =>
  commonAPI("GET", `${serverURL}/agenda-item-types/search?q=${q}`);





// ======================= Meeting Types APIs =======================

export const getMeetingTypesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/meeting-types/all?page=${page}&limit=${limit}`);

export const addMeetingTypeApi = (data) =>
  commonAPI("POST", `${serverURL}/meeting-types/add`, data);

export const updateMeetingTypeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/meeting-types/update/${id}`, data);

export const deleteMeetingTypeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/meeting-types/delete/${id}`, data);

export const searchMeetingTypeApi = (q) =>
  commonAPI("GET", `${serverURL}/meeting-types/search?q=${q}`);




// ======================= Deductions APIs =======================

export const getDeductionsApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/deductions/all?page=${page}&limit=${limit}`);

export const deleteDeductionApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/deductions/delete/${id}`, data);

export const addDeductionApi = (data) =>
  commonAPI("POST", `${serverURL}/deductions/add`, data);

export const updateDeductionApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/deductions/update/${id}`, data);

export const searchDeductionApi = (q) =>
  commonAPI("GET", `${serverURL}/deductions/search?q=${q}`);



// ================= Resolution Statuses =================
export const getResolutionStatusesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/resolution-statuses/all?page=${page}&limit=${limit}`);

export const addResolutionStatusApi = (data) =>
  commonAPI("POST", `${serverURL}/resolution-statuses/add`, data);

export const updateResolutionStatusApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/resolution-statuses/update/${id}`, data);

export const deleteResolutionStatusApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/resolution-statuses/delete/${id}`, data);

export const searchResolutionStatusApi = (q) =>
  commonAPI("GET", `${serverURL}/resolution-statuses/search?q=${q}`);




// ================= Attendee Types =================
export const getAttendeeTypesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/attendee-types/all?page=${page}&limit=${limit}`);

export const addAttendeeTypeApi = (data) =>
  commonAPI("POST", `${serverURL}/attendee-types/add`, data);

export const updateAttendeeTypeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/attendee-types/update/${id}`, data);

export const deleteAttendeeTypeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/attendee-types/delete/${id}`, data);

export const searchAttendeeTypeApi = (q) =>
  commonAPI("GET", `${serverURL}/attendee-types/search?q=${q}`);



// ============= Attendance Statuses =============
export const getAttendanceStatusesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/attendance-statuses/all?page=${page}&limit=${limit}`);

export const addAttendanceStatusApi = (data) =>
  commonAPI("POST", `${serverURL}/attendance-statuses/add`, data);

export const updateAttendanceStatusApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/attendance-statuses/update/${id}`, data);

export const deleteAttendanceStatusApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/attendance-statuses/delete/${id}`, data);

export const searchAttendanceStatusApi = (q) =>
  commonAPI("GET", `${serverURL}/attendance-statuses/search?q=${q}`);




// =================== LOCATIONS ===================
export const getLocationsApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/locations/all?page=${page}&limit=${limit}`, "", "");

export const addLocationApi = (data) =>
  commonAPI("POST", `${serverURL}/locations/add`, data, "");

export const updateLocationApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/locations/update/${id}`, data, "");

export const deleteLocationApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/locations/delete/${id}`, data, "");

export const searchLocationApi = (q) =>
  commonAPI("GET", `${serverURL}/locations/search?q=${encodeURIComponent(q)}`, "", "");



// ===============================
// WAREHOUSES API
// ===============================

// Get all warehouses (with pagination)
export const getWarehousesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/warehouses/all?page=${page}&limit=${limit}`, "", "");

// Add warehouse
export const addWarehouseApi = (data) =>
  commonAPI("POST", `${serverURL}/warehouses/add`, data, "");

// Update warehouse
export const updateWarehouseApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/warehouses/update/${id}`, data, "");

// Delete warehouse (soft delete)
export const deleteWarehouseApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/warehouses/delete/${id}`, data, "");

// Search warehouse
export const searchWarehouseApi = (q) =>
  commonAPI("GET", `${serverURL}/warehouses/search?q=${encodeURIComponent(q)}`, "", "");