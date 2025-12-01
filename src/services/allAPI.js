import { commonAPI } from "../services/commonAPI";
import { serverURL } from "../services/serverURL";

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



// LIST (Paginated)
export const getUsersApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/users/all?page=${page}&limit=${limit}`);

// ADD USER (with image)
export const addUserApi = (data) =>
  commonAPI("POST", `${serverURL}/users/add`, data, true); // true = multipart

// UPDATE USER
export const updateUserApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/users/update/${id}`, data, true);

// DELETE USER (soft delete)
export const deleteUserApi = (id, body) =>
  commonAPI("PUT", `${serverURL}/users/delete/${id}`, body);

// INACTIVE USERS
export const getInactiveUsersApi = () =>
  commonAPI("GET", `${serverURL}/users/inactive`);

// RESTORE USER
export const restoreUserApi = (id, body) =>
  commonAPI("PUT", `${serverURL}/users/restore/${id}`, body);

// SEARCH USERS
export const searchUserApi = (q) =>
  commonAPI("GET", `${serverURL}/users/search?q=${encodeURIComponent(q)}`);




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


// Get inactive countries
export const getInactiveCountriesApi = () =>
  commonAPI("GET", `${serverURL}/countries/inactive`, "", "");

// Restore deleted country
export const restoreCountryApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/countries/restore/${id}`, data, "");




  
// STATES
export const getStatesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/states/all?page=${page}&limit=${limit}`, "", "");

export const addStateApi = (data) =>
  commonAPI("POST", `${serverURL}/states/add`, data, "");

export const updateStateApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/states/update/${id}`, data, "");

export const deleteStateApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/states/delete/${id}`, data, "");

export const searchStateApi = (q) =>
  commonAPI("GET", `${serverURL}/states/search?q=${encodeURIComponent(q)}`, "", "");

// Get inactive states
export const getInactiveStatesApi = () =>
  commonAPI("GET", `${serverURL}/states/inactive`, "", "");

// Restore state
export const restoreStateApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/states/restore/${id}`, data, "");



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

// Get States by Country ID
export const getStatesByCountryApi = (countryId) =>
  commonAPI("GET", `${serverURL}/cities/states/${countryId}`, "", "");

// SEARCH
export const searchCityApi = (q) =>
  commonAPI("GET", `${serverURL}/cities/search?q=${encodeURIComponent(q)}`, "", "");

// Get inactive cities
export const getInactiveCitiesApi = () =>
  commonAPI("GET", `${serverURL}/cities/inactive`, "", "");

// Restore deleted city
export const restoreCityApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/cities/restore/${id}`, data, "");





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

export const getInactiveRegionsApi = async () => {
  return await commonAPI("GET", `${serverURL}/regions/inactive`, "");
};


export const restoreRegionApi = async (id, data) => {
  return await commonAPI("PUT", `${serverURL}/regions/restore/${id}`, data);
};




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

export const getInactiveTerritoriesApi = () =>
  commonAPI("GET", `${serverURL}/territories/inactive`, "", "");

export const restoreTerritoryApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/territories/restore/${id}`, data);

       

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

// 🔥 INACTIVE LIST
export const getInactiveExpenseTypesApi = () =>
  commonAPI("GET", `${serverURL}/expense-types/inactive`, "", "");

// 🔥 RESTORE
export const restoreExpenseTypeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/expense-types/restore/${id}`, data);





// ============================
// BANKS APIS
// ============================

// GET All Banks
// BANKS — PAGINATED LIST
export const getBanksApi = (page, limit) =>
  commonAPI("GET",`${serverURL}/banks/all?page=${page}&limit=${limit}`,"","");


export const addBankApi = (data) => {
  const formData = new FormData();
  formData.append("BankName", data.BankName);
  formData.append("ACName", data.ACName);
  formData.append("ACNumber", data.ACNumber);
  formData.append("Branch", data.Branch);
  formData.append("userId", data.userId);

  // MUST MATCH multer: uploadSignature.single("SignaturePicture")
  if (data.SignaturePicture instanceof File) {
    formData.append("SignaturePicture", data.SignaturePicture);
  }

  return commonAPI(
    "POST",
    `${serverURL}/banks/add`,
    formData,
    "multipart"
  );
};


