import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./admin/AdminLayout";
import AdminLogin from "./admin/AdminLogin";
import Dashboard from "./admin/Dashboard";
import OrdersPage from "./admin/OrdersPage";
import MenuManager from "./admin/MenuManager";
import Customers from "./admin/Customers";
import Profile from "./admin/Profile";
import PromoCodes from "./admin/PromoCodes";
import DeliverySettings from "./admin/DeliverySettings";
import Help from "./admin/Help";

// Yeh app sirf admin panel hai (customer website alag project hai: ../frontend).
export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="menu" element={<MenuManager />} />
        <Route path="deals" element={<MenuManager dealsOnly />} />
        <Route path="customers" element={<Customers />} />
        <Route path="profile" element={<Profile />} />
        <Route path="promos" element={<PromoCodes />} />
        <Route path="delivery" element={<DeliverySettings />} />
        <Route path="help" element={<Help />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
