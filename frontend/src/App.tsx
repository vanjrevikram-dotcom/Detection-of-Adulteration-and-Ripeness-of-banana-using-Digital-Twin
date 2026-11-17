import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ScrollToTop from './components/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastHost } from './components/Toast'
import Landing from './pages/Landing'
import About from './pages/About'
import Services from './pages/Services'
import UseCases from './pages/UseCases'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Ripeness from './pages/Ripeness'
import Adulteration from './pages/Adulteration'
import Combined from './pages/Combined'
import Twins from './pages/Twins'
import TwinDetail from './pages/TwinDetail'
import Profile from './pages/Profile'
import MyPredictions from './pages/MyPredictions'
import Performance from './pages/Performance'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/use-cases" element={<UseCases />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/predict/ripeness" element={<ProtectedRoute><Ripeness /></ProtectedRoute>} />
          <Route path="/predict/adulteration" element={<ProtectedRoute><Adulteration /></ProtectedRoute>} />
          <Route path="/predict/combined" element={<ProtectedRoute><Combined /></ProtectedRoute>} />
          <Route path="/twins" element={<ProtectedRoute><Twins /></ProtectedRoute>} />
          <Route path="/twins/:id" element={<ProtectedRoute><TwinDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/predictions" element={<ProtectedRoute><MyPredictions /></ProtectedRoute>} />
          <Route path="/performance" element={<Performance />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <ToastHost />
    </BrowserRouter>
  )
}