export const updateBankApi = (id, data) => {
  const formData = new FormData();
  formData.append("BankName", data.BankName);
  formData.append("ACName", data.ACName);
  formData.append("ACNumber", data.ACNumber);
  formData.append("Branch", data.Branch);
  formData.append("userId", data.userId);

  // If file uploaded → send File
  if (data.SignaturePicture instanceof File) {
    formData.append("SignaturePicture", data.SignaturePicture);
  } 
  // If image removed → send empty string
  else {
    formData.append("SignaturePicture", data.SignaturePicture ?? "");
  }

  return commonAPI(
    "PUT",
    `${serverURL}/banks/update/${id}`,
    formData,
    "multipart"
  );
};


// Delete Bank (soft)
export const deleteBankApi = (id, body) =>
  commonAPI("PUT", `${serverURL}/banks/delete/${id}`, body, false);


// Dropdown
export const getBanksDropdownApi = () =>
  commonAPI("GET", `${serverURL}/banks/dropdown`);

// Search
export const searchBankApi = (q) =>
  commonAPI("GET", `${serverURL}/banks/search?q=${q}`);

// INACTIVE LIST
export const getInactiveBanksApi = () =>
  commonAPI("GET", `${serverURL}/banks/inactive`);

export const restoreBankApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/banks/restore/${id}`, data, false);





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

// Get inactive services
export const getInactiveServicesApi = () =>
  commonAPI("GET", `${serverURL}/services/inactive`);

// Restore service
export const restoreServiceApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/services/restore/${id}`, data);





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

export const getInactiveIncomesApi = () =>
  commonAPI("GET", `${serverURL}/incomes/inactive`);

export const restoreIncomeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/incomes/restore/${id}`, data);





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

export const getInactiveShippersApi = () =>
  commonAPI("GET", `${serverURL}/shippers/inactive`, "");

export const restoreShipperApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/shippers/restore/${id}`, data);





// ======================= Customer Groups =======================

// Get all customer groups (with pagination)
export const getCustomerGroupsApi = (page, limit) =>
  commonAPI("GET",`${serverURL}/customer-groups/all?page=${page}&limit=${limit}`);

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

export const getInactiveCustomerGroupsApi = () =>
  commonAPI("GET", `${serverURL}/customer-groups/inactive`, "");

export const restoreCustomerGroupApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/customer-groups/restore/${id}`, data);





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

export const getInactiveSupplierGroupsApi = () =>
  commonAPI("GET", `${serverURL}/supplier-groups/inactive`);

export const restoreSupplierGroupApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/supplier-groups/restore/${id}`, data);




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

export const getInactiveAgendaItemTypesApi = () =>
  commonAPI("GET", `${serverURL}/agenda-item-types/inactive`);

export const restoreAgendaItemTypeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/agenda-item-types/restore/${id}`, data);




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

// GET INACTIVE MEETING TYPES
export const getInactiveMeetingTypesApi = () =>
  commonAPI("GET", `${serverURL}/meeting-types/inactive`);

// RESTORE MEETING TYPE
export const restoreMeetingTypeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/meeting-types/restore/${id}`, data);




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

// INACTIVE LIST
export const getInactiveDeductionsApi = () =>
  commonAPI("GET", `${serverURL}/deductions/inactive`);

// RESTORE
export const restoreDeductionApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/deductions/restore/${id}`, data);





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

export const getInactiveResolutionStatusesApi = () =>
  commonAPI("GET", `${serverURL}/resolution-statuses/inactive`);

export const restoreResolutionStatusApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/resolution-statuses/restore/${id}`, data);



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

export const getInactiveAttendeeTypesApi = () =>
  commonAPI("GET", `${serverURL}/attendee-types/inactive`);

export const restoreAttendeeTypeApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/attendee-types/restore/${id}`, data);








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


export const getInactiveAttendanceStatusesApi = () =>
  commonAPI("GET", `${serverURL}/attendance-statuses/inactive`);

export const restoreAttendanceStatusApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/attendance-statuses/restore/${id}`, data);




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

// ⭐ GET INACTIVE LOCATIONS
export const getInactiveLocationsApi = () =>
  commonAPI("GET", `${serverURL}/locations/inactive`, "", "");

