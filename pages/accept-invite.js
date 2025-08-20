import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import { LogIn } from 'lucide-react';

export default function AcceptInvite() {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');
  const [isValidToken, setIsValidToken] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Get token from URL query
    if (router.isReady) {
      const { token: urlToken } = router.query;
      if (urlToken) {
        setToken(urlToken);
        // Try to decode token to get email (for display purposes)
        try {
          const payload = JSON.parse(atob(urlToken.split('.')[1]));
          setUserEmail(payload.email || '');
          setIsValidToken(true);
        } catch (error) {
          setIsValidToken(false);
        }
      } else {
        setIsValidToken(false);
      }
    }
  }, [router.isReady, router.query]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 4) {
      errors.push('At least 4 characters long');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      toast.error(`Password must have: ${passwordErrors.join(', ')}`);
      return;
    }

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          name: formData.name.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account activated successfully!');
        router.push('/library');
      } else {
        toast.error(data.error || 'Failed to activate account');
        if (data.error?.includes('expired') || data.error?.includes('invalid')) {
          setIsValidToken(false);
        }
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <>
        <Head>
          <title>Invalid Invitation - BX Library</title>
          <meta name="description" content="Invalid invitation link" />
        </Head>

        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Invalid Invitation
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                This invitation link is invalid or has expired.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-center text-sm text-gray-600">
                Please contact your administrator for a new invitation.
              </p>
              
              <Link href="/login" className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Complete Registration - BX Library</title>
        <meta name="description" content="Complete your BX Library registration" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Welcome to BX Library
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Complete your registration to access the library
            </p>
            {userEmail && (
              <p className="mt-1 text-center text-sm font-medium text-gray-900">
                {userEmail}
              </p>
            )}
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    minLength={2}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    minLength={4}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  <p>Password must be at least 4 characters long</p>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    minLength={4}
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim() || !formData.password || !formData.confirmPassword}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Activating account...
                  </div>
                ) : (
                  'Activate account'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500 flex items-center justify-center" title="Already have an account? Sign in">
                <LogIn size={16} className="mr-1" />
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}