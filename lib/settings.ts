import db from "@/lib/db";

const SETTINGS_DEFAULTS: Record<string, string> = {
  tournamentName: "EA FC 26 Ligi",
  registrationLocked: "false",
};

export async function getSettings(
  extraDefaults: Record<string, string> = {}
): Promise<Record<string, string>> {
  const rows = await db.settings.findMany();
  const settings: Record<string, string> = { ...SETTINGS_DEFAULTS, ...extraDefaults };
  for (const row of rows) settings[row.key] = row.value;
  return settings;
}
