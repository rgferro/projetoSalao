import React, { createContext, useContext, useState, useEffect } from 'react';
import { canAccessModule, getDefaultTabForRole } from '../lib/permissions';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('bella_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bella_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Limpar dados legados inválidos se existirem em cache local
        if (parsed.id === 'default_admin') {
          localStorage.removeItem('bella_user');
          localStorage.removeItem('bella_token');
          return null;
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('bella_user');
    if (!saved) return false;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.id === 'default_admin') return false;
      return true;
    } catch {
      return false;
    }
  });

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setIsAuthenticated(true);
    localStorage.setItem('bella_user', JSON.stringify(userData));
    if (userToken) localStorage.setItem('bella_token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('bella_user');
    localStorage.removeItem('bella_token');
  };

  const switchUserWithPin = async (pinCode) => {
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'PIN inválido');

      login(data.user, data.token);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const checkPermission = (moduleId) => {
    if (!user) return false;
    if (user.isMaster) return true;
    return canAccessModule(user.accessLevel, moduleId);
  };

  const isMaster = Boolean(user?.isMaster || user?.email?.toLowerCase() === 'rafael.gielow@gmail.com');
  const isAdmin = isMaster || user?.accessLevel === 'ADMIN';
  const isGerente = isAdmin || user?.accessLevel === 'GERENTE';
  const canViewFinancial = isMaster || ['ADMIN', 'GERENTE'].includes(user?.accessLevel);
  const canViewCashRegister = isMaster || ['ADMIN', 'GERENTE', 'RECEPCAO'].includes(user?.accessLevel);
  const canManageTeam = isMaster || ['ADMIN', 'GERENTE'].includes(user?.accessLevel);
  const canManageSettings = isMaster || user?.accessLevel === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        login,
        logout,
        switchUserWithPin,
        checkPermission,
        isMaster,
        isAdmin,
        isGerente,
        canViewFinancial,
        canViewCashRegister,
        canManageTeam,
        canManageSettings,
        defaultTab: getDefaultTabForRole(user?.accessLevel),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
