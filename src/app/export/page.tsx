"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Papa from "papaparse";

interface DailyEntry {
  id: string;
  date: string;
  activities: string[];
  custom_activities: string[];
  special_events: string[];
  meals: number;
  notes: string;
  created_at: string;
  photos?: Array<{
    file_path: string;
    location?: {
      lat: number;
      lng: number;
      source: string;
    };
  }>;
}

export default function ExportPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(new Date().setMonth(new Date().getMonth() - 1), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    loadEntries();
  }, [dateRange]);

  const loadEntries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: entriesData, error } = await supabase
        .from("daily_entries")
        .select(`
          *,
          photos:entry_photos(file_path, location)
        `)
        .eq("user_id", user.id)
        .gte("date", dateRange.start)
        .lte("date", dateRange.end)
        .order("date", { ascending: false });

      if (error) {
        throw error;
      }

      setEntries(entriesData || []);
    } catch (error) {
      console.error("Error loading entries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `custody-documentation-${dateRange.start}-to-${dateRange.end}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const csvData = entries.map(entry => ({
      Date: entry.date,
      Activities: entry.activities.join(", "),
      "Custom Activities": entry.custom_activities.join(", "),
      "Special Events": entry.special_events.join(", "),
      Meals: entry.meals,
      Notes: entry.notes,
      "Number of Photos": entry.photos?.length || 0,
      "Created At": entry.created_at,
    }));

    const csv = Papa.unparse(csvData);
    const dataBlob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `custody-documentation-${dateRange.start}-to-${dateRange.end}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      // For now, we'll create a simple HTML-based PDF
      // In production, you might want to use a proper PDF library like pdf-lib
      const htmlContent = `
        <html>
          <head>
            <title>Custody Documentation</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .entry { margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 15px; }
              .date { font-weight: bold; font-size: 18px; margin-bottom: 10px; }
              .section { margin-bottom: 10px; }
              .label { font-weight: bold; }
              .activities { margin-left: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Custody Documentation</h1>
              <p>Period: ${dateRange.start} to ${dateRange.end}</p>
            </div>
            ${entries.map(entry => `
              <div class="entry">
                <div class="date">${format(new Date(entry.date), "EEEE, MMMM d, yyyy")}</div>
                <div class="section">
                  <span class="label">Activities:</span>
                  <div class="activities">${entry.activities.join(", ")}</div>
                </div>
                ${entry.custom_activities.length > 0 ? `
                  <div class="section">
                    <span class="label">Custom Activities:</span>
                    <div class="activities">${entry.custom_activities.join(", ")}</div>
                  </div>
                ` : ""}
                ${entry.special_events.length > 0 ? `
                  <div class="section">
                    <span class="label">Special Events:</span>
                    <div class="activities">${entry.special_events.join(", ")}</div>
                  </div>
                ` : ""}
                <div class="section">
                  <span class="label">Meals:</span> ${entry.meals}
                </div>
                ${entry.notes ? `
                  <div class="section">
                    <span class="label">Notes:</span> ${entry.notes}
                  </div>
                ` : ""}
                <div class="section">
                  <span class="label">Photos:</span> ${entry.photos?.length || 0}
                </div>
              </div>
            `).join("")}
          </body>
        </html>
      `;

      const dataBlob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `custody-documentation-${dateRange.start}-to-${dateRange.end}.html`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto w-full py-12">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full py-12">
      <h1 className="text-2xl font-semibold mb-6">Export Data</h1>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h2 className="text-lg font-medium mb-4">Date Range</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Summary</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-2xl font-bold text-blue-600">{entries.length}</div>
            <div className="text-sm text-blue-800">Total Entries</div>
          </div>
          <div className="bg-green-50 p-4 rounded">
            <div className="text-2xl font-bold text-green-600">
              {entries.reduce((sum, entry) => sum + entry.meals, 0)}
            </div>
            <div className="text-sm text-green-800">Total Meals</div>
          </div>
          <div className="bg-purple-50 p-4 rounded">
            <div className="text-2xl font-bold text-purple-600">
              {entries.reduce((sum, entry) => sum + (entry.photos?.length || 0), 0)}
            </div>
            <div className="text-sm text-purple-800">Total Photos</div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Export Options</h2>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={exportToJSON}
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📄</div>
              <div className="font-medium">Export as JSON</div>
              <div className="text-sm text-gray-600">Machine-readable format</div>
            </div>
          </button>

          <button
            onClick={exportToCSV}
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium">Export as CSV</div>
              <div className="text-sm text-gray-600">Spreadsheet compatible</div>
            </div>
          </button>

          <button
            onClick={exportToPDF}
            disabled={exporting}
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📋</div>
              <div className="font-medium">
                {exporting ? "Generating..." : "Export as PDF"}
              </div>
              <div className="text-sm text-gray-600">Printable format</div>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Recent Entries</h2>
        <div className="space-y-4">
          {entries.slice(0, 5).map((entry) => (
            <div key={entry.id} className="border-b pb-4 last:border-b-0">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">
                    {format(new Date(entry.date), "EEEE, MMMM d, yyyy")}
                  </div>
                  <div className="text-sm text-gray-600">
                    Activities: {entry.activities.join(", ")}
                  </div>
                  {entry.notes && (
                    <div className="text-sm text-gray-600 mt-1">
                      Notes: {entry.notes}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div>Meals: {entry.meals}</div>
                  <div>Photos: {entry.photos?.length || 0}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {entries.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No entries found for the selected date range.
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="border border-gray-300 rounded px-6 py-2 hover:bg-gray-50"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
