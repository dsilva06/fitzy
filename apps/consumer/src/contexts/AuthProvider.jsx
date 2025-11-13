import React, { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { fitzy } from '@/api/fitzyClient';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | unauthenticated
  const queryClient = useQueryClient();

  const setUserState = (nextUser) => {
    setUser(nextUser ?? null);
    queryClient.setQueryData(['currentUser'], nextUser ?? null);
  };

  useEffect(() => {
    let mounted = true;
    async function restore() {
      setStatus('loading');
      try {
        const me = await fitzy.auth.me();
        if (!mounted) return;
        if (me) {
          setUserState(me);
          setStatus('authenticated');
          return;
        }
      } catch (err) {
        // ignore
      }
      if (!mounted) return;
      setUserState(null);
      setStatus('unauthenticated');
    }
    restore();
    return () => { mounted = false; };
  }, []);

  const login = async ({ email, password, deviceName }) => {
    const u = await fitzy.auth.login({ email, password, deviceName });
    setUserState(u);
    setStatus('authenticated');
    return u;
  };

  const register = async (payload) => {
    const result = await fitzy.auth.register(payload);
    if (!result || result.pending || !result.user) {
      const message =
        result?.message ??
        'Tu cuenta necesita aprobación antes de poder ingresar.';
      const error = new Error(message);
      error.response = { data: { message } };
      throw error;
    }

    setUserState(result.user);
    setStatus('authenticated');
    return result.user;
  };

  const logout = async () => {
    try {
      await fitzy.auth.logout();
    } catch (err) {
      // ignore
    }
    setUserState(null);
    queryClient.removeQueries({ queryKey: ['currentUser'], exact: false });
    setStatus('unauthenticated');
  };

  const value = {
    user,
    status,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
