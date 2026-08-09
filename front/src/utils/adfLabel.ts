export const adfLabel = (id: number, nom: string | null | undefined): string =>
  `ADF ${id} ${(nom ?? "").replace(/^ADF\s+/i, "")}`;