// ♻ RESTORE LOCATION
export const restoreLocationApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/locations/restore/${id}`, data, "");




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

// Get inactive warehouses
export const getInactiveWarehousesApi = () =>
  commonAPI("GET", `${serverURL}/warehouses/inactive`, "", "");

// Restore warehouse
export const restoreWarehouseApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/warehouses/restore/${id}`, data, "");


//inventory - units

/* ============================================================ */
// UNITS

export const addUnitApi = (data) =>
  commonAPI("POST", `${serverURL}/units/add`, data, "");

export const getUnitsApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/units?page=${page}&limit=${limit}`, "", "");

export const updateUnitApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/units/update/${id}`, data, "");

export const deleteUnitApi = (id, data) =>
  commonAPI("DELETE", `${serverURL}/units/delete/${id}`, data, "");

export const searchUnitsApi = (q) =>
  commonAPI("GET", `${serverURL}/units/search?q=${q}`, "", "");




/* ============================================================ */
// BRANDS

export const addBrandApi = (data) =>
  commonAPI("POST", `${serverURL}/brands/add`, data, "");

export const getBrandsApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/brands?page=${page}&limit=${limit}`, "", "");

export const updateBrandApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/brands/update/${id}`, data, "");

export const deleteBrandApi = (id, data) =>
  commonAPI("DELETE", `${serverURL}/brands/delete/${id}`, data, "");

export const searchBrandApi = (q) =>
  commonAPI("GET", `${serverURL}/brands/search?q=${q}`, "", "");



/* ============================================================
   CATEGORIES API
============================================================ */

// ADD CATEGORY
export const addCategoryApi = (data) =>
  commonAPI("POST", `${serverURL}/categories/add`, data, "");

// GET CATEGORIES (Paginated)
export const getCategoriesApi = (page, limit) =>
  commonAPI(
    "GET",
    `${serverURL}/categories?page=${page}&limit=${limit}`,
    "",
    ""
  );

// UPDATE CATEGORY
export const updateCategoryApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/categories/update/${id}`, data, "");

// DELETE CATEGORY (Soft Delete)
export const deleteCategoryApi = (id, data) =>
  commonAPI("DELETE", `${serverURL}/categories/delete/${id}`, data, "");

// SEARCH CATEGORIES
export const searchCategoryApi = (q) =>
  commonAPI("GET", `${serverURL}/categories/search?q=${q}`, "", "");

// GET INACTIVE CATEGORIES
export const getInactiveCategoriesApi = () =>
  commonAPI("GET", `${serverURL}/categories/inactive`, "", "");

// RESTORE CATEGORY
export const restoreCategoryApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/categories/restore/${id}`, data, "");



// =============================
// PRODUCTS API
// =============================

// ADD PRODUCT
export const addProductApi = (data) =>
  commonAPI("POST", `${serverURL}/products/add`, data, "");

// GET PRODUCTS (Paginated)
export const getProductsApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/products?page=${page}&limit=${limit}`, "", "");

// UPDATE PRODUCT
export const updateProductApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/products/update/${id}`, data, "");

// DELETE PRODUCT (Soft Delete)
export const deleteProductApi = (id, data) =>
  commonAPI("DELETE", `${serverURL}/products/delete/${id}`, data, "");

// SEARCH PRODUCT
export const searchProductApi = (query) =>
  commonAPI("GET", `${serverURL}/products/search?q=${query}`, "", "");

// GET INACTIVE PRODUCTS
export const getInactiveProductsApi = () =>
  commonAPI("GET", `${serverURL}/products/inactive`, "", "");

// RESTORE PRODUCT
export const restoreProductApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/products/restore/${id}`, data, "");




// =================== STOCKS ===================
// Get paginated stocks
export const getStocksApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/stocks/all?page=${page}&limit=${limit}`, "", "");

// Add stock
export const addStockApi = (data) =>
  commonAPI("POST", `${serverURL}/stocks/add`, data, "");

// Update stock
export const updateStockApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/stocks/update/${id}`, data, "");

// Delete stock (soft delete)
export const deleteStockApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/stocks/delete/${id}`, data, "");

