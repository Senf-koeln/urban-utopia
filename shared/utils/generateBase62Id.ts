/** Default length matches `public.gen_base62_id(10)` (orgs, projects, surveys, maps, dialog_maps, …). Pass 20 for high-volume tables (ideas, entries, comments, users). */
export function generateBase62Id(idLength = 10): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  return [...new Array(idLength)].reduce(
    (acc) => acc + chars.charAt(Math.floor(Math.random() * chars.length)),
    "",
  );
}
