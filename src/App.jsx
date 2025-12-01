import { Route, Routes } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import Countries from "./pages/masters/Countries";
import Cities from "./pages/masters/Cities";
import States from "./pages/masters/States";
import Territories from "./pages/masters/Territories";
import Regions from "./pages/masters/Regions";
import ExpenseTypes from "./pages/masters/ExpenseTypes";
import Banks from "./pages/masters/Banks";
import Services from "./pages/masters/Services";
import ResetPassword from "./components/ResetPassword";
import Incomes from "./pages/masters/Incomes";
import Shippers from "./pages/masters/Shippers";
import CustomerGroups from "./pages/masters/CustomerGroups";
import SupplierGroups from "./pages/masters/SupplierGroups";
import AgendaItemTypes from "./pages/masters/AgendaItemTypes";
import MeetingTypes from "./pages/masters/MeetingTypes";
import Deductions from "./pages/masters/Deductions";
import ResolutionStatuses from "./pages/masters/ResolutionStatuses";
import AttendeeTypes from "./pages/masters/AttendeeTypes";
import AttendanceStatuses from "./pages/masters/AttendanceStatuses";
import Locations from "./pages/masters/Locations";
import Warehouses from "./pages/masters/Warehouses";
import Units from "./pages/inventory/Units";
import Brands from "./pages/inventory/Brands";
import Categories from "./pages/inventory/Categories";
import Products from "./pages/inventory/Products";
import DamagedProducts from "./pages/inventory/DamagedProducts";
import UpdateStocks from "./pages/inventory/UpdateStock";
import Departments from "./pages/human resource/Departments";
import Designations from "./pages/human resource/Designations";
import NewEmployee from "./pages/human resource/NewEmployee";
import UserManagement from "./pages/Administration/UserManagement"  ;
import Roles from "./pages/Administration/Roles"  ;
import Currencies from "./pages/Administration/Currencies"  ;
import Languages from "./pages/Administration/Languages"  ;
import Expenses from "./pages/Cash Bank/Expenses"  ;
import Customers from "./pages/business partners/Customers"  ;
import Suppliers from "./pages/business partners/Suppliers"  ;

function App() {
  return (
    <>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Login />} />

        {/* Reset Password Page */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected pages */}
        <Route path="/app" element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="masters/countries" element={<Countries />} />
          <Route path="masters/cities" element={<Cities />} />
          <Route path="masters/states" element={<States />} />
          <Route path="masters/territories" element={<Territories />} />
          <Route path="masters/regions" element={<Regions />} />
          <Route path="masters/expensetypes" element={<ExpenseTypes />} />
          <Route path="masters/banks" element={<Banks />} />
          <Route path="masters/services" element={<Services />} />
          <Route path="masters/incomes" element={<Incomes />} />
          <Route path="masters/shippers" element={<Shippers />} />
          <Route path="masters/customergroups" element={<CustomerGroups />} />
          <Route path="masters/suppliergroups" element={<SupplierGroups />} />
          <Route path="masters/agendaitemtypes" element={<AgendaItemTypes />} />
          <Route path="masters/meetingtypes" element={<MeetingTypes />} />
          <Route path="masters/deductions" element={<Deductions />} />
          <Route path="masters/resolutionstatus" element={<ResolutionStatuses />} />
          <Route path="masters/attendeetypes" element={<AttendeeTypes />} />
          <Route path="masters/attendancestatus" element={<AttendanceStatuses />} />
          <Route path="masters/locations" element={<Locations />} />
          <Route path="masters/warehouses" element={<Warehouses />} />


          {/* inventory */}

          <Route path="inventory/units" element={<Units />} />
          <Route path="inventory/brands" element={<Brands />} />
          <Route path="inventory/categories" element={<Categories />} />
          <Route path="inventory/products" element={<Products />} />
          <Route path="inventory/updatestock" element={<UpdateStocks />} />
          <Route path="inventory/damagedproducts" element={<DamagedProducts />} />



          {/* human resource */}

          <Route path="hr/departments" element={<Departments />} />
          <Route path="hr/designations" element={<Designations />} />
          <Route path="hr/newemployee" element={<NewEmployee />} />


        {/* administration */}
        <Route path="administration/usermanagement" element={<UserManagement />} />
        <Route path="administration/roles" element={<Roles />} />
        <Route path="administration/currencies" element={<Currencies />} />
        <Route path="administration/language" element={<Languages />} />

        {/* cash/bank */}
        <Route path="cashbank/expenses" element={<Expenses />} />



        {/* business partners */}
        <Route path="businesspartners/customers" element={<Customers />} />
        <Route path="businesspartners/suppliers" element={<Suppliers />} />

        </Route>
      </Routes>
    </>
  );
}

export default App;
