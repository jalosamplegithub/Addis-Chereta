import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/public/Home.jsx'
import Login from './pages/public/Login.jsx'
import Register from './pages/public/Register.jsx'
import ProcurementDashboard from './pages/procurement/Dashboard.jsx'
import Auctions from './pages/public/Auctions.jsx'
import AuctionDetails from './pages/public/AuctionDetails.jsx'
import ProcurementProfile from './pages/procurement/Profile.jsx'
import ProcurementDocuments from './pages/procurement/Documents.jsx'
import ProcurementTasks from './pages/procurement/Tasks.jsx'
import BidderProfile from './pages/public/BidderProfile.jsx'
import BidderBids from './pages/public/BidderBids.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'

function ProcurementRoute({ children }) {
  let user = null
  try { user = JSON.parse(window.localStorage.getItem('addis-chereta-user') || 'null') } catch { user = null }
  const token = window.localStorage.getItem('addis-chereta-token')
  return token && user?.role === 'procurement'
    ? children || <ProcurementDashboard />
    : <Navigate to="/login" replace />
}

function BidderRoute({ children }) {
  let user = null
  try { user = JSON.parse(window.localStorage.getItem('addis-chereta-user') || 'null') } catch { user = null }
  const token = window.localStorage.getItem('addis-chereta-token')
  return token && user?.role === 'bidder' ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  let user = null
  try { user = JSON.parse(window.localStorage.getItem('addis-chereta-user') || 'null') } catch { user = null }
  const token = window.localStorage.getItem('addis-chereta-token')
  return token && user?.role === 'admin' ? children || <AdminDashboard /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auctions" element={<Auctions />} />
        <Route path="/auctions/:id" element={<AuctionDetails />} />
        <Route path="/profile" element={<BidderRoute><BidderProfile /></BidderRoute>} />
        <Route path="/my-bids" element={<BidderRoute><BidderBids /></BidderRoute>} />
        <Route path="/admin/dashboard" element={<AdminRoute />} />
        <Route path="/procurement/dashboard" element={<ProcurementRoute />} />
        <Route path="/procurement/auctions" element={<ProcurementRoute />} />
        <Route path="/procurement/public-auctions" element={<ProcurementRoute />} />
        <Route path="/procurement/activity" element={<ProcurementRoute />} />
        <Route path="/procurement/profile" element={<ProcurementRoute><ProcurementProfile /></ProcurementRoute>} />
        <Route path="/procurement/documents" element={<ProcurementRoute><ProcurementDocuments /></ProcurementRoute>} />
        <Route path="/procurement/tasks" element={<ProcurementRoute><ProcurementTasks /></ProcurementRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
