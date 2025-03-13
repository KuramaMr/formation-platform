'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from './contexts/AuthContext';

export default function Home() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden max-[1030px]:hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-100 to-white -z-10"></div>
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-32 sm:pb-24">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl mb-6">
                <span className="block text-indigo-600">Formation App</span>
                <span className="block">Apprenez à votre rythme</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl">
                Une plateforme simple et efficace pour les formateurs indépendants et leurs élèves. 
                Gérez vos formations, suivez vos progrès et restez connecté avec vos formateurs.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                {!user ? (
                  <>
                    <Link
                      href="/auth/signup"
                      className="rounded-md bg-indigo-600 px-5 py-2.5 text-base font-semibold text-white border border-indigo-700 shadow-[0_5px_0_0_#4338ca,0_5px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_#4338ca,0_3px_6px_rgba(0,0,0,0.1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-700 transition-all duration-75"
                    >
                      S'inscrire gratuitement
                    </Link>
                    <Link
                      href="/auth/signin"
                      className="rounded-md bg-white px-5 py-2.5 text-base font-semibold text-indigo-600 border border-gray-300 shadow-[0_5px_0_0_#cbd5e1,0_5px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-50 active:border-indigo-200 transition-all duration-75"
                    >
                      Se connecter
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex space-x-4 mb-16 max-[1030px]:mb-4">
                      <Link
                        href="/dashboard"
                        className="flex-1 text-center px-4 py-2.5 bg-white text-indigo-600 font-medium rounded-md border border-gray-300 shadow-[0_5px_0_0_#cbd5e1,0_5px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-50 active:border-indigo-200 transition-all duration-75 mr-4"
                      >
                        Mon tableau de bord
                      </Link>
                      <Link
                        href="/formations"
                        className="w-auto text-center px-5 py-2.5 bg-white text-indigo-600 font-medium rounded-md border border-gray-300 shadow-[0_5px_0_0_#cbd5e1,0_5px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-50 active:border-indigo-200 transition-all duration-75 whitespace-nowrap"
                      >
                        Voir les formations
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="relative h-64 sm:h-80 lg:h-96 w-full rounded-xl overflow-hidden shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-90"></div>
                <div className="absolute inset-0 flex items-center justify-center text-white p-6">
                  <div className="text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4">Apprenez n'importe où, n'importe quand</h2>
                    <p className="text-lg opacity-90">Accédez à vos cours sur tous vos appareils</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden max-[1030px]:block">
        {/* Hero Section */}
        <div className="relative isolate overflow-hidden max-[1030px]:py-2">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-100 to-white -z-10"></div>
          
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-32 sm:pb-24">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl mb-6">
                  <span className="block text-indigo-600">Formation App</span>
                  <span className="block">Apprenez à votre rythme</span>
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl">
                  Une plateforme simple et efficace pour les formateurs indépendants et leurs élèves. 
                  Gérez vos formations, suivez vos progrès et restez connecté avec vos formateurs.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  {!user ? (
                    <>
                      <Link
                        href="/auth/signup"
                        className="rounded-md bg-indigo-600 px-5 py-2.5 text-base font-semibold text-white border border-indigo-700 shadow-[0_5px_0_0_#4338ca,0_5px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_#4338ca,0_3px_6px_rgba(0,0,0,0.1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-700 transition-all duration-75"
                      >
                        S'inscrire gratuitement
                      </Link>
                      <Link
                        href="/auth/signin"
                        className="rounded-md bg-white px-5 py-2.5 text-base font-semibold text-indigo-600 border border-gray-300 shadow-[0_5px_0_0_#cbd5e1,0_5px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-50 active:border-indigo-200 transition-all duration-75"
                      >
                        Se connecter
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="flex space-x-4 mb-16 max-[1030px]:mb-4">
                        <Link
                          href="/dashboard"
                          className="flex-1 text-center px-4 py-2.5 bg-white text-indigo-600 font-medium rounded-md border border-gray-300 shadow-[0_5px_0_0_#cbd5e1,0_5px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-50 active:border-indigo-200 transition-all duration-75 mr-4"
                        >
                          Mon tableau de bord
                        </Link>
                        <Link
                          href="/formations"
                          className="w-auto text-center px-5 py-2.5 bg-white text-indigo-600 font-medium rounded-md border border-gray-300 shadow-[0_5px_0_0_#cbd5e1,0_5px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-50 active:border-indigo-200 transition-all duration-75 whitespace-nowrap"
                        >
                          Voir les formations
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="lg:w-1/2 relative">
                <div className="relative h-64 sm:h-80 lg:h-96 w-full rounded-xl overflow-hidden shadow-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-90"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-white p-6">
                    <div className="text-center">
                      <h2 className="text-2xl sm:text-3xl font-bold mb-4">Apprenez n'importe où, n'importe quand</h2>
                      <p className="text-lg opacity-90">Accédez à vos cours sur tous vos appareils</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* En-tête amélioré pour mobile */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-lg mb-8 max-[1030px]:block hidden">
        <p className="text-gray-700 mb-5 text-center">
          Bienvenue sur notre plateforme d'apprentissage en ligne. Découvrez nos formations interactives et suivez votre progression.
        </p>
        
        <div className="flex space-x-4">
          <Link 
            href="/dashboard" 
            className="flex-1 text-center px-4 py-2.5 bg-white text-indigo-600 font-medium rounded-md border border-gray-300 shadow-[0_5px_0_0_#cbd5e1,0_5px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-50 active:border-indigo-200 transition-all duration-75"
          >
            Tableau de bord
          </Link>
          <Link 
            href="/formations" 
            className="flex-1 text-center px-4 py-2.5 bg-white text-indigo-600 font-medium rounded-md border border-gray-300 shadow-[0_5px_0_0_#cbd5e1,0_5px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-50 active:border-indigo-200 transition-all duration-75"
          >
            Formations
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 sm:py-24 max-[1030px]:py-0 max-[1030px]:mt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Pourquoi choisir notre plateforme ?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
              Découvrez les fonctionnalités qui font de Formation App la solution idéale pour l'apprentissage en ligne.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Formations interactives</h3>
              <p className="text-gray-600">
                Accédez à des cours interactifs avec des quiz pour tester vos connaissances et suivre votre progression.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Suivi de présence</h3>
              <p className="text-gray-600">
                Système de signature numérique pour suivre votre présence aux cours et formations.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyse des résultats</h3>
              <p className="text-gray-600">
                Visualisez vos résultats et suivez votre progression dans chaque formation.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              <span className="block">Prêt à commencer votre apprentissage ?</span>
              <span className="block text-indigo-200">Rejoignez notre plateforme dès aujourd'hui.</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 px-4">
                <div className="inline-flex rounded-md shadow">
                  <Link
                    href={user ? "/dashboard" : "/auth/signup"}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-white px-5 py-2.5 text-base font-medium text-indigo-600 border border-gray-300 shadow-[0_5px_0_0_#cbd5e1,0_5px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_3px_0_0_#cbd5e1,0_3px_6px_rgba(0,0,0,0.1)] hover:translate-y-[2px] active:shadow-none active:translate-y-[5px] active:bg-indigo-50 active:border-indigo-200 transition-all duration-75"
                  >
                    {user ? "Accéder à mon tableau de bord" : "S'inscrire gratuitement"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between items-center px-4">
            <div className="flex space-x-6 md:order-2">
              <p className="text-gray-400 text-sm">
                © 2023 Formation App. Tous droits réservés.
              </p>
            </div>
            <p className="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
              Une plateforme d'apprentissage en ligne pour tous.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
