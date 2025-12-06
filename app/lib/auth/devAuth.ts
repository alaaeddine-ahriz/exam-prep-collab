/**
 * Dev Mode Authentication
 * 
 * Simple authentication for development without Supabase.
 * Uses localStorage to persist the dev session.
 */

// Dev user credentials
const DEV_USERS = [
  { id: "dev-user-1", email: "dev@mail.com", password: "pwdpwd", name: "Dev User" },
  { id: "dev-user-2", email: "test@mail.com", password: "test123", name: "Test User" },
];

const DEV_SESSION_KEY = "examprep_dev_session";

export interface DevUser {
  id: string;
  email: string;
  name: string;
}

export interface DevSession {
  user: DevUser;
}

/**
 * Get the current dev session from localStorage
 */
export function getDevSession(): DevSession | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem(DEV_SESSION_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as DevSession;
  } catch {
    return null;
  }
}

/**
 * Sign in with dev credentials
 */
export function devSignIn(email: string, password: string): { session: DevSession | null; error: Error | null } {
  const user = DEV_USERS.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return { session: null, error: new Error("Invalid email or password") };
  }
  
  const session: DevSession = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
  
  localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session));
  
  return { session, error: null };
}

/**
 * Sign up in dev mode (creates a new local user)
 */
export function devSignUp(email: string, password: string): { session: DevSession | null; error: Error | null } {
  // Check if email already exists
  const existingUser = DEV_USERS.find(u => u.email === email);
  if (existingUser) {
    return { session: null, error: new Error("Email already registered") };
  }
  
  // Create new dev user
  const newUser = {
    id: `dev-user-${Date.now()}`,
    email,
    password,
    name: email.split("@")[0],
  };
  
  DEV_USERS.push(newUser);
  
  const session: DevSession = {
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    },
  };
  
  localStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session));
  
  return { session, error: null };
}

/**
 * Sign out from dev session
 */
export function devSignOut(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(DEV_SESSION_KEY);
  }
}

/**
 * Check if dev mode is active
 * Dev mode is active when:
 * 1. NEXT_PUBLIC_DATA_PROVIDER is explicitly set to "sqlite"
 * 2. OR in development mode without Supabase URL configured
 */
export function isDevMode(): boolean {
  // Explicit SQLite mode
  if (process.env.NEXT_PUBLIC_DATA_PROVIDER === "sqlite") {
    return true;
  }
  
  // Development without Supabase configured
  if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return true;
  }
  
  return false;
}
