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
import BankTransactions from "./pages/Cash Bank/BankTransactions"  ;
import CustomerReceive from "./pages/Cash Bank/CustomerReceive"  ;
import SupplierPayment from "./pages/Cash Bank/SupplierPayment"  ;
import CashAdjustment from "./pages/Cash Bank/CashAdjustment"  ;
import GoodsReceipt from "./pages/inventory/GoodsReceipt";
import NewGoodsReceipt from "./pages/inventory/NewGoodsReceipt";
import GoodsIssue from "./pages/inventory/GoodsIssue";
import Employees from "./pages/human resource/Employees";
import Attendance from "./pages/human resource/Attendance";
import Payroll from "./pages/human resource/Payroll";
import JournalVoucher from "./pages/Financial/JournalVoucher";
import ContraVoucher from "./pages/Financial/ContraVoucher";
import CreditVoucher from "./pages/Financial/CreditVoucher";
import DebitVoucher from "./pages/Financial/DebitVoucher";
import OpeningBalance from "./pages/Financial/OpeningBalance";
import ChartOfAccounts from "./pages/Financial/ChartOfAccounts";
import Sales from "./pages/Sales/Sales";
import SalesQuotation from "./pages/Sales/SalesQuotation";
import SalesQuotationPreview from "./pages/Sales/SalesQuotationPreview";
import SalesInvoicePreview from "./pages/Sales/SalesInvoicePreview";
import Purchase from "./pages/Purchases/Purchase"
import Invoices from "./pages/Services/Invoices";
import Meetings from "./pages/Meeting/Meetings";
import SuppliersPayableReport from "./pages/reports/SuppliersPayableReport";
import CustomerReceivableReport from "./pages/reports/CustomerReceivableReport";
import StockReport from "./pages/reports/StockReport";
import DailyClosingReport from "./pages/reports/DailyClosingReport";
import DayClosing from "./pages/reports/DayClosing";
import Settings from "./pages/Administration/Settings";
import Translations from "./pages/Administration/Translations";
import NewSuppliers from "./pages/business partners/NewSuppliers";
import NewCustomers from "./pages/business partners/NewCustomers";
import NewMeeting from "./pages/Meeting/NewMeeting";
import NewPurchases from "./pages/Purchases/NewPurchases";
import NewSale from "./pages/Sales/NewSale";
import NewSaleQuotation from "./pages/Sales/NewSaleQuotaton";
import PurchaseInvoice from "./pages/Purchases/PurchaseInvoice";
import NewGoodsIssue from "./pages/inventory/NewGoodsIssue";
import NewInvoices from "./pages/Services/NewInvoices";
import ServiceInvoicePreview from "./pages/Services/ServiceInvoicePreview";
import NewPayroll from "./pages/human resource/NewPayroll";
import PayrollEmployee from "./pages/human resource/PayrollEmployee";
import EditMeeting from "./pages/Meeting/EditMeeting";





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
          <Route path="inventory/goodsreceipts" element={<GoodsReceipt />} />
          <Route path="inventory/goodsreceipts/newgoodsreceipts" element={<NewGoodsReceipt />} />
          <Route path="inventory/goodsreceipts/edit/:id" element={<NewGoodsReceipt />} />
          <Route path="inventory/goodsreceipts/view/:id" element={<NewGoodsReceipt />} />
          <Route path="inventory/goodsissue" element={<GoodsIssue />} />
          <Route path="inventory/goodsissue/newgoodsissue" element={<NewGoodsIssue />} />
          <Route path="inventory/goodsissue/edit/:id" element={<NewGoodsIssue />} />
          <Route path="inventory/goodsissue/view/:id" element={<NewGoodsIssue />} />




          {/* human resource */}

          <Route path="hr/departments" element={<Departments />} />
          <Route path="hr/designations" element={<Designations />} />
          <Route path="hr/newemployee" element={<NewEmployee />} />
          <Route path="hr/editemployee/:id" element={<NewEmployee />} />
          <Route path="hr/employees" element={<Employees />} />
          <Route path="hr/attendance" element={<Attendance />} />
          <Route path="hr/payroll" element={<Payroll />} />
          <Route path="hr/newpayroll" element={<NewPayroll />} />
          <Route path="/app/payroll/employee" element={<PayrollEmployee />} />
          <Route path="hr/editpayroll/:id" element={<NewPayroll />} />


          {/* administration */}
          <Route path="administration/usermanagement" element={<UserManagement />} />
          <Route path="administration/roles" element={<Roles />} />
          <Route path="administration/currencies" element={<Currencies />} />
          <Route path="administration/language" element={<Languages />} />
          <Route path="administration/settings" element={<Settings />} />
          <Route path="administration/translations" element={<Translations />} />



          {/* cash/bank */}
          <Route path="cashbank/expenses" element={<Expenses />} />
          <Route path="cashbank/banktransaction" element={<BankTransactions />} />
          <Route path="cashbank/customerreceive" element={<CustomerReceive />} />
          <Route path="cashbank/supplierpayment" element={<SupplierPayment />} />
          <Route path="cashbank/cashadjustment" element={<CashAdjustment />} />



          {/* Financial */}
          <Route path="financial/journalvoucher" element={<JournalVoucher />} />
          <Route path="financial/contravoucher" element={<ContraVoucher />} />
          <Route path="financial/creditvoucher" element={<CreditVoucher />} />
          <Route path="financial/debitvoucher" element={<DebitVoucher />} />
          <Route path="financial/openingbalance" element={<OpeningBalance />} />
          <Route path="financial/chartofaccounts" element={<ChartOfAccounts />} />

          

          {/* sales */}

          <Route path="sales/sales" element={<Sales />} />
          <Route path="sales/salesquotations" element={<SalesQuotation />} />
          <Route path="sales/newsale" element={<NewSale />} />
          <Route path="sales/edit/:id" element={<NewSale />} />
          <Route path="sales/view/:id" element={<NewSale />} />
          <Route path="sales/newsalequotation" element={<NewSaleQuotation />} /> 
          <Route path="sales/newsalequotation/:id" element={<NewSaleQuotation />} /> 
          <Route path="sales/preview/:id" element={<SalesQuotationPreview />} />
          <Route path="sales/invoice/preview/:id" element={<SalesInvoicePreview />} />





          {/* purchases */}

          <Route path="purchasing/purchases" element={<Purchase />} />
          <Route path="purchasing/newpurchase" element={<NewPurchases />} />
          <Route path="purchasing/edit/:id" element={<NewPurchases />} />
          <Route path="purchasing/preview/:id" element={<PurchaseInvoice />} />


          {/* services */}
          <Route path="services/invoices" element={<Invoices />} />
          <Route path="services/newinvoice" element={<NewInvoices />} />
          <Route path="services/edit/:id" element={<NewInvoices />} />
          <Route path="services/preview/:id" element={<ServiceInvoicePreview />} />


          {/* meetings */}

          <Route path="meeting/meetings" element={<Meetings />} />
          <Route path="meeting/meetings/new" element={<NewMeeting />} />
          <Route path="meeting/meetings/edit/:id" element={<NewMeeting />} />
          <Route path="meeting/meetings/edit/:id/agenda" element={<EditMeeting />} />
          <Route path="meeting/meetings/edit/:id/decisions" element={<EditMeeting />} />



          {/* business partners */}
          <Route path="businesspartners/customers" element={<Customers />} />
          <Route path="businesspartners/suppliers" element={<Suppliers />} />
          <Route path="businesspartners/newsupplier" element={<NewSuppliers />} />
          <Route path="businesspartners/newsupplier/:id" element={<NewSuppliers />} />
          <Route path="businesspartners/restorecustomer/:id" element={<NewSuppliers />} />
          <Route path="businesspartners/newcustomer" element={<NewCustomers />} />
          <Route path="businesspartners/newcustomer/:id" element={<NewCustomers />} />



          {/* reports */}

          <Route path="reports/supplierpayablereport" element={<SuppliersPayableReport />} />
          <Route path="reports/customerreceivablereport" element={<CustomerReceivableReport />} />
          <Route path="reports/stockreports" element={<StockReport />} />
          <Route path="reports/dailyclosingreports" element={<DailyClosingReport />} />
          <Route path="reports/dayclosing" element={<DayClosing />} />

          </Route>
        </Routes>
    </>
  );
}

export default App;
