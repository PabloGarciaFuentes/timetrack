import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { isDemoMode, DEMO_USER, DEMO_PROFILE, DEMO_CREDENTIALS } from '@/lib/demo-data'
import type { Profile } from '@/types'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    session: Session | null
    loading: boolean
    isDemo: boolean
    signUp: (email: string, password: string, fullName: string) => Promise<void>
    signIn: (email: string, password: string) => Promise<void>
    signOut: () => Promise<void>
    resetPassword: (email: string) => Promise<void>
    updatePassword: (newPassword: string) => Promise<void>
    updateProfile: (data: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const isDemo = isDemoMode()

    // Fetch user profile from Supabase
    const fetchProfile = async (userId: string) => {
        if (isDemo) {
            setProfile(DEMO_PROFILE)
            return
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error
            setProfile(data)
        } catch (error) {
            console.error('Error fetching profile:', error)
            setProfile(null)
        }
    }

    // Initialize auth state
    useEffect(() => {
        if (isDemo) {
            // Demo mode - don't initialize Supabase auth
            setLoading(false)
            return
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            }
            setLoading(false)
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)

            if (session?.user) {
                await fetchProfile(session.user.id)
            } else {
                setProfile(null)
            }

            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [isDemo])

    // Register new user
    const signUp = async (email: string, password: string, fullName: string) => {
        if (isDemo) {
            // Demo mode - simulate signup
            const demoUser = {
                id: DEMO_USER.id,
                email,
                user_metadata: { full_name: fullName },
                app_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString(),
            } as unknown as User
            setUser(demoUser)
            setProfile({ ...DEMO_PROFILE, full_name: fullName })
            return
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
            },
        })

        if (error) throw error
    }

    // Sign in with email and password
    const signIn = async (email: string, password: string) => {
        if (isDemo) {
            // Demo mode - accept demo credentials
            if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
                const demoUser = {
                    id: DEMO_USER.id,
                    email: DEMO_USER.email,
                    user_metadata: { full_name: DEMO_PROFILE.full_name },
                    app_metadata: {},
                    aud: 'authenticated',
                    created_at: new Date().toISOString(),
                } as unknown as User
                setUser(demoUser)
                setProfile(DEMO_PROFILE)
                return
            }
            throw new Error('Invalid login credentials')
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) throw error
    }

    // Sign out
    const signOut = async () => {
        if (isDemo) {
            setUser(null)
            setProfile(null)
            setSession(null)
            return
        }

        const { error } = await supabase.auth.signOut()
        if (error) throw error
        setUser(null)
        setProfile(null)
        setSession(null)
    }

    // Reset password
    const resetPassword = async (email: string) => {
        if (isDemo) {
            // Demo mode - just pretend we sent the email
            return
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })

        if (error) throw error
    }

    // Update password
    const updatePassword = async (newPassword: string) => {
        if (isDemo) {
            // Demo mode - just pretend we updated
            return
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        })

        if (error) throw error
    }

    // Update profile
    const updateProfile = async (data: Partial<Profile>) => {
        if (!user) throw new Error('No user logged in')

        if (isDemo) {
            // Demo mode - update local state
            setProfile(prev => prev ? { ...prev, ...data } : null)
            return
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                ...data,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

        if (error) throw error

        // Refetch profile
        await fetchProfile(user.id)
    }

    const value = {
        user,
        profile,
        session,
        loading,
        isDemo,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateProfile,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuthContext must be used within an AuthProvider')
    }
    return context
}
