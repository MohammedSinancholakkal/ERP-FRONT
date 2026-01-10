import React, { createContext, useContext, useState, useCallback } from "react";
import {
  // Countries, States, Cities
  getCountriesApi, getStatesApi, getCitiesApi,
  getInactiveCountriesApi, getInactiveStatesApi, getInactiveCitiesApi,
  searchCountryApi, searchStateApi, searchCityApi,

  // Banks
  getBanksApi, searchBankApi, getInactiveBanksApi,
  // Locations
  getLocationsApi, searchLocationApi, getInactiveLocationsApi,
  // Warehouses
  getWarehousesApi, searchWarehouseApi, getInactiveWarehousesApi,
  // Regions
  getRegionsApi, searchRegionApi, getInactiveRegionsApi,
  // Territories
  getTerritoriesApi, searchTerritoryApi, getInactiveTerritoriesApi,
  // Customer Groups
  getCustomerGroupsApi, searchCustomerGroupApi, getInactiveCustomerGroupsApi,
  // Supplier Groups
  getSupplierGroupsApi, searchSupplierGroupApi, getInactiveSupplierGroupsApi,
  // Agenda Item Types
  getAgendaItemTypesApi, searchAgendaItemTypeApi, getInactiveAgendaItemTypesApi,
  // Meeting Types
  getMeetingTypesApi, searchMeetingTypeApi, getInactiveMeetingTypesApi,
  // Attendee Types
  getAttendeeTypesApi, searchAttendeeTypeApi, getInactiveAttendeeTypesApi,
  // Attendance Statuses
  getAttendanceStatusesApi, searchAttendanceStatusApi, getInactiveAttendanceStatusesApi,
  // Resolution Statuses
  getResolutionStatusesApi, searchResolutionStatusApi, getInactiveResolutionStatusesApi,
  // Expense Types
  getExpenseTypesApi, searchExpenseTypeApi, getInactiveExpenseTypesApi,
  // Incomes
  getIncomesApi, searchIncomeApi, getInactiveIncomesApi,
  // Deductions
  getDeductionsApi, searchDeductionApi, getInactiveDeductionsApi,
  // Services
  getServicesApi, searchServiceApi, getInactiveServicesApi,
  // Shippers
  getShippersApi, searchShipperApi, getInactiveShippersApi,
  // Tax Types
  getTaxTypesApi, searchTaxTypeApi, getInactiveTaxTypesApi

} from "../services/allAPI";

const MastersContext = createContext();

export const useMasters = () => useContext(MastersContext);

