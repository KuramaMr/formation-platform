'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';

type FormData = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export default function SignIn() {
  const { signIn, resetPassword, error: authError } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });
  
  const emailValue = watch('email');
  
  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      setLoading(true);
      
      const user = await signIn(data.email, data.password, data.rememberMe);
      
      if (user) {
        router.push('/');
      } else {
        setError(authError || 'Identifiants incorrects. Veuillez vérifier votre email et mot de passe.');
      }
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      setError('Veuillez entrer votre adresse e-mail pour réinitialiser votre mot de passe');
      return;
    }
    
    try {
      setError(null);
      setLoading(true);
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue lors de l\'envoi de l\'email de réinitialisation');
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
      
      <div className="w-full max-w-xl relative z-10">
        {/* Carte principale avec effet glacé amélioré - SANS le reflet */}
        <div className="relative backdrop-blur-lg bg-white/30 border border-white/50 rounded-3xl shadow-2xl overflow-hidden animate-glass-shimmer">
          {/* Éléments décoratifs */}
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-blue-400/30 to-indigo-400/30 blur-2xl animate-pulse-slow"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-br from-purple-400/30 to-pink-400/30 blur-2xl animate-pulse-slow-reverse"></div>
          
          {/* Contenu du formulaire */}
          <div className="relative p-10 md:p-12">
            {/* En-tête */}
            <div className="text-center mb-10">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-neon animate-ultra-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-4xl font-extrabold text-white text-glow animate-text-pulse">
                {showResetForm ? 'Réinitialiser le mot de passe' : 'Bienvenue'}
              </h2>
              <p className="mt-3 text-center text-lg text-white/90">
                {showResetForm ? (
                  <button 
                    onClick={() => setShowResetForm(false)}
                    className="font-medium text-cyan-300 hover:text-cyan-200 transition-colors text-glow-cyan"
                  >
                    Retour à la connexion
                  </button>
                ) : (
                  <>
                    Ou{' '}
                    <Link href="/auth/signup" className="font-medium text-pink-300 hover:text-pink-200 transition-colors text-glow-pink">
                      créez un nouveau compte
                    </Link>
                  </>
                )}
              </p>
            </div>

            {/* Messages d'erreur */}
            {error && (
              <div className="mb-8 rounded-xl bg-red-900/30 backdrop-blur-md p-5 border border-red-500/50 animate-fade-in-bounce neon-error-glow">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base font-medium text-red-300">Erreur de connexion</h3>
                    <div className="mt-2 text-sm text-red-200">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Message de succès pour la réinitialisation */}
            {resetSent && (
              <div className="mb-8 rounded-xl bg-green-900/30 backdrop-blur-md p-5 border border-green-500/50 animate-fade-in-bounce neon-success-glow">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-base font-medium text-green-300">Email envoyé</h3>
                    <div className="mt-2 text-sm text-green-200">
                      <p>Un email de réinitialisation a été envoyé à {resetEmail}. Veuillez vérifier votre boîte de réception.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Formulaire de réinitialisation de mot de passe */}
            {showResetForm ? (
              <form className="space-y-8" onSubmit={handleResetPassword}>
                <div>
                  <label htmlFor="reset-email" className="block text-lg font-medium text-white text-glow-subtle mb-2">
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-6 w-6 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="reset-email"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-12 block w-full rounded-xl border-indigo-500/50 bg-indigo-900/30 backdrop-blur-md shadow-inner-glow focus:border-cyan-400 focus:ring-cyan-400 text-white text-base py-4 input-glow"
                      placeholder="Entrez votre adresse e-mail"
                      required
                    />
                  </div>
                  <p className="mt-3 text-sm text-indigo-200">
                    Nous vous enverrons un lien pour réinitialiser votre mot de passe.
                  </p>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 w-full rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-size-200 px-4 py-4 text-white text-lg font-medium shadow-neon-cyan transition-all hover:scale-[1.03] hover:shadow-neon-cyan-intense hover:bg-pos-100 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed animate-button-pulse"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Envoi en cours...
                      </div>
                    ) : 'Envoyer le lien de réinitialisation'}
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
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
                    <p className="mt-2 text-sm text-red-300 text-glow-red">{errors.email.message}</p>
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
                      autoComplete="current-password"
                      {...register('password', { required: 'Le mot de passe est requis' })}
                      className="pl-12 block w-full rounded-xl border-indigo-500/50 bg-indigo-900/30 backdrop-blur-md shadow-inner-glow focus:border-cyan-400 focus:ring-cyan-400 text-white text-base py-4 input-glow"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-300 text-glow-red">{errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      {...register('rememberMe')}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-indigo-300 rounded checkbox-glow"
                    />
                    <label htmlFor="rememberMe" className="ml-3 block text-base text-white">
                      Se souvenir de moi
                    </label>
                  </div>

                  <div className="text-base">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowResetForm(true);
                        setResetEmail(emailValue || '');
                        setResetSent(false);
                      }}
                      className="font-medium text-cyan-300 hover:text-cyan-200 transition-colors text-glow-cyan"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
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
                        Connexion en cours...
                      </div>
                    ) : 'Se connecter'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
