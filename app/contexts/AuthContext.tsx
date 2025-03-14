'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  getAuth,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

type UserRole = 'formateur' | 'eleve';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<{ success: boolean; user?: User | null; error?: string; code?: string }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<User | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constante pour la durée de session (12 heures en millisecondes)
const SESSION_DURATION = 12 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fonction pour configurer le timeout de session
  const setupSessionTimeout = () => {
    // Effacer tout timeout existant
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }

    // Récupérer l'heure de connexion depuis le localStorage
    const loginTime = localStorage.getItem('loginTime');
    
    if (loginTime) {
      const loginTimeMs = parseInt(loginTime, 10);
      const currentTime = Date.now();
      const elapsedTime = currentTime - loginTimeMs;
      
      // Si le temps écoulé est inférieur à la durée de session
      if (elapsedTime < SESSION_DURATION) {
        // Configurer un timeout pour la durée restante
        const remainingTime = SESSION_DURATION - elapsedTime;
        const timeout = setTimeout(() => {
          signOut();
        }, remainingTime);
        
        setSessionTimeout(timeout);
      } else {
        // Si le temps est déjà écoulé, déconnecter immédiatement
        signOut();
      }
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Fetch additional user data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setUserData({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: userDoc.data().role as UserRole
          });
        }
        
        // Configurer le timeout de session quand l'utilisateur est connecté
        setupSessionTimeout();
      } else {
        setUserData(null);
        // Nettoyer le timeout si l'utilisateur est déconnecté
        if (sessionTimeout) {
          clearTimeout(sessionTimeout);
          setSessionTimeout(null);
        }
        // Supprimer l'heure de connexion du localStorage
        localStorage.removeItem('loginTime');
      }
      
      setLoading(false);
    });

    return () => {
      unsubscribe();
      // Nettoyer le timeout lors du démontage du composant
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
    };
  }, []);

  const signUp = async (email: string, password: string, displayName: string, role: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      
      const auth = getAuth();
      
      // Vérifier d'abord si l'email existe déjà
      try {
        // Cette méthode peut varier selon votre implémentation
        // Certaines API Firebase permettent de vérifier si un email existe
        // Sinon, vous pouvez essayer de créer l'utilisateur et gérer l'erreur
      } catch (emailCheckError) {
        // Email existe déjà
        setError('Cette adresse email est déjà utilisée.');
        setLoading(false);
        return { success: false, error: 'Cette adresse email est déjà utilisée.' };
      }
      
      // Créer l'utilisateur
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Mettre à jour le profil
      await updateProfile(user, {
        displayName: displayName
      });
      
      // Stocker les données supplémentaires dans Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        displayName,
        email,
        role,
        createdAt: serverTimestamp()
      });
      
      // Retourner un succès
      return { success: true, user };
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de l\'inscription');
      console.error("Erreur d'inscription dans le contexte:", error);
      
      // Retourner l'erreur
      return { 
        success: false, 
        error: error.message || 'Une erreur est survenue lors de l\'inscription',
        code: error.code
      };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string, rememberMe = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const auth = getAuth();
      
      // Définir la persistance en fonction de l'option "Se souvenir de moi"
      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Enregistrer l'heure de connexion dans le localStorage
      localStorage.setItem('loginTime', Date.now().toString());
      
      // Configurer le timeout de session
      const timeout = setTimeout(() => {
        signOut();
      }, SESSION_DURATION);
      
      setSessionTimeout(timeout);
      
      return userCredential.user;
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la connexion');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const auth = getAuth();
      await firebaseSignOut(auth);
      
      // Nettoyer le timeout et supprimer l'heure de connexion
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        setSessionTimeout(null);
      }
      localStorage.removeItem('loginTime');
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la déconnexion');
    } finally {
      setLoading(false);
    }
  };
  
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de l\'envoi de l\'email de réinitialisation');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      error, 
      signUp, 
      signIn, 
      signOut,
      resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  
  return context;
}
