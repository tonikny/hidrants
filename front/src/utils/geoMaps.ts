/**
 * Obre una ubicació a l’app de mapes nativa (Android o iOS).
 */
export function openInNativeMaps(lat: number, lng: number, label?: string) {
  const geoLink =
    //   label
    // ? `geo:${lat},${lng}?q=${encodeURIComponent(label)}`
    // :
    `geo:${lat},${lng}`;
  globalThis.location.href = geoLink;
}

/**
 * Retorna true si el dispositiu és mòbil.
 */
export function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
