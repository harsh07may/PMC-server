export type Perms = {
  admin: true | false;
  municipality_property_records: "editor" | "viewer" | "deny";
  birth_records: "editor" | "viewer" | "deny";
  death_records: "editor" | "viewer" | "deny";
  construction_license_records: "editor" | "viewer" | "deny";
  house_tax_records: "editor" | "viewer" | "deny";
  trade_license_records: "editor" | "viewer" | "deny";
};

export type User = {
  username: string;
  fullname: string;
  password: string;
  roles?: string;
  perms: Perms;
};
