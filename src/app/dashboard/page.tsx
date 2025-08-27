import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has connected Google account
  const { data: googleTokens } = await supabase
    .from("google_oauth_tokens")
    .select("google_email")
    .eq("user_id", user.id)
    .single();

  // Check if user has configured custody schedule
  const { data: schedule } = await supabase
    .from("custody_schedules")
    .select("monday, tuesday, wednesday, thursday, friday, saturday, sunday")
    .eq("user_id", user.id)
    .single();

  // Get recent entries count
  const { count: recentEntries } = await supabase
    .from("daily_entries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

  return (
    <div className="max-w-4xl mx-auto w-full py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600 mt-2">Willkommen zurück, {user.email}</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Google-Konto</p>
              <p className="text-2xl font-bold text-gray-900">
                {googleTokens ? "Verbunden" : "Nicht verbunden"}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${googleTokens ? "bg-green-500" : "bg-gray-300"}`}></div>
          </div>
          {googleTokens && (
            <p className="text-sm text-gray-500 mt-1">{googleTokens.google_email}</p>
          )}
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Obsorge-Plan</p>
              <p className="text-2xl font-bold text-gray-900">
                {schedule ? "Konfiguriert" : "Nicht gesetzt"}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${schedule ? "bg-green-500" : "bg-gray-300"}`}></div>
          </div>
          {schedule && (
            <p className="text-sm text-gray-500 mt-1">
              {Object.entries(schedule)
                .filter(([, enabled]) => enabled)
                .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1))
                .join(", ")}
            </p>
          )}
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Letzte Einträge</p>
              <p className="text-2xl font-bold text-gray-900">{recentEntries || 0}</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Letzte 7 Tage</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Schnellaktionen</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/docs/today"
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-blue-600 text-xl">📝</span>
            </div>
            <div>
              <h3 className="font-medium">Heute dokumentieren</h3>
              <p className="text-sm text-gray-600">Aktivitäten von heute aufzeichnen</p>
            </div>
          </Link>

          <Link
            href="/schedule"
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-green-600 text-xl">📅</span>
            </div>
            <div>
              <h3 className="font-medium">Plan verwalten</h3>
              <p className="text-sm text-gray-600">Obsorge-Tage und Zeiten konfigurieren</p>
            </div>
          </Link>

          <Link
            href="/export"
            className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
              <span className="text-purple-600 text-xl">📊</span>
            </div>
            <div>
              <h3 className="font-medium">Daten exportieren</h3>
              <p className="text-sm text-gray-600">Dokumentation herunterladen</p>
            </div>
          </Link>

          {!googleTokens && (
            <Link
              href="/api/google/auth"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <span className="text-red-600 text-xl">🔗</span>
              </div>
              <div>
                <h3 className="font-medium">Google-Konto verbinden</h3>
                <p className="text-sm text-gray-600">Für zukünftige Erweiterungen</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Getting Started */}
      {(!schedule || !googleTokens) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Erste Schritte</h2>
          <div className="space-y-3">
            {!schedule && (
              <div className="flex items-center text-blue-800">
                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">1</span>
                <Link href="/schedule" className="underline hover:no-underline">
                  Obsorge-Plan konfigurieren
                </Link>
              </div>
            )}
            {!googleTokens && (
              <div className="flex items-center text-blue-800">
                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                  {!schedule ? "2" : "1"}
                </span>
                <Link href="/api/google/auth" className="underline hover:no-underline">
                  Google-Konto verbinden (optional)
                </Link>
              </div>
            )}
            <div className="flex items-center text-blue-800">
              <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mr-3">
                {(!schedule ? 3 : 2) + (!googleTokens ? 1 : 0)}
              </span>
              <Link href="/docs/today" className="underline hover:no-underline">
                Mit der Dokumentation beginnen
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Info about simplified OAuth */}
      {googleTokens && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
          <h3 className="font-medium text-green-900 mb-2">Google-Konto verbunden</h3>
          <p className="text-sm text-green-700 mb-3">
            Dein Google-Konto ist erfolgreich verbunden. Diese Verbindung ermöglicht es der App, 
            deine Identität zu verifizieren und kann in Zukunft für erweiterte Funktionen genutzt werden.
          </p>
          <p className="text-sm text-green-600">
            <strong>Hinweis:</strong> Die App erstellt keine automatischen Kalender-Events. 
            Alle Obsorge-Dokumentationen werden lokal in der App gespeichert.
          </p>
        </div>
      )}
    </div>
  );
}