// Search stocks
export const searchStockApi = (q) =>
  commonAPI("GET", `${serverURL}/stocks/search?q=${encodeURIComponent(q)}`, "", "");

// Get inactive stocks
export const getInactiveStocksApi = () =>
  commonAPI("GET", `${serverURL}/stocks/inactive`, "", "");

// Restore stock
export const restoreStockApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/stocks/restore/${id}`, data, "");




// ADD DAMAGED PRODUCT
export const addDamagedProductApi = (data) =>
  commonAPI("POST", `${serverURL}/damaged-products/add`, data, "");

// GET DAMAGED PRODUCTS (Paginated)
export const getDamagedProductsApi = (page, limit) =>
  commonAPI("GET",`${serverURL}/damaged-products/all?page=${page}&limit=${limit}`,"","");


// UPDATE DAMAGED PRODUCT
export const updateDamagedProductApi = (id, data) =>
  commonAPI("PUT",`${serverURL}/damaged-products/update/${id}`,data,"");

// DELETE DAMAGED PRODUCT (Soft Delete)
export const deleteDamagedProductApi = (id, data) =>
  commonAPI("PUT",`${serverURL}/damaged-products/delete/${id}`,data,"");

// SEARCH DAMAGED PRODUCT
export const searchDamagedProductsApi = (query) =>
  commonAPI("GET",`${serverURL}/damaged-products/search?q=${query}`,"","");

// GET INACTIVE DAMAGED PRODUCTS
export const getInactiveDamagedProductsApi = () =>
  commonAPI("GET",`${serverURL}/damaged-products/inactive`,"","");

// RESTORE DAMAGED PRODUCT
export const restoreDamagedProductApi = (id, data) =>
  commonAPI( "PUT", `${serverURL}/damaged-products/restore/${id}`, data, "");



// =================== human resource ===================

// ===============================
// DEPARTMENTS API
// ===============================

// ADD DEPARTMENT
export const addDepartmentApi = (data) =>
  commonAPI("POST", `${serverURL}/departments/add`, data, "");

// GET DEPARTMENTS (Paginated)
export const getDepartmentsApi = (page, limit) =>
  commonAPI("GET",`${serverURL}/departments?page=${page}&limit=${limit}`,"","");

// UPDATE DEPARTMENT
export const updateDepartmentApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/departments/update/${id}`, data, "");

// DELETE DEPARTMENT (Soft Delete)
export const deleteDepartmentApi = (id, data) =>
  commonAPI("DELETE", `${serverURL}/departments/delete/${id}`, data, "");

// SEARCH DEPARTMENTS
export const searchDepartmentApi = (q) =>
  commonAPI("GET", `${serverURL}/departments/search?q=${q}`, "", "");

// GET INACTIVE DEPARTMENTS
export const getInactiveDepartmentsApi = () =>
  commonAPI("GET", `${serverURL}/departments/inactive`, "", "");

// RESTORE DEPARTMENT
export const restoreDepartmentApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/departments/restore/${id}`, data, "");



// =========designations API======================

// ADD DESIGNATION
export const addDesignationApi = (data) =>
  commonAPI("POST", `${serverURL}/designations/add`, data, "");

// GET DESIGNATIONS (Paginated)
export const getDesignationsApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/designations?page=${page}&limit=${limit}`, "", "");

// UPDATE DESIGNATION
export const updateDesignationApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/designations/update/${id}`, data, "");

// DELETE DESIGNATION (Soft Delete)
export const deleteDesignationApi = (id, data) =>
  commonAPI("DELETE", `${serverURL}/designations/delete/${id}`, data, "");

// SEARCH DESIGNATIONS
export const searchDesignationApi = (q) =>
  commonAPI("GET", `${serverURL}/designations/search?q=${q}`, "", "");

// GET INACTIVE DESIGNATIONS
export const getInactiveDesignationsApi = () =>
  commonAPI("GET", `${serverURL}/designations/inactive`, "", "");

// RESTORE DESIGNATION
export const restoreDesignationApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/designations/restore/${id}`, data, "");




// ---------------------------------------------------------
// Employee APIs
// ---------------------------------------------------------

// ADD EMPLOYEE (with picture + incomes + deductions)
export const addEmployeeApi = (formData) =>
  commonAPI("POST", `${serverURL}/employees`, formData, true);

