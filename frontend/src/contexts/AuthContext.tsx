import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponseData } from '../types';
import { loginApi, getMeApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('peoplepay360_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('peoplepay360_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate existing token on initial mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('peoplepay360_token');
      if (storedToken) {
        try {
          const profile = await getMeApi();
          setUser(profile);
          localStorage.setItem('peoplepay360_user', JSON.stringify(profile));
        } catch (err) {
          // Token invalid or expired
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const data: AuthResponseData = await loginApi(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('peoplepay360_token', data.token);
    localStorage.setItem('peoplepay360_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('peoplepay360_token');
    localStorage.removeItem('peoplepay360_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
