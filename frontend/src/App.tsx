import { GoogleOAuthProvider } from '@react-oauth/google';
import { Dashboard } from './components/Dashboard';

// Placeholder or Environment Variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

function App() {
  console.log("Initializing Google OAuth with Client ID:", GOOGLE_CLIENT_ID);
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Dashboard />
    </GoogleOAuthProvider>
  );
}

export default App;
