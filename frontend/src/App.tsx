import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Dashboard } from './components/Dashboard';
import { Insights } from './pages/Insights';
import { PrivacyProvider } from './context/PrivacyContext';

// Placeholder or Environment Variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'insights'>('dashboard');

  console.log("Initializing Google OAuth with Client ID:", GOOGLE_CLIENT_ID);
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <PrivacyProvider>
        {currentView === 'dashboard' ? (
          <Dashboard onNavigateToInsights={() => setCurrentView('insights')} />
        ) : (
          <Insights onNavigateToDashboard={() => setCurrentView('dashboard')} />
        )}
      </PrivacyProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
