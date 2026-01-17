import React, { createContext, useState, useEffect } from 'react';
import { setAuthToken, getAuthToken } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      // TODO: Verify token with backend
      setAuthToken(token);
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    setAuthToken(token);
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
