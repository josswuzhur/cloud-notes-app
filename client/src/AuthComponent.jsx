import React, { useState, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged // Critical for listening to user login status
} from "firebase/auth";

// Import auth instance from main.jsx
import { auth } from './main';

const AuthComponent = ({ user, setUser }) => {
    // Local state for the forms
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isAuthChecking, setIsAuthChecking] = useState(true); // Tracks initial Firebase check

    // ******************************************************
    // *** Auth State Listener (Runs once on mount) ***
    // ******************************************************
    useEffect(() => {
        // onAuthStateChanged sets up a listener that runs every time the user's login state changes
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            // Update the user state in the main App component
            setUser(currentUser);
            setIsAuthChecking(false);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, [setUser]);


    // ******************************************************
    // *** Handlers ***
    // ******************************************************

    const handleAuth = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            if (isRegistering) {
                // Register a new user
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                // Sign in an existing user
                await signInWithEmailAndPassword(auth, email, password);
            }
            // If successful, onAuthStateChanged listener handles state update
        } catch (err) {
            // Display Firebase error message
            setError(err.message);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // If successful, onAuthStateChanged listener handles state update to null
        } catch (err) {
            setError(err.message);
        }
    };

    // ******************************************************
    // *** Render Logic ***
    // ******************************************************

    // Show a loading state while Firebase checks the initial session
    if (isAuthChecking) {
        return <div className="auth-status-loading">Loading Authentication...</div>;
    }

    // If the user is logged in, show their email and a logout button
    if (user) {
        return (
            <div className="auth-info">
                <span className="user-email">{user.email}</span>
                <button onClick={handleLogout} className="action-button logout">Logout</button>
            </div>
        );
    }

    // If the user is logged out, show the forms
    return (
        <div className="auth-container">
            <div className="auth-form-toggle">
                <button
                    onClick={() => setIsRegistering(false)}
                    className={`toggle-button ${!isRegistering ? 'active' : ''}`}
                >
                    Sign In
                </button>
                <button
                    onClick={() => setIsRegistering(true)}
                    className={`toggle-button ${isRegistering ? 'active' : ''}`}
                >
                    Register
                </button>
            </div>

            <form onSubmit={handleAuth} className="auth-form">
                {error && <p className="auth-error">{error}</p>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="auth-input"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="auth-input"
                />
                <button type="submit" className="submit-button auth-submit">
                    {isRegistering ? 'Register' : 'Sign In'}
                </button>
            </form>
        </div>
    );
};

export default AuthComponent;
