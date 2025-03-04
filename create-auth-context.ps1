$content = @'
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
  const user = { id: '1', email: 'nifyacorp@gmail.com', name: 'Test User' };

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
};
'@

if (Test-Path src\contexts\AuthContext.tsx) {
    Remove-Item src\contexts\AuthContext.tsx -Force
}

Set-Content -Path src\contexts\AuthContext.tsx -Value $content -Encoding UTF8 -NoNewline

Write-Host "AuthContext.tsx file created successfully!" 