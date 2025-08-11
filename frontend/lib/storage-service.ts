// Storage service for client-side storage operations
const StorageService = {
  // Username storage keys
  USERNAME_KEY: 'coopwise_username',
  REMEMBER_USERNAME_KEY: 'coopwise_remember_username',

  // Check if localStorage is available
  isAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  // Set username with remember option
  setUsername(username: string, remember: boolean = false): void {
    if (!this.isAvailable()) return;

    if (remember) {
      localStorage.setItem(this.USERNAME_KEY, username);
      localStorage.setItem(this.REMEMBER_USERNAME_KEY, 'true');
    } else {
      // Store in sessionStorage if not remembering
      try {
        sessionStorage.setItem(this.USERNAME_KEY, username);
      } catch {
        // Fallback to localStorage if sessionStorage fails
        localStorage.setItem(this.USERNAME_KEY, username);
      }
      localStorage.removeItem(this.REMEMBER_USERNAME_KEY);
    }
  },

  // Get stored username
  getUsername(): string | null {
    if (!this.isAvailable()) return null;

    // Check localStorage first (remembered username)
    const rememberedUsername = localStorage.getItem(this.USERNAME_KEY);
    if (rememberedUsername && this.shouldRememberUsername()) {
      return rememberedUsername;
    }

    // Check sessionStorage for non-remembered username
    try {
      const sessionUsername = sessionStorage.getItem(this.USERNAME_KEY);
      if (sessionUsername) {
        return sessionUsername;
      }
    } catch {
      // sessionStorage might not be available
    }

    return null;
  },

  // Check if username should be remembered
  shouldRememberUsername(): boolean {
    if (!this.isAvailable()) return false;
    return localStorage.getItem(this.REMEMBER_USERNAME_KEY) === 'true';
  },

  // Clear stored username
  clearUsername(): void {
    if (!this.isAvailable()) return;

    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem(this.REMEMBER_USERNAME_KEY);
    
    try {
      sessionStorage.removeItem(this.USERNAME_KEY);
    } catch {
      // sessionStorage might not be available
    }
  },

  // Clear all stored data
  clearAll(): void {
    if (!this.isAvailable()) return;

    // Clear only our app's data
    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem(this.REMEMBER_USERNAME_KEY);
    
    try {
      sessionStorage.removeItem(this.USERNAME_KEY);
    } catch {
      // sessionStorage might not be available
    }
  }
};

export default StorageService;
