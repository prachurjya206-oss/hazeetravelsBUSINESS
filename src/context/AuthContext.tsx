import React, { createContext, useContext, useState } from 'react';
import { sha256 } from '../lib/hash';

export interface OwnerUser {
  username: string;
  name: string;
  role: 'owner';
}

interface AuthContextType {
  user: OwnerUser | null;
  isAuthenticated: boolean;
  activeOwnerName: string;
  setActiveOwnerName: (name: string) => void;
  login: (username: string, pass: string) => Promise<{ error: string | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronous session initialization from localStorage - prevents any re-login prompts on refresh
  const [user, setUser] = useState<OwnerUser | null>(() => {
    try {
      const savedSession = localStorage.getItem('hazee_owner_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed?.username) {
          return {
            username: parsed.username,
            name: parsed.username,
            role: 'owner',
          };
        }
      }
    } catch {
      localStorage.removeItem('hazee_owner_session');
    }
    return null;
  });

  const [activeOwnerName, setActiveOwnerName] = useState<string>(() => {
    try {
      const savedSession = localStorage.getItem('hazee_owner_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed?.username) return parsed.username;
      }
    } catch {}
    return 'Walid';
  });

  const login = async (username: string, pass: string): Promise<{ error: string | null }> => {
    const trimmedUser = (username || '').trim();
    if (!trimmedUser || !pass) {
      return { error: 'অনুগ্রহ করে ইউজারনেম এবং পাসওয়ার্ড দিন (Please provide username and password)' };
    }

    try {
      // Read credentials from .env
      const owner1User = (import.meta.env.VITE_OWNER_1_USERNAME || '').trim();
      const rawOwner1Pass = (import.meta.env.VITE_OWNER_1_PASSWORD || '').trim();
      const owner2User = (import.meta.env.VITE_OWNER_2_USERNAME || '').trim();
      const rawOwner2Pass = (import.meta.env.VITE_OWNER_2_PASSWORD || '').trim();

      // Automatically compute cryptographic SHA-256 hashes of input and .env passwords
      const [inputHash, owner1Hash, owner2Hash] = await Promise.all([
        sha256(pass),
        rawOwner1Pass ? sha256(rawOwner1Pass) : Promise.resolve(''),
        rawOwner2Pass ? sha256(rawOwner2Pass) : Promise.resolve(''),
      ]);

      const isOwner1 =
        owner1User &&
        trimmedUser.toLowerCase() === owner1User.toLowerCase() &&
        inputHash === owner1Hash;

      const isOwner2 =
        owner2User &&
        trimmedUser.toLowerCase() === owner2User.toLowerCase() &&
        inputHash === owner2Hash;

      if (isOwner1 || isOwner2) {
        const canonicalName = isOwner1 ? owner1User : owner2User;
        const authUser: OwnerUser = {
          username: canonicalName,
          name: canonicalName,
          role: 'owner',
        };

        setUser(authUser);
        setActiveOwnerName(canonicalName);

        // Store permanent session so user NEVER has to re-login every time they visit
        localStorage.setItem(
          'hazee_owner_session',
          JSON.stringify({ username: canonicalName, loggedInAt: Date.now() })
        );
        return { error: null };
      }

      return { error: 'পাসওয়ার্ড বা ইউজারনেম সঠিক নয়। আবার চেষ্টা করুন।' };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Authentication failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hazee_owner_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        activeOwnerName,
        setActiveOwnerName,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
