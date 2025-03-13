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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
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
