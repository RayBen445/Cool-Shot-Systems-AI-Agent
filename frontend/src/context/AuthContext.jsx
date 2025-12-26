import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    // Auto-login with anonymous user on mount
    useEffect(() => {
        // Create a simple anonymous user
        const anonymousUser = {
            id: 'anonymous',
            full_name: 'Guest User',
            email: 'guest@coolshot.ai',
            is_admin: false
        };
        setUser(anonymousUser);
        setLoading(false);
    }, []);

    const login = (email, password) => {
        // Dummy login - always succeeds
        const user = {
            id: 'user-' + Date.now(),
            full_name: email.split('@')[0],
            email: email,
            is_admin: false
        };
        setUser(user);
        return Promise.resolve({ user });
    };

    const register = async (name, email, password) => {
        // Dummy register - always succeeds
        const user = {
            id: 'user-' + Date.now(),
            full_name: name,
            email: email,
            is_admin: false
        };
        setUser(user);
        return Promise.resolve({ user });
    };

    const logout = () => {
        // Reset to anonymous user
        const anonymousUser = {
            id: 'anonymous',
            full_name: 'Guest User',
            email: 'guest@coolshot.ai',
            is_admin: false
        };
        setUser(anonymousUser);
        return Promise.resolve();
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
