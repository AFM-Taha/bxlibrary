import "@/styles/globals.css";
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';

function ThemedToaster() {
  const { isDark } = useTheme();
  
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? '#374151' : '#ffffff',
          color: isDark ? '#ffffff' : '#111827',
          border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: isDark ? '#ffffff' : '#ffffff',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: isDark ? '#ffffff' : '#ffffff',
          },
        },
      }}
    />
  );
}

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Component {...pageProps} />
        <ThemedToaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
