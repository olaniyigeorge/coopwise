import type{User} from "firebase/auth"
import API from "../api";

export type SessionResult = {
    is_new_user: boolean
    role: string
}

export type DevSessionResult = {
    is_new_user: boolean
    user: any
}

export const createSession = async (
  firebaseUser: User,
  fullNameOverride?: string
): Promise<SessionResult> => {
    const idToken = await firebaseUser.getIdToken()
    console.log("\ncreateSession idToken:", idToken, "\n")
    const response = await API.post('/api/v1/auth/firebase', {
        firebase_id_token: idToken,
        full_name: fullNameOverride || firebaseUser.displayName || ""
    })
    const {access_token, is_new_user, user} = response.data
    document.cookie = `jwt=${access_token}; path=/; SameSite=Strict`
    return {is_new_user, role: user.role} 
};

export const signInWithPassword = async (
  identifier: string,
  password: string
): Promise<SessionResult> => {
  const { data } = await API.post<SessionResult>("/signin", {
    identifier,
    password,
  })
  // persistSession(data) // <-- same token-storage step createSession uses; confirm name/location
  return data
}

export const getDevSession = async (
  email: string,
  fullName?: string
): Promise<DevSessionResult> => {
    const response = await API.post('/api/auth/dev-sign-in', {
        email: email,
        full_name: fullName || ""
    })
    console.log(`\nSign in res ${response} \n`)
    return response.data
};


export const refreshSession = async (): Promise<void> => {
    try {
        const res = await API.post('/api/v1/auth/refresh')
        const { access_token } = res.data
        document.cookie = `jwt=${access_token}; path=/; SameSite=Strict`
    } catch (e: any) {
        console.error("Refresh failed:", e?.response?.data)
        throw e
    }
}