"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import exifr from "exifr";

const documentationSchema = z.object({
  activities: z.array(z.string()).min(1, "Select at least one activity"),
  customActivities: z.array(z.string()).optional(),
  specialEvents: z.array(z.string()).max(5, "Maximum 5 special events"),
  meals: z.number().min(0).max(10, "Meals must be between 0 and 10"),
  notes: z.string().optional(),
  photos: z.array(z.object({
    file: z.instanceof(File),
    location: z.object({
      lat: z.number().optional(),
      lng: z.number().optional(),
      source: z.enum(["exif", "gps", "manual"]),
    }).optional(),
  })).optional(),
});

type DocumentationValues = z.infer<typeof documentationSchema>;

const standardActivities = [
  "Park visit",
  "Hiking",
  "Indoor play",
  "Movie/TV",
  "Reading",
  "Arts & crafts",
  "Outdoor sports",
  "Shopping",
  "Restaurant",
  "Home activities",
];

const specialEventOptions = [
  "Illness",
  "Conflict",
  "School issue",
  "Medical appointment",
  "Behavioral concern",
  "Positive milestone",
  "Family visit",
  "Special occasion",
];

export default function TodayDocumentationPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [recentActivities, setRecentActivities] = useState<string[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<DocumentationValues>({
    resolver: zodResolver(documentationSchema),
    defaultValues: {
      activities: [],
      specialEvents: [],
      meals: 0,
      notes: "",
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    loadRecentActivities();
    requestLocationPermission();
  }, []);

  const loadRecentActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // Load recent custom activities from previous entries
      const { data: entries } = await supabase
        .from("daily_entries")
        .select("custom_activities")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (entries) {
        const allActivities = entries
          .flatMap(entry => entry.custom_activities || [])
          .filter(Boolean);
        setRecentActivities([...new Set(allActivities)]);
      }
    } catch (error) {
      console.error("Error loading recent activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestLocationPermission = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Location permission denied:", error);
        }
      );
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const extractLocationFromPhoto = async (file: File) => {
    try {
      const exifData = await exifr.gps(file);
      if (exifData) {
        return {
          lat: exifData.latitude,
          lng: exifData.longitude,
          source: "exif" as const,
        };
      }
    } catch (error) {
      console.log("No EXIF data found");
    }

    // Fallback to current location if available
    if (currentLocation) {
      return {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        source: "gps" as const,
      };
    }

    return undefined;
  };

  const onSubmit = async (values: DocumentationValues) => {
    setMessage(null);
    setErrorMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      // Create the daily entry
      const entryData = {
        user_id: user.id,
        date: today,
        activities: values.activities,
        custom_activities: values.customActivities || [],
        special_events: values.specialEvents,
        meals: values.meals,
        notes: values.notes || "",
        created_at: new Date().toISOString(),
      };

      const { data: entry, error: entryError } = await supabase
        .from("daily_entries")
        .insert(entryData)
        .select()
        .single();

      if (entryError) {
        throw entryError;
      }

      // Handle photo uploads
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const location = await extractLocationFromPhoto(file);
          
          // Upload photo to Supabase Storage
          const fileName = `${user.id}/${entry.id}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("custody-photos")
            .upload(fileName, file);

          if (uploadError) {
            console.error("Photo upload failed:", uploadError);
            continue;
          }

          // Create photo record
          await supabase
            .from("entry_photos")
            .insert({
              entry_id: entry.id,
              file_path: fileName,
              location: location,
            });
        }
      }

      setMessage("Documentation saved successfully!");
      
      // TODO: Trigger Google Calendar event creation if connected
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (error) {
      console.error("Error saving documentation:", error);
      setErrorMessage("Failed to save documentation. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto w-full py-12">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full py-12">
      <h1 className="text-2xl font-semibold mb-6">Document Today</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-medium mb-4">Activities</h2>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            {standardActivities.map((activity) => (
              <label key={activity} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  value={activity}
                  {...register("activities")}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{activity}</span>
              </label>
            ))}
          </div>

          {recentActivities.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Recent Custom Activities
              </label>
              <div className="flex flex-wrap gap-2">
                {recentActivities.map((activity) => (
                  <button
                    key={activity}
                    type="button"
                    onClick={() => {
                      const current = watchedValues.customActivities || [];
                      if (!current.includes(activity)) {
                        setValue("customActivities", [...current, activity]);
                      }
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200"
                  >
                    {activity}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Add Custom Activity
            </label>
            <input
              type="text"
              placeholder="Enter custom activity"
              className="w-full border rounded px-3 py-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const input = e.target as HTMLInputElement;
                  const value = input.value.trim();
                  if (value) {
                    const current = watchedValues.customActivities || [];
                    setValue("customActivities", [...current, value]);
                    input.value = "";
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-medium mb-4">Special Events</h2>
          <div className="grid grid-cols-2 gap-3">
            {specialEventOptions.map((event) => (
              <label key={event} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  value={event}
                  {...register("specialEvents")}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{event}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Number of Meals
            </label>
            <input
              type="number"
              min="0"
              max="10"
              {...register("meals", { valueAsNumber: true })}
              className="w-full border rounded px-3 py-2"
            />
            {errors.meals && (
              <p className="text-sm text-red-600 mt-1">
                {errors.meals.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Additional Notes
          </label>
          <textarea
            {...register("notes")}
            rows={4}
            className="w-full border rounded px-3 py-2"
            placeholder="Any additional notes about today..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Photos (optional)
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full border rounded px-3 py-2"
          />
          {selectedFiles.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                Selected {selectedFiles.length} photo(s)
              </p>
            </div>
          )}
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-black text-white rounded px-6 py-2 disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save Documentation"}
          </button>
          
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="border border-gray-300 rounded px-6 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
