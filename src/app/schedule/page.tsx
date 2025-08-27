"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const scheduleSchema = z.object({
  monday: z.boolean(),
  tuesday: z.boolean(),
  wednesday: z.boolean(),
  thursday: z.boolean(),
  friday: z.boolean(),
  saturday: z.boolean(),
  sunday: z.boolean(),
  pickupTime: z.string().min(1, "Abholzeit ist erforderlich"),
  reminderTime: z.string().min(1, "Erinnerungszeit ist erforderlich"),
});

type ScheduleValues = z.infer<typeof scheduleSchema>;

const daysOfWeek = [
  { key: "monday", label: "Montag" },
  { key: "tuesday", label: "Dienstag" },
  { key: "wednesday", label: "Mittwoch" },
  { key: "thursday", label: "Donnerstag" },
  { key: "friday", label: "Freitag" },
  { key: "saturday", label: "Samstag" },
  { key: "sunday", label: "Sonntag" },
] as const;

export default function SchedulePage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      pickupTime: "08:00",
      reminderTime: "20:00",
    },
  });

  useEffect(() => {
    loadExistingSchedule();
  }, []);

  const loadExistingSchedule = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: schedule } = await supabase
        .from("custody_schedules")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (schedule) {
        daysOfWeek.forEach((day) => {
          setValue(day.key, schedule[day.key]);
        });
        setValue("pickupTime", schedule.pickup_time);
        setValue("reminderTime", schedule.reminder_time);
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: ScheduleValues) => {
    setMessage(null);
    setErrorMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      const scheduleData = {
        user_id: user.id,
        monday: values.monday,
        tuesday: values.tuesday,
        wednesday: values.wednesday,
        thursday: values.thursday,
        friday: values.friday,
        saturday: values.saturday,
        sunday: values.sunday,
        pickup_time: values.pickupTime,
        reminder_time: values.reminderTime,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("custody_schedules")
        .upsert(scheduleData, {
          onConflict: "user_id",
        });

      if (error) {
        throw error;
      }

      setMessage("Plan erfolgreich gespeichert!");
      
    } catch (error) {
      console.error("Error saving schedule:", error);
      setErrorMessage("Fehler beim Speichern des Plans. Bitte versuche es erneut.");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto w-full py-12">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full py-12">
      <h1 className="text-2xl font-semibold mb-6">Obsorge-Plan</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-lg font-medium mb-4">Obsorge-Tage auswählen</h2>
          <div className="grid grid-cols-2 gap-4">
            {daysOfWeek.map((day) => (
              <label key={day.key} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  {...register(day.key)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Abholzeit
            </label>
            <input
              type="time"
              {...register("pickupTime")}
              className="w-full border rounded px-3 py-2"
            />
            {errors.pickupTime && (
              <p className="text-sm text-red-600 mt-1">
                {errors.pickupTime.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Tägliche Erinnerungszeit
            </label>
            <input
              type="time"
              {...register("reminderTime")}
              className="w-full border rounded px-3 py-2"
            />
            {errors.reminderTime && (
              <p className="text-sm text-red-600 mt-1">
                {errors.reminderTime.message}
              </p>
            )}
          </div>
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
            {isSubmitting ? "Speichern..." : "Plan speichern"}
          </button>
          
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="border border-gray-300 rounded px-6 py-2"
          >
            Abbrechen
          </button>
        </div>
      </form>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Info</h3>
        <p className="text-sm text-blue-700 mb-3">
          Dein Obsorge-Plan wird lokal in der App gespeichert. Du kannst ihn jederzeit ändern 
          und er wird für deine täglichen Erinnerungen verwendet.
        </p>
        <p className="text-sm text-blue-600">
          <strong>Hinweis:</strong> Die App erstellt keine automatischen Kalender-Events. 
          Alle Informationen werden sicher in der App gespeichert.
        </p>
      </div>
    </div>
  );
}
