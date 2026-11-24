import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
// L'admin est chargé à la demande : le portfolio public n'embarque pas son code.
const AdminPage = lazy(() => import('./pages/admin/index.tsx'))
const LoginPage = lazy(() => import('./pages/login/index.tsx'))
const ShowcasePage = lazy(() => import('./pages/admin/showcase.tsx'))
const TimelinePage = lazy(() => import('./pages/admin/timeline.tsx'))
const ContentPage = lazy(() => import('./pages/admin/content.tsx'))
const AnalyticsPage = lazy(() => import('./pages/admin/analytics.tsx'))
// Études de cas : chargées à la demande
const CaseStudy = lazy(() => import('./portfolio/CaseStudy.jsx'))
// Page CV (lecteur PDF chargé seulement ici)
const CvPage = lazy(() => import('./portfolio/CvPage.jsx'))
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Portfolio public */}
        <Route path="/" element={<App />} />
        <Route path="/projets/:slug" element={<Suspense fallback={null}><CaseStudy /></Suspense>} />
        <Route path="/cv" element={<Suspense fallback={null}><CvPage /></Suspense>} />
        {/* Admin protégé (Better Auth) */}
        <Route path="/admin" element={<Suspense fallback={null}><AdminPage /></Suspense>} />
        <Route path="/admin/vitrine" element={<Suspense fallback={null}><ShowcasePage /></Suspense>} />
        <Route path="/admin/parcours" element={<Suspense fallback={null}><TimelinePage /></Suspense>} />
        <Route path="/admin/contenu" element={<Suspense fallback={null}><ContentPage /></Suspense>} />
        <Route path="/admin/analytics" element={<Suspense fallback={null}><AnalyticsPage /></Suspense>} />
        <Route path="/login" element={<Suspense fallback={null}><LoginPage /></Suspense>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
