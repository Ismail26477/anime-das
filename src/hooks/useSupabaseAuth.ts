import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"

export interface AuthUser {
  id: string
  email: string
  name: string
  created_at: string
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  })

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        await fetchUserProfile(session.user)
      } else {
        setAuthState({ user: null, loading: false })
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      if (session?.user) {
        await fetchUserProfile(session.user)
      } else {
        setAuthState({ user: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (user: User) => {
    try {
      const { data: profile, error } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (error) {
        // If user record doesn't exist, create it
        if (error.code === "PGRST116") {
          console.log("User record does not exist, creating one...")
          const { data: newProfile, error: createError } = await supabase
            .from("users")
            .insert([
              {
                id: user.id,
                email: user.email,
                name: user.email?.split("@")[0] || "User",
              },
            ])
            .select()
            .single()

          if (createError) {
            console.error("Error creating user record:", createError)
            setAuthState({ user: null, loading: false })
            return
          }

          const authUser: AuthUser = {
            id: newProfile.id,
            email: newProfile.email,
            name: newProfile.name,
            created_at: newProfile.created_at,
          }

          setAuthState({ user: authUser, loading: false })
        } else {
          console.error("Error fetching user profile:", error)
          setAuthState({ user: null, loading: false })
        }
        return
      }

      const authUser: AuthUser = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        created_at: profile.created_at,
      }

      setAuthState({ user: authUser, loading: false })
    } catch (error) {
      console.error("Error in fetchUserProfile:", error)
      setAuthState({ user: null, loading: false })
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split("@")[0], // Use email prefix as default name
          },
        },
      })

      if (error) {
        return { data: null, error }
      }

      // If user is immediately confirmed (depends on your Supabase settings)
      if (data.user && !data.session) {
        return {
          data: data.user,
          error: null,
          message: "Please check your email for confirmation link",
        }
      }

      return { data: data.user, error: null }
    } catch (error) {
      console.error("Sign up error:", error)
      return { data: null, error: { message: "Sign up failed" } }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { data: null, error }
      }

      return { data: data.user, error: null }
    } catch (error) {
      console.error("Sign in error:", error)
      return { data: null, error: { message: "Sign in failed" } }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { error }
      }

      setAuthState({ user: null, loading: false })
      return { error: null }
    } catch (error) {
      console.error("Sign out error:", error)
      return { error: { message: "Sign out failed" } }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      return { error }
    } catch (error) {
      console.error("Reset password error:", error)
      return { error: { message: "Password reset failed" } }
    }
  }

  return {
    user: authState.user,
    loading: authState.loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }
}