// GET ALL EMPLOYEES (Paginated)
export const getEmployeesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/employees?page=${page}&limit=${limit}`, "", "");

// GET SINGLE EMPLOYEE
export const getEmployeeByIdApi = (id) =>
  commonAPI("GET", `${serverURL}/employees/${id}`, "", "");

// UPDATE EMPLOYEE (PUT - with optional picture file)
export const updateEmployeeApi = (id, formData) =>
  commonAPI("PUT", `${serverURL}/employees/${id}`, formData, true);

// DELETE EMPLOYEE (Soft Delete)
export const deleteEmployeeApi = (id, data) =>
  commonAPI("DELETE", `${serverURL}/employees/${id}`, data, "");



// ROLES
export const addRoleApi = (data) =>
  commonAPI("POST", `${serverURL}/roles/add`, data, "");

export const getRolesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/roles?page=${page}&limit=${limit}`, "", "");

export const updateRoleApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/roles/update/${id}`, data, "");

export const deleteRoleApi = (id, data) =>
  commonAPI("DELETE", `${serverURL}/roles/delete/${id}`, data, "");

export const searchRoleApi = (q) =>
  commonAPI("GET", `${serverURL}/roles/search?q=${encodeURIComponent(q)}`, "", "");

// inactive
export const getInactiveRolesApi = () =>
  commonAPI("GET", `${serverURL}/roles/inactive`, "", "");

export const restoreRoleApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/roles/restore/${id}`, data, "");



// CURRENCIES
export const addCurrencyApi = (data) =>
  commonAPI("POST", `${serverURL}/currencies/add`, data, "");

export const getCurrenciesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/currencies?page=${page}&limit=${limit}`, "", "");

export const updateCurrencyApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/currencies/update/${id}`, data, "");

export const deleteCurrencyApi = (id, data) =>
  commonAPI("DELETE", `${serverURL}/currencies/delete/${id}`, data, "");

export const searchCurrencyApi = (q) =>
  commonAPI("GET", `${serverURL}/currencies/search?q=${encodeURIComponent(q)}`, "", "");

export const getInactiveCurrenciesApi = () =>
  commonAPI("GET", `${serverURL}/currencies/inactive`, "", "");

export const restoreCurrencyApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/currencies/restore/${id}`, data, "");



// LANGUAGES
export const addLanguageApi = (data) =>
  commonAPI("POST", `${serverURL}/languages/add`, data, "");

export const getLanguagesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/languages?page=${page}&limit=${limit}`, "", "");

export const updateLanguageApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/languages/update/${id}`, data, "");

export const deleteLanguageApi = (id, data) =>
  commonAPI("DELETE", `${serverURL}/languages/delete/${id}`, data, "");

export const searchLanguageApi = (q) =>
  commonAPI(
    "GET",
    `${serverURL}/languages/search?q=${encodeURIComponent(q)}`,
    "",
    ""
  );

export const getInactiveLanguagesApi = () =>
  commonAPI("GET", `${serverURL}/languages/inactive`, "", "");

export const restoreLanguageApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/languages/restore/${id}`, data, "");





// EXPENSES
export const addExpenseApi = (data) =>
  commonAPI("POST", `${serverURL}/expenses/add`, data, "");

export const getExpensesApi = (page, limit) =>
  commonAPI("GET", `${serverURL}/expenses?page=${page}&limit=${limit}`, "", "");

export const updateExpenseApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/expenses/update/${id}`, data, "");

export const deleteExpenseApi = (id, data) =>
  commonAPI("DELETE", `${serverURL}/expenses/delete/${id}`, data, "");

export const searchExpenseApi = (q) =>
  commonAPI("GET", `${serverURL}/expenses/search?q=${encodeURIComponent(q)}`, "", "");

export const getInactiveExpensesApi = () =>
  commonAPI("GET", `${serverURL}/expenses/inactive`, "", "");

export const restoreExpenseApi = (id, data) =>
  commonAPI("PUT", `${serverURL}/expenses/restore/${id}`, data, "");

export const getExpenseTypesSimpleApi = () =>
  commonAPI("GET", `${serverURL}/expense-types/simple`, "", "");


