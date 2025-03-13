'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import AuthTransition from '../../components/AuthTransition';

type FormData = {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'formateur' | 'eleve';
};

export default function SignUp() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      role: 'eleve'
    }
  });
  const password = watch('password');
  
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${15 + Math.random() * 15}s`,
      type: i % 5 + 1
    }));
    setParticles(newParticles);
  }, []);
  
  const onSubmit = async (data: FormData) => {
    if (data.password !== data.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      
      // Stocker le résultat de signUp dans une variable
      const result = await signUp(data.email, data.password, data.displayName, data.role);
      
      // Vérifier si le résultat contient une indication d'erreur
      // Cette partie dépend de l'implémentation de votre fonction signUp
      if (result && typeof result === 'object' && 'error' in result) {
        // Si le résultat contient une erreur, l'afficher et ne pas rediriger
        throw { code: result.code, message: result.error };
      }
      
      // Si nous arrivons ici, c'est que l'inscription a réussi
      // Attendre un court instant avant de rediriger (pour être sûr que tout est bien traité)
      setTimeout(() => {
        router.push('/');
      }, 100);
      
    } catch (error: any) {
      // Personnaliser les messages d'erreur en fonction du code d'erreur Firebase
      if (error.code === 'auth/email-already-in-use') {
        setError('Cette adresse email est déjà utilisée. Veuillez vous connecter ou utiliser une autre adresse.');
      } else if (error.code === 'auth/weak-password') {
        setError('Le mot de passe est trop faible. Veuillez utiliser au moins 6 caractères.');
      } else if (error.code === 'auth/invalid-email') {
        setError('L\'adresse email n\'est pas valide. Veuillez vérifier votre saisie.');
      } else {
        setError(error.message || 'Une erreur est survenue lors de l\'inscription. Veuillez réessayer.');
      }
      console.error("Erreur d'inscription:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-16 relative overflow-hidden">
      {/* Fond animé avec dégradés */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 animate-ultra-gradient"></div>
      
      {/* Bulles animées en arrière-plan */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-blue-300/20 to-indigo-400/20 blur-3xl animate-float-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-purple-300/20 to-pink-400/20 blur-3xl animate-float-slow-reverse"></div>
      <div className="absolute top-3/4 left-1/2 w-72 h-72 rounded-full bg-gradient-to-r from-indigo-300/20 to-blue-400/20 blur-3xl animate-float-medium"></div>
      
      {/* Effet de verre animé */}
      <div className="absolute inset-0 backdrop-blur-[2px] animate-glass-blur"></div>
      
      {/* Particules flottantes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="particle-container">
          {particles.map((particle) => (
            <div 
              key={particle.id} 
              className={`particle particle-${particle.type}`}
              style={{
                top: particle.top,
                left: particle.left,
                animationDelay: particle.delay,
                animationDuration: particle.duration
              }}
            ></div>
          ))}
        </div>
      </div>
      
      <div className="w-full max-w-2xl relative z-10 px-6 py-8">
        <AuthTransition currentPage="signup">
          <div className="relative backdrop-blur-lg bg-white/30 border border-white/50 rounded-3xl shadow-2xl overflow-hidden animate-glass-shimmer depth-shadow-card">
            {/* Éléments décoratifs */}
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-400/30 blur-2xl animate-pulse-slow"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/30 blur-2xl animate-pulse-slow-reverse"></div>
            
            {/* Contenu du formulaire */}
            <div className="relative p-10 md:p-12">
              {/* En-tête */}
              <div className="text-center mb-10">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-neon animate-ultra-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="mt-6 text-center text-4xl font-extrabold text-white text-glow animate-text-pulse">
                  Créer un compte
                </h2>
                <p className="mt-3 text-center text-lg text-white/90">
                  Ou{' '}
                  <Link href="/auth/signin" className="font-medium text-cyan-300 hover:text-cyan-200 transition-colors text-glow-cyan">
                    connectez-vous à votre compte existant
                  </Link>
                </p>
              </div>

              {/* Messages d'erreur avec effet de verre avancé pour la page d'inscription */}
              {error && (
                <div className="mb-8 rounded-xl bg-gradient-to-r from-red-500/15 to-purple-500/10 backdrop-blur-md p-5 border-l-4 border-red-400/40 animate-fade-in-bounce shadow-[0_4px_15px_rgba(248,113,113,0.15)] overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-purple-500/5 to-indigo-500/5 animate-pulse-slow opacity-50"></div>
                  <div className="flex relative z-10">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-red-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-base font-medium text-red-200">Erreur d'inscription</h3>
                      <div className="mt-2 text-sm text-red-100">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <label htmlFor="displayName" className="block text-lg font-medium text-white text-glow-subtle mb-2">
                    Nom complet
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-6 w-6 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="displayName"
                      type="text"
                      autoComplete="name"
                      {...register('displayName', { required: 'Le nom est requis' })}
                      className={`pl-12 block w-full rounded-xl backdrop-blur-md shadow-inner-glow focus:border-cyan-400 focus:ring-cyan-400 text-white text-base py-4 input-glow ${
                        errors.displayName 
                          ? 'border-indigo-500/50 bg-indigo-900/20 animate-pulse-subtle' 
                          : 'border-indigo-500/50 bg-indigo-900/30'
                      }`}
                    />
                  </div>
                  {errors.displayName && (
                    <p className="mt-2 text-sm font-medium text-white bg-red-500/30 px-3 py-1 rounded-md backdrop-blur-sm border border-red-400/30 shadow-inner">
                      {errors.displayName.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-lg font-medium text-white text-glow-subtle mb-2">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-6 w-6 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register('email', { 
                        required: 'L\'email est requis',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Adresse e-mail invalide'
                        }
                      })}
                      className="pl-12 block w-full rounded-xl border-indigo-500/50 bg-indigo-900/30 backdrop-blur-md shadow-inner-glow focus:border-cyan-400 focus:ring-cyan-400 text-white text-base py-4 input-glow"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm font-medium text-white bg-red-500/30 px-3 py-1 rounded-md backdrop-blur-sm border border-red-400/30 shadow-inner">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-lg font-medium text-white text-glow-subtle mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-6 w-6 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      {...register('password', { 
                        required: 'Le mot de passe est requis',
                        minLength: {
                          value: 6,
                          message: 'Le mot de passe doit contenir au moins 6 caractères'
                        }
                      })}
                      className="pl-12 block w-full rounded-xl border-indigo-500/50 bg-indigo-900/30 backdrop-blur-md shadow-inner-glow focus:border-cyan-400 focus:ring-cyan-400 text-white text-base py-4 input-glow"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm font-medium text-white bg-red-500/30 px-3 py-1 rounded-md backdrop-blur-sm border border-red-400/30 shadow-inner">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-lg font-medium text-white text-glow-subtle mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-6 w-6 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      {...register('confirmPassword', { 
                        required: 'Veuillez confirmer votre mot de passe',
                        validate: value => value === password || 'Les mots de passe ne correspondent pas'
                      })}
                      className="pl-12 block w-full rounded-xl border-indigo-500/50 bg-indigo-900/30 backdrop-blur-md shadow-inner-glow focus:border-cyan-400 focus:ring-cyan-400 text-white text-base py-4 input-glow"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm font-medium text-white bg-red-500/30 px-3 py-1 rounded-md backdrop-blur-sm border border-red-400/30 shadow-inner">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="role" className="block text-lg font-medium text-white text-glow-subtle mb-2">
                    Type de compte
                  </label>
                  <div className="mt-2 space-y-3">
                    <div className="flex items-center">
                      <input
                        id="role-eleve"
                        type="radio"
                        value="eleve"
                        {...register('role', { required: true })}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-indigo-300 checkbox-glow"
                      />
                      <label htmlFor="role-eleve" className="ml-3 block text-base text-white">
                        Élève
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="role-formateur"
                        type="radio"
                        value="formateur"
                        {...register('role', { required: true })}
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-indigo-300 checkbox-glow"
                      />
                      <label htmlFor="role-formateur" className="ml-3 block text-base text-white">
                        Formateur
                      </label>
                    </div>
                  </div>
                  {errors.role && (
                    <p className="mt-2 text-sm font-medium text-white bg-red-500/30 px-3 py-1 rounded-md backdrop-blur-sm border border-red-400/30 shadow-inner">
                      Veuillez sélectionner un type de compte
                    </p>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 w-full rounded-xl border border-purple-500/50 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-size-200 px-4 py-4 text-white text-lg font-medium shadow-neon-purple transition-all hover:scale-[1.03] hover:shadow-neon-purple-intense hover:bg-pos-100 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed animate-button-pulse"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Inscription en cours...
                      </div>
                    ) : 'Créer un compte'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </AuthTransition>
      </div>
    </div>
  );
}
