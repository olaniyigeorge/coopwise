const config = {
    firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    publicApiUrl: process.env.NEXT_PUBLIC_API_URL || "",
    wsUrl: process.env.NEXT_PUBLIC_WS_URL || "",
    firebaseStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    firebaseMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    env: process.env.NODE_ENV || "development",
    dev: process.env.DEV
}

export default config;

