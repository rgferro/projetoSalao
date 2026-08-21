import React, { createContext, useContext, useState, useEffect } from 'react';
import { canAccessModule, canPlanAccessModule, getDefaultTabForRole } from '../lib/permissions';
import { getCsrfToken } from '../services/api';

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

  const [userTenants, setUserTenants] = useState(() => {
    const saved = localStorage.getItem('bella_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.tenants || [];
      } catch {
        return [];
      }
    }
    return [];
  });

  // Validar sessão no backend ao iniciar para evitar estados residuais ou inconsistências
  useEffect(() => {
    if (!token) return;
    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          logout();
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.success && data.user) {
          const tenant = data.tenant;
          setUser(prev => {
            const updated = {
              ...prev,
              ...data.user,
              salonName: tenant?.name || data.user.salonName || prev?.salonName,
              segment: tenant?.segment || data.user.segment || prev?.segment || 'salao',
              plan: tenant?.plan || data.user.plan || prev?.plan,
              tenants: data.user.tenants || prev?.tenants || []
            };
            localStorage.setItem('bella_user', JSON.stringify(updated));
            return updated;
          });
          if (data.user.tenants) {
            setUserTenants(data.user.tenants);
          }
        }
      })
      .catch(() => {});
  }, [token]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    setIsAuthenticated(true);
    if (userData?.tenants) {
      setUserTenants(userData.tenants);
    }
    localStorage.setItem('bella_user', JSON.stringify(userData));
    if (userToken) localStorage.setItem('bella_token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUserTenants([]);
    setIsAuthenticated(false);
    localStorage.removeItem('bella_user');
    localStorage.removeItem('bella_token');
  };

  const switchTenant = async (tenantId) => {
    try {
      const res = await fetch('/api/auth/switch-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-CSRF-Token': await getCsrfToken(),
        },
        body: JSON.stringify({ tenantId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao alternar projeto.');

      // Manter a lista de tenants atualizada
      const updatedUser = {
        ...data.user,
        tenants: user?.tenants || userTenants
      };

      login(updatedUser, data.token);
      return { success: true, user: updatedUser };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const createProject = async (projectData) => {
    try {
      const res = await fetch('/api/auth/create-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'X-CSRF-Token': await getCsrfToken(),
        },
        body: JSON.stringify(projectData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao criar novo salão/projeto.');

      login(data.user, data.token);
      return { success: true, user: data.user };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const refreshTenants = async () => {
    if (!token) return [];
    try {
      const res = await fetch('/api/auth/my-tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data && data.success && data.tenants) {
        setUserTenants(data.tenants);
        setUser(prev => {
          if (!prev) return null;
          const updated = { ...prev, tenants: data.tenants };
          localStorage.setItem('bella_user', JSON.stringify(updated));
          return updated;
        });
        return data.tenants;
      }
    } catch (e) {}
    return [];
  };

  const exitImpersonation = () => {
    const masterUser = localStorage.getItem('bella_master_user');
    const masterToken = localStorage.getItem('bella_master_token');
    if (masterUser && masterToken) {
      try {
        const parsed = JSON.parse(masterUser);
        localStorage.removeItem('bella_master_user');
        localStorage.removeItem('bella_master_token');
        login(parsed, masterToken);
        window.location.href = '/dashboard';
        return;
      } catch (e) {}
    }
    logout();
    window.location.href = '/login';
  };

  const isMaster = Boolean(user?.isMaster || user?.email?.toLowerCase() === 'rafael.gielow@gmail.com');
  const isExempt = Boolean(user?.isExempt || user?.subscription_status === 'exempt');

  const checkRolePermission = (moduleId) => {
    if (!user) return false;
    if (isMaster) return true;
    return canAccessModule(user.accessLevel, moduleId);
  };

  const isPlanAllowed = (moduleId) => {
    if (!user) return false;
    if (isMaster) return true;
    return canPlanAccessModule(user.plan, moduleId, isMaster, isExempt);
  };

  const checkPermission = (moduleId) => {
    if (!user) return false;
    if (isMaster) return true;
    // Permissão completa exige que o papel (RBAC) permita
    return checkRolePermission(moduleId);
  };

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
        userTenants,
        isAuthenticated,
        login,
        logout,
        switchTenant,
        createProject,
        refreshTenants,
        exitImpersonation,
        checkPermission,
        checkRolePermission,
        isPlanAllowed,
        isMaster,
        isExempt,
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
