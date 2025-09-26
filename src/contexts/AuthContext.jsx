import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../lib/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { user: currentUser } = await auth.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        await fetchProfile(currentUser.id)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    try {
      console.log('Fetching profile for userId:', userId)
      const { data, error } = await db.getProfile(userId)
      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
        return
      }
      setProfile(data)
      // Debug: log the role every time profile is set
      console.log('Profile set in context:', data)
    } catch (error) {
      console.error('Exception in fetchProfile:', error)
      setProfile(null)
    }
  }

  const signUp = async (email, password, userData) => {
    try {
      const { data, error } = await auth.signUp(email, password, userData)
      if (error) throw error
      
      toast.success('Account created successfully! Please check your email to verify your account.')
      return { data, error: null }
    } catch (error) {
      if (error.message.includes('Database error saving new user')) {
        toast.error('A server error occurred during sign-up. Please try again or contact support.');
      } else {
        toast.error(error.message);
      }
      console.error('Sign up error:', error);
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await auth.signIn(email, password)
      if (error) throw error
      // Fetch latest session/user and profile after sign-in
      const { user: currentUser } = await auth.getCurrentUser()
      setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.id)
      }
      toast.success('Welcome back!')
      // Force a hard reload to clear all caches and ensure the latest profile is fetched
      window.location.reload(true)
      return { data, error: null }
    } catch (error) {
      toast.error(error.message)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      console.log('Calling auth.signOut...');
      // Timeout workaround: proceed after 3 seconds if Supabase hangs
      const signOutPromise = auth.signOut();
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ error: 'timeout' }), 3000));
      const { error } = await Promise.race([signOutPromise, timeoutPromise]);
      console.log('auth.signOut returned. Error:', error);
      if (error && error !== 'timeout') throw error;
      // Remove all Supabase-related tokens from localStorage and sessionStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase') || key.startsWith('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
      setUser(null);
      setProfile(null);
      toast.success('Signed out successfully');
      window.location.reload(); // Force reload to clear all state
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(error.message);
    }
  }

  const updateProfile = async (updates) => {
    try {
      const { data, error } = await db.updateProfile(user.id, updates)
      if (error) throw error
      
      setProfile(data[0])
      toast.success('Profile updated successfully')
      return { data, error: null }
    } catch (error) {
      toast.error(error.message)
      return { data: null, error }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isAdmin: profile?.role === 'admin',
    isVendor: profile?.role === 'vendor',
    isUser: profile?.role === 'user'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
