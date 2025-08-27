import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  // Check if user is already logged in
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/dashboard");
    }
  } catch (error) {
    // Continue to landing page if not authenticated
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white text-xl font-bold">📋</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Obsorge Doku</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Anmelden
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Registrieren
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Obsorge-Dokumentation
              <span className="block text-blue-600">einfach gemacht</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Dokumentiere Aktivitäten während Obsorge-Zeiträumen mit Fotos, GPS-Standort und 
              intelligenten Vorschlägen. Perfekt für Eltern, die ihre Zeit mit den Kindern 
              strukturiert aufzeichnen möchten.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
              >
                Jetzt kostenlos starten
              </Link>
              <Link
                href="/login"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                Bereits registriert?
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Warum Obsorge Doku?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Eine moderne App, die dir hilft, wertvolle Momente mit deinen Kindern zu dokumentieren
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Obsorge-Plan</h3>
              <p className="text-gray-600">
                Konfiguriere wiederkehrende Obsorge-Tage und -Zeiten für eine strukturierte Planung
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tägliche Dokumentation</h3>
              <p className="text-gray-600">
                Dokumentiere Aktivitäten, Mahlzeiten und besondere Ereignisse mit Fotos und GPS
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Intelligente Vorschläge</h3>
              <p className="text-gray-600">
                Vordefinierte Aktivitäten und kürzlich verwendete benutzerdefinierte Aktivitäten
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Progressive Web App</h3>
              <p className="text-gray-600">
                Installierbar auf mobilen Geräten mit Offline-Unterstützung
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sicher & Privat</h3>
              <p className="text-gray-600">
                Alle Daten bleiben in deiner Kontrolle mit Supabase-Backend
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📤</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Einfacher Export</h3>
              <p className="text-gray-600">
                Exportiere deine Dokumentation als PDF, JSON oder CSV
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bereit, deine Obsorge-Zeit zu dokumentieren?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Starte noch heute kostenlos und beginne, wertvolle Momente mit deinen Kindern zu sammeln
          </p>
          <Link
            href="/signup"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg hover:shadow-xl inline-block"
          >
            Kostenlos registrieren
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white text-xl font-bold">📋</span>
                </div>
                <span className="text-xl font-bold">Obsorge Doku</span>
              </div>
              <p className="text-gray-400">
                Eine moderne App für Eltern, um Obsorge-Zeiträume zu dokumentieren
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Obsorge-Plan-Management</li>
                <li>Tägliche Dokumentation</li>
                <li>Foto-Upload mit GPS</li>
                <li>Datenexport</li>
                <li>PWA-Unterstützung</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Rechtliches</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Datenschutz</li>
                <li>Nutzungsbedingungen</li>
                <li>Impressum</li>
                <li>Support</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Obsorge Doku. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}