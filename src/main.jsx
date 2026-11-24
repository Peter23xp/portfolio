import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
// L'admin est chargé à la demande : le portfolio public n'embarque pas son code.
const AdminPage = lazy(() => import('./pages/admin/index.tsx'))
const LoginPage = lazy(() => import('./pages/login/index.tsx'))
import './index.css'
import 'iconify-icon'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Portfolio public */}
        <Route path="/" element={<App />} />
        {/* Admin protégé (Better Auth) */}
        <Route path="/admin" element={<Suspense fallback={null}><AdminPage /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={null}><LoginPage /></Suspense>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
