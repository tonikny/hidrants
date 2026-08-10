// Matriu de permisos centralitzada: rol → capacitats.
// Per canviar permisos només cal tocar aquest fitxer.
export type Role = "admin" | "coordinador" | "voluntari";

export type Permission =
  | "create_hydrant"
  | "edit_hydrant"
  | "delete_hydrant"
  | "sync_osm"
  | "view_sync_status"
  | "view_osm_link"
  | "view_own_adf_positions"
  | "view_shared_positions"
  | "view_all_positions"
  | "manage_own_adf_sharing"
  | "manage_telegram"
  | "create_incidencia";

const ALL: Permission[] = [
  "create_hydrant",
  "edit_hydrant",
  "delete_hydrant",
  "sync_osm",
  "view_sync_status",
  "view_osm_link",
  "view_own_adf_positions",
  "view_shared_positions",
  "view_all_positions",
  "manage_own_adf_sharing",
  "manage_telegram",
  "create_incidencia",
];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: ALL,
  coordinador: [
    "create_hydrant",
    "edit_hydrant",
    "delete_hydrant",
    "view_own_adf_positions",
    "view_shared_positions",
    "manage_own_adf_sharing",
    "manage_telegram",
    "create_incidencia",
  ],
  voluntari: ["create_hydrant", "edit_hydrant", "view_own_adf_positions", "create_incidencia"],
};

export function permissionsFor(role: string): Permission[] {
  return [...(ROLE_PERMISSIONS[role as Role] ?? [])];
}