export const MastersProvider = ({ children }) => {
  // HELPER: Create State
  const createState = () => useState({ data: [], total: 0, loaded: false, inactive: [], inactiveLoaded: false });

  // --- STATE ---
  const [countriesData, setCountriesData] = createState();
  const [statesData, setStatesData] = createState();
  const [citiesData, setCitiesData] = createState();
  const [banksData, setBanksData] = createState();
  const [locationsData, setLocationsData] = createState();
  const [warehousesData, setWarehousesData] = createState();
  const [regionsData, setRegionsData] = createState();
  const [territoriesData, setTerritoriesData] = createState();
  const [customerGroupsData, setCustomerGroupsData] = createState();
  const [supplierGroupsData, setSupplierGroupsData] = createState();
  const [agendaItemTypesData, setAgendaItemTypesData] = createState();
  const [meetingTypesData, setMeetingTypesData] = createState();
  const [attendeeTypesData, setAttendeeTypesData] = createState();
  const [attendanceStatusesData, setAttendanceStatusesData] = createState();
  const [resolutionStatusesData, setResolutionStatusesData] = createState();
  const [expenseTypesData, setExpenseTypesData] = createState();
  const [incomesData, setIncomesData] = createState();
  const [deductionsData, setDeductionsData] = createState();
  const [servicesData, setServicesData] = createState();
  const [shippersData, setShippersData] = createState();
  const [taxTypesData, setTaxTypesData] = createState();

  // --- GENERIC LOADER HELPER ---
  const createLoadFunction = (state, setState, getApi, searchApi, name) => {
    return useCallback(async (page = 1, limit = 25, search = "", forceRefresh = false, ...args) => {
      // Check cache (only if no search and no extra args, as args might change result)
      // If args exist, we can't easily cache unless we cache by args key. For now, bypass cache if args exist.
      const hasArgs = args.length > 0 && args.some(a => a && Object.keys(a).length > 0);
      
      if (!forceRefresh && !search && !hasArgs && state.loaded && page === 1) {
        return { data: state.data, total: state.total };
      }
      try {
        let res;
        if (search) res = await searchApi(search);
        else res = await getApi(page, limit, ...args);

        if (res?.status === 200) {
          const records = res.data.records || res.data || [];
          const total = res.data.total || (Array.isArray(records) ? records.length : 0);
          
          // Should we normalize? Ideally yes, but sticking to raw for generic support unless structure varies wildly.
          // Most APIs return { Id/id, Name/name ... }
          // We'll normalize keys to standard camelCase if needed, but currently pages handle data access.
          // Let's pass raw records for compatibility with existing page logic.
          
          if (!search && page === 1) {
             setState(prev => ({ ...prev, data: records, total, loaded: true }));
          }
          return { data: records, total };
        }
      } catch (err) {
        console.error(`Context Load ${name} Error`, err);
      }
      return { data: [], total: 0 };
    }, [state.loaded, state.data, state.total]);
  };

  const createLoadInactiveFunction = (state, setState, getInactiveApi, name) => {
     return useCallback(async () => {
        if (state.inactiveLoaded) return state.inactive;
        try {
            const res = await getInactiveApi();
            if (res?.status === 200) {
                const records = res.data.records || res.data || [];
                setState(prev => ({ ...prev, inactive: records, inactiveLoaded: true }));
                return records;
            }
        } catch (err) { console.error(`Context Load Inactive ${name} Error`, err); }
        return [];
      }, [state.inactiveLoaded, state.inactive]);
  };

  const createRefresh = (setState) => useCallback(() => setState(prev => ({ ...prev, loaded: false })), []);
  const createRefreshInactive = (setState) => useCallback(() => setState(prev => ({ ...prev, inactiveLoaded: false })), []);


  // --- CONSTRUCT EXPORTS using Generators ---
  
  // 1. Countries
  const loadCountries = createLoadFunction(countriesData, setCountriesData, getCountriesApi, searchCountryApi, "Countries");
  const loadInactiveCountries = createLoadInactiveFunction(countriesData, setCountriesData, getInactiveCountriesApi, "Countries");
  const refreshCountries = createRefresh(setCountriesData);
  const refreshInactiveCountries = createRefreshInactive(setCountriesData);

  // 2. States (Has slight custom norm in original, but generic might work if pages adjust. Original did normalization.)
  // We will replicate original custom normalization for States/Cities if deemed critical, or just rely on raw. 
  // Original States logic normalized keys. Let's keep it generic for new ones, but maybe explicit for States/Cities if needed.
  // Actually, checking previous States.jsx, it uses `data` from context. 
  // Let's stick to generic raw data passing. If pages expect `name` but get `Name`, we might need normalization.
  // Most new APIs on backend return `Id`, `Name`. Frontend needs to handle case insensitivity or we normalize here.
  // I will add a `normalization` callback to generic loader if provided.
  
  const genericNormalize = (arr) => arr.map(r => {
      // Basic normalization to camelCase for common fields if they exist as PascalCase
      const newObj = { ...r };
      if (r.Id) newObj.id = r.Id;
      if (r.Name) newObj.name = r.Name;
      // We don't delete original keys to be safe.
      return newObj;
  });

  const createLoadFunctionNorm = (state, setState, getApi, searchApi, name, normFn) => {
    return useCallback(async (page = 1, limit = 25, search = "", forceRefresh = false) => {
      if (!forceRefresh && !search && state.loaded && page === 1) return { data: state.data, total: state.total };
      try {
        let res;
        if (search) res = await searchApi(search);
        else res = await getApi(page, limit);
        if (res?.status === 200) {
          let records = res.data.records || res.data || [];
          if (normFn) records = normFn(records);
          // else records = genericNormalize(records); // Optional: auto-normalize?

          const total = res.data.total || (Array.isArray(records) ? records.length : 0);
          if (!search && page === 1) setState(prev => ({ ...prev, data: records, total, loaded: true }));
          return { data: records, total };
        }
      } catch (err) { console.error(`Context Load ${name} Error`, err); }
      return { data: [], total: 0 };
    }, [state.loaded, state.data, state.total]);
  };
    
  // States Normalizer (from original)
  const normStates = (arr) => arr.map(r => ({
      ...r,
      id: r.Id || r.id,
      name: r.Name || r.name,
      countryId: r.CountryId || r.countryId,
      countryName: r.Country?.Name || r.countryName || "N/A"
  }));

  const loadStates = createLoadFunctionNorm(statesData, setStatesData, getStatesApi, searchStateApi, "States", normStates);
  const loadInactiveStates = createLoadInactiveFunction(statesData, setStatesData, getInactiveStatesApi, "States"); // Inactive also needs norm? standard func logic has reuse issue if norm needed. 
  // Re-implementing loadInactive with norm support would be cleaner. 
  // For now, let's just stick to "Load" fetchers having norm. Inactive usually just list.

  const refreshStates = createRefresh(setStatesData);
  const refreshInactiveStates = createRefreshInactive(setStatesData);

  // 3. Cities
  const loadCities = createLoadFunction(citiesData, setCitiesData, getCitiesApi, searchCityApi, "Cities");
  const loadInactiveCities = createLoadInactiveFunction(citiesData, setCitiesData, getInactiveCitiesApi, "Cities");
  const refreshCities = createRefresh(setCitiesData);
  const refreshInactiveCities = createRefreshInactive(setCitiesData);

  // 4. Banks
  const loadBanks = createLoadFunction(banksData, setBanksData, getBanksApi, searchBankApi, "Banks");
  const loadInactiveBanks = createLoadInactiveFunction(banksData, setBanksData, getInactiveBanksApi, "Banks");
  const refreshBanks = createRefresh(setBanksData);
  const refreshInactiveBanks = createRefreshInactive(setBanksData);

  // 5. Locations
  // Locations API update: getLocationsApi takes filters (page, limit, filters). 
  // Our generic expects (page, limit, search). Location search API is separate.
  // If we just pass page/limit to getLocationsApi, filters will be empty {} which is fine.
  const loadLocations = createLoadFunction(locationsData, setLocationsData, getLocationsApi, searchLocationApi, "Locations");
  const loadInactiveLocations = createLoadInactiveFunction(locationsData, setLocationsData, getInactiveLocationsApi, "Locations");
  const refreshLocations = createRefresh(setLocationsData);
  const refreshInactiveLocations = createRefreshInactive(setLocationsData);

  // 6. Warehouses
  const loadWarehouses = createLoadFunction(warehousesData, setWarehousesData, getWarehousesApi, searchWarehouseApi, "Warehouses");
  const loadInactiveWarehouses = createLoadInactiveFunction(warehousesData, setWarehousesData, getInactiveWarehousesApi, "Warehouses");
  const refreshWarehouses = createRefresh(setWarehousesData);
  const refreshInactiveWarehouses = createRefreshInactive(setWarehousesData);

  // 7. Regions
  const loadRegions = createLoadFunction(regionsData, setRegionsData, getRegionsApi, searchRegionApi, "Regions");
  const loadInactiveRegions = createLoadInactiveFunction(regionsData, setRegionsData, getInactiveRegionsApi, "Regions");
  const refreshRegions = createRefresh(setRegionsData);
  const refreshInactiveRegions = createRefreshInactive(setRegionsData);

  // 8. Territories
  const loadTerritories = createLoadFunction(territoriesData, setTerritoriesData, getTerritoriesApi, searchTerritoryApi, "Territories");
  const loadInactiveTerritories = createLoadInactiveFunction(territoriesData, setTerritoriesData, getInactiveTerritoriesApi, "Territories");
  const refreshTerritories = createRefresh(setTerritoriesData);
  const refreshInactiveTerritories = createRefreshInactive(setTerritoriesData);

  // 9. Customer Groups
  const loadCustomerGroups = createLoadFunction(customerGroupsData, setCustomerGroupsData, getCustomerGroupsApi, searchCustomerGroupApi, "CustomerGroups");
  const loadInactiveCustomerGroups = createLoadInactiveFunction(customerGroupsData, setCustomerGroupsData, getInactiveCustomerGroupsApi, "CustomerGroups");
  const refreshCustomerGroups = createRefresh(setCustomerGroupsData);
  const refreshInactiveCustomerGroups = createRefreshInactive(setCustomerGroupsData);

  // 10. Supplier Groups
  const loadSupplierGroups = createLoadFunction(supplierGroupsData, setSupplierGroupsData, getSupplierGroupsApi, searchSupplierGroupApi, "SupplierGroups");
  const loadInactiveSupplierGroups = createLoadInactiveFunction(supplierGroupsData, setSupplierGroupsData, getInactiveSupplierGroupsApi, "SupplierGroups");
  const refreshSupplierGroups = createRefresh(setSupplierGroupsData);
  const refreshInactiveSupplierGroups = createRefreshInactive(setSupplierGroupsData);

  // 11. Agenda Item Types
  const loadAgendaItemTypes = createLoadFunction(agendaItemTypesData, setAgendaItemTypesData, getAgendaItemTypesApi, searchAgendaItemTypeApi, "AgendaItemTypes");
  const loadInactiveAgendaItemTypes = createLoadInactiveFunction(agendaItemTypesData, setAgendaItemTypesData, getInactiveAgendaItemTypesApi, "AgendaItemTypes");
  const refreshAgendaItemTypes = createRefresh(setAgendaItemTypesData);
  const refreshInactiveAgendaItemTypes = createRefreshInactive(setAgendaItemTypesData);
  
  // 12. Meeting Types
  const loadMeetingTypes = createLoadFunction(meetingTypesData, setMeetingTypesData, getMeetingTypesApi, searchMeetingTypeApi, "MeetingTypes");
  const loadInactiveMeetingTypes = createLoadInactiveFunction(meetingTypesData, setMeetingTypesData, getInactiveMeetingTypesApi, "MeetingTypes");
  const refreshMeetingTypes = createRefresh(setMeetingTypesData);
  const refreshInactiveMeetingTypes = createRefreshInactive(setMeetingTypesData);

  // 13. Attendee Types
  const loadAttendeeTypes = createLoadFunction(attendeeTypesData, setAttendeeTypesData, getAttendeeTypesApi, searchAttendeeTypeApi, "AttendeeTypes");
  const loadInactiveAttendeeTypes = createLoadInactiveFunction(attendeeTypesData, setAttendeeTypesData, getInactiveAttendeeTypesApi, "AttendeeTypes");
  const refreshAttendeeTypes = createRefresh(setAttendeeTypesData);
  const refreshInactiveAttendeeTypes = createRefreshInactive(setAttendeeTypesData);

  // 14. Attendance Statuses
  const loadAttendanceStatuses = createLoadFunction(attendanceStatusesData, setAttendanceStatusesData, getAttendanceStatusesApi, searchAttendanceStatusApi, "AttendanceStatuses");
  const loadInactiveAttendanceStatuses = createLoadInactiveFunction(attendanceStatusesData, setAttendanceStatusesData, getInactiveAttendanceStatusesApi, "AttendanceStatuses");
  const refreshAttendanceStatuses = createRefresh(setAttendanceStatusesData);
  const refreshInactiveAttendanceStatuses = createRefreshInactive(setAttendanceStatusesData);

  // 15. Resolution Statuses
  const loadResolutionStatuses = createLoadFunction(resolutionStatusesData, setResolutionStatusesData, getResolutionStatusesApi, searchResolutionStatusApi, "ResolutionStatuses");
  const loadInactiveResolutionStatuses = createLoadInactiveFunction(resolutionStatusesData, setResolutionStatusesData, getInactiveResolutionStatusesApi, "ResolutionStatuses");
  const refreshResolutionStatuses = createRefresh(setResolutionStatusesData);
  const refreshInactiveResolutionStatuses = createRefreshInactive(setResolutionStatusesData);

  // 16. Expense Types
  const loadExpenseTypes = createLoadFunction(expenseTypesData, setExpenseTypesData, getExpenseTypesApi, searchExpenseTypeApi, "ExpenseTypes");
  const loadInactiveExpenseTypes = createLoadInactiveFunction(expenseTypesData, setExpenseTypesData, getInactiveExpenseTypesApi, "ExpenseTypes");
  const refreshExpenseTypes = createRefresh(setExpenseTypesData);
  const refreshInactiveExpenseTypes = createRefreshInactive(setExpenseTypesData);

  // 17. Incomes
  const loadIncomes = createLoadFunction(incomesData, setIncomesData, getIncomesApi, searchIncomeApi, "Incomes");
  const loadInactiveIncomes = createLoadInactiveFunction(incomesData, setIncomesData, getInactiveIncomesApi, "Incomes");
  const refreshIncomes = createRefresh(setIncomesData);
  const refreshInactiveIncomes = createRefreshInactive(setIncomesData);

  // 18. Deductions
  const loadDeductions = createLoadFunction(deductionsData, setDeductionsData, getDeductionsApi, searchDeductionApi, "Deductions");
  const loadInactiveDeductions = createLoadInactiveFunction(deductionsData, setDeductionsData, getInactiveDeductionsApi, "Deductions");
  const refreshDeductions = createRefresh(setDeductionsData);
  const refreshInactiveDeductions = createRefreshInactive(setDeductionsData);

  // 19. Services
  const loadServices = createLoadFunction(servicesData, setServicesData, getServicesApi, searchServiceApi, "Services");
  const loadInactiveServices = createLoadInactiveFunction(servicesData, setServicesData, getInactiveServicesApi, "Services");
  const refreshServices = createRefresh(setServicesData);
  const refreshInactiveServices = createRefreshInactive(setServicesData);

  // 20. Shippers
  const loadShippers = createLoadFunction(shippersData, setShippersData, getShippersApi, searchShipperApi, "Shippers");
  const loadInactiveShippers = createLoadInactiveFunction(shippersData, setShippersData, getInactiveShippersApi, "Shippers");
  const refreshShippers = createRefresh(setShippersData);
  const refreshInactiveShippers = createRefreshInactive(setShippersData);

  // 21. Tax Types
  const loadTaxTypes = createLoadFunction(taxTypesData, setTaxTypesData, getTaxTypesApi, searchTaxTypeApi, "TaxTypes");
  const loadInactiveTaxTypes = createLoadInactiveFunction(taxTypesData, setTaxTypesData, getInactiveTaxTypesApi, "TaxTypes");
  const refreshTaxTypes = createRefresh(setTaxTypesData);
  const refreshInactiveTaxTypes = createRefreshInactive(setTaxTypesData);


  return (
    <MastersContext.Provider value={{
      countriesData, loadCountries, refreshCountries, loadInactiveCountries, refreshInactiveCountries,
      statesData, loadStates, refreshStates, loadInactiveStates, refreshInactiveStates,
      citiesData, loadCities, refreshCities, loadInactiveCities, refreshInactiveCities,
      banksData, loadBanks, refreshBanks, loadInactiveBanks, refreshInactiveBanks,
      locationsData, loadLocations, refreshLocations, loadInactiveLocations, refreshInactiveLocations,
      warehousesData, loadWarehouses, refreshWarehouses, loadInactiveWarehouses, refreshInactiveWarehouses,
      regionsData, loadRegions, refreshRegions, loadInactiveRegions, refreshInactiveRegions,
      territoriesData, loadTerritories, refreshTerritories, loadInactiveTerritories, refreshInactiveTerritories,
      customerGroupsData, loadCustomerGroups, refreshCustomerGroups, loadInactiveCustomerGroups, refreshInactiveCustomerGroups,
      supplierGroupsData, loadSupplierGroups, refreshSupplierGroups, loadInactiveSupplierGroups, refreshInactiveSupplierGroups,
      agendaItemTypesData, loadAgendaItemTypes, refreshAgendaItemTypes, loadInactiveAgendaItemTypes, refreshInactiveAgendaItemTypes,
      meetingTypesData, loadMeetingTypes, refreshMeetingTypes, loadInactiveMeetingTypes, refreshInactiveMeetingTypes,
      attendeeTypesData, loadAttendeeTypes, refreshAttendeeTypes, loadInactiveAttendeeTypes, refreshInactiveAttendeeTypes,
      attendanceStatusesData, loadAttendanceStatuses, refreshAttendanceStatuses, loadInactiveAttendanceStatuses, refreshInactiveAttendanceStatuses,
      resolutionStatusesData, loadResolutionStatuses, refreshResolutionStatuses, loadInactiveResolutionStatuses, refreshInactiveResolutionStatuses,
      expenseTypesData, loadExpenseTypes, refreshExpenseTypes, loadInactiveExpenseTypes, refreshInactiveExpenseTypes,
      incomesData, loadIncomes, refreshIncomes, loadInactiveIncomes, refreshInactiveIncomes,
      deductionsData, loadDeductions, refreshDeductions, loadInactiveDeductions, refreshInactiveDeductions,
      servicesData, loadServices, refreshServices, loadInactiveServices, refreshInactiveServices,
      servicesData, loadServices, refreshServices, loadInactiveServices, refreshInactiveServices,
      shippersData, loadShippers, refreshShippers, loadInactiveShippers, refreshInactiveShippers,
      taxTypesData, loadTaxTypes, refreshTaxTypes, loadInactiveTaxTypes, refreshInactiveTaxTypes
    }}>
      {children}
    </MastersContext.Provider>
  );
};
export default MastersContext;
