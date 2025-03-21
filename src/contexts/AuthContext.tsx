import React, { createContext } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
}

export const AuthContext = createContext<AuthContextType>({
  user: null
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Using a proper UUID format instead of '1'
  const user = { id: '00000000-0000-0000-0000-000000000001', email: 'nifyacorp@gmail.com', name: 'Test User' };

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};