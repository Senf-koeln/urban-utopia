export function generateBase62Id(idLength = 20): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  return [...new Array(idLength)].reduce(
    (acc) => acc + chars.charAt(Math.floor(Math.random() * chars.length)),
    "",
  );
}
