import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    await fetchUser(token);
                } catch (error) {
                    console.error("Session expired", error);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const fetchUser = async (token) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://professorceo-coolshot-ai-backend.hf.space';
        const response = await fetch(`${apiUrl}/users/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const userData = await response.json();
            setUser(userData);
        } else {
            throw new Error('Failed to fetch user');
        }
    };

    const login = async (email, password) => {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://professorceo-coolshot-ai-backend.hf.space';
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${apiUrl}/token`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.access_token);
        await fetchUser(data.access_token);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
