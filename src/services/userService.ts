import { Perms } from "../types/user";

export function checkPerms(
  perms: Perms,
  resource: keyof Perms,
  accessLevel: string
): boolean {
  if (perms["admin"] === true || perms[resource] == accessLevel) {
    return true;
  } else if (perms[resource] == "viewer" && accessLevel == "editor") {
    return false;
  } else if (perms[resource] == "editor" && accessLevel == "viewer") {
    return true;
  } else {
    return false;
  }
}
