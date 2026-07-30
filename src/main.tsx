import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SecurityProvider } from './context/SecurityContext'
import ErrorBoundary from './components/ErrorBoundary'
import { injectSecurityMeta, enforceHttps } from './middleware/security-headers'

// Run security bootstrapping before render
enforceHttps();
injectSecurityMeta();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <SecurityProvider>
        <App />
      </SecurityProvider>
    </ErrorBoundary>
  </StrictMode>,
)
