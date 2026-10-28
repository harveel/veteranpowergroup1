export const staffSections = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", group: "Workspace" },
  { key: "customers", label: "Customers", href: "/dashboard/customers", group: "Workspace" },
  { key: "prospects", label: "Customer enquiries", href: "/dashboard/prospects", group: "Workspace" },
  { key: "quotations", label: "Quotations", href: "/dashboard/quotations", group: "Finance" },
  { key: "invoices", label: "Invoices", href: "/dashboard/invoices", group: "Finance" },
  { key: "receipts", label: "Receipts", href: "/dashboard/receipts", group: "Finance" },
  { key: "payment-plans", label: "School payment templates", href: "/dashboard/payment-plans", group: "Finance" },
  { key: "analytics", label: "Website analytics", href: "/dashboard/analytics", group: "Insights" },
  { key: "reports", label: "Reports", href: "/dashboard/reports", group: "Insights" },
  { key: "findings", label: "Findings", href: "/dashboard/findings", group: "Insights" },
  { key: "portfolio", label: "Portfolio", href: "/dashboard/portfolio", group: "Insights" },
  { key: "settings", label: "Settings", href: "/dashboard/settings", group: "Manage" },
] as const;

export type StaffSectionKey = (typeof staffSections)[number]["key"];

export const staffSectionKeys: StaffSectionKey[] = staffSections.map((section) => section.key);

export const staffSectionGroups = [...new Set(staffSections.map((section) => section.group))].map((group) => ({
  group,
  sections: staffSections.filter((section) => section.group === group),
}));

export function isStaffSectionKey(value: unknown): value is StaffSectionKey {
  return typeof value === "string" && (staffSectionKeys as string[]).includes(value);
}

export function documentSection(type: string): StaffSectionKey | null {
  return type === "QUOTATION" ? "quotations" : type === "INVOICE" ? "invoices" : type === "RECEIPT" ? "receipts" : null;
}

export function firstAllowedHref(sections: readonly StaffSectionKey[]) {
  return staffSections.find((section) => sections.includes(section.key))?.href ?? null;
}
