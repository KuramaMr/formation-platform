import { Metadata } from 'next';
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import BottomNavigation from './components/BottomNavigation';

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Plateforme de Formation",
  description: "Plateforme pour formateurs indépendants",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <title>FormationNexus</title>
        <meta name="description" content="Plateforme d'apprentissage et de formation en ligne" />
      </head>
      <body>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navigation />
            <main className="pb-0">
              {children}
            </main>
            <BottomNavigation />
            <footer className="bg-gray-800 text-white py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center">© {new Date().getFullYear()} Plateforme de Formation</p>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
