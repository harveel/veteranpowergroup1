import { createStaffAccount, resetStaffPassword, setStaffStatus, updateCompanyProfile, updateStaffSections, updateWhatsappSettings } from "@/app/dashboard/actions";
import { isStaffAccessKey, staffAccessGroups, staffAccessKeys, staffAccessLabels, type StaffAccessKey } from "@/lib/staff-sections";
import { prisma } from "@/lib/prisma";
import { getStaffAccess, requireSectionAccess } from "@/lib/prototype-auth";
import { defaultWhatsappMessage, defaultWhatsappNumber } from "@/lib/whatsapp";

const whatsappMessages: Record<string, string> = {
  saved: "WhatsApp settings saved. The button on the website is updated.",
  invalid: "Enter a valid phone number, for example 0707 734 670 or +254 707 734 670.",
};

const staffMessages: Record<string, string> = {
  created: "Staff account created. Share its initial password securely.",
  exists: "An account already uses that email address.",
  invalid: "Check the account details and password length, and tick at least one section, then try again.",
  sections: "Staff section access updated. The change applies on their next page load.",
  updated: "Staff account access updated.",
  "password-reset": "Staff password reset. Share the new password securely.",
};

const profileMessages: Record<string, string> = {
  saved: "Company profile saved. Documents and the website use the new details.",
  invalid: "Check the company name, email, prefix (letters, numbers, dashes), tax rate (0–100) and validity days (1–365).",
};

function SectionCheckboxes({ selected, idPrefix }: { selected: readonly StaffAccessKey[]; idPrefix: string }) {
  return <fieldset className="staff-sections">
    <legend>Section access</legend>
    {staffAccessGroups.map(({ group, options }) => <div className="staff-section-group" key={group}>
      <span>{group}</span>
      {options.map((section) => <label className="checkbox-label" key={section.key} htmlFor={`${idPrefix}-${section.key}`}><input id={`${idPrefix}-${section.key}`} type="checkbox" name="sections" value={section.key} defaultChecked={selected.includes(section.key)} />{section.label}</label>)}
    </div>)}
  </fieldset>;
}

function sectionSummary(sectionAccess: string[]) {
  const access = sectionAccess.filter(isStaffAccessKey);
  if (access.length === staffAccessKeys.length) return "All sections";
  if (access.length === 0) return "No sections";
  return staffAccessLabels(access).join(", ");
}

export default async function SettingsPage({ searchParams }: PageProps<"/dashboard/settings">) {
  const session = await requireSectionAccess("settings");
  const params = await searchParams;
  const staffMessageKey = Array.isArray(params.staff) ? params.staff[0] : params.staff;
  const staffMessage = staffMessageKey ? staffMessages[staffMessageKey] : undefined;
  const whatsappKey = Array.isArray(params.whatsapp) ? params.whatsapp[0] : params.whatsapp;
  const whatsappFeedback = whatsappKey ? whatsappMessages[whatsappKey] : undefined;
  const access = await getStaffAccess(session.userId);
  const canManageStaff = access.isAdmin;
  const canEditProfile = access.sections.includes("company-profile");
  const profileKey = Array.isArray(params.profile) ? params.profile[0] : params.profile;
  const profileFeedback = profileKey ? profileMessages[profileKey] : undefined;
  const [company, staffUsers] = await Promise.all([
    prisma.companySettings.findUnique({ where: { id: 1 }, include: { profile: true, documents: true, websiteAppearance: true } }),
    canManageStaff ? prisma.user.findMany({
      where: { roles: { some: { role: { name: "Prototype staff" } } } },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, status: true, createdAt: true, sectionAccess: true },
    }) : Promise.resolve([]),
  ]);

  return <main className="dashboard-main">
    <header className="page-title"><div><p className="eyebrow">Manage</p><h1>Prototype settings</h1><p className="dashboard-note">These defaults are placeholders until the company requirements arrive.</p></div><span className="prototype-badge">Provisional</span></header>
    <section className="panel table-panel settings-panel">
      <div className="panel-heading"><div><p className="eyebrow">Company profile</p><h3>{company?.profile?.name ?? "Not configured"}</h3></div></div>
      {profileFeedback && <p className={`staff-feedback${profileKey === "invalid" ? " is-error" : ""}`} role="status">{profileFeedback}</p>}
      {canEditProfile ? <form action={updateCompanyProfile} className="prototype-form company-profile-form">
        <label>Company name<input name="name" defaultValue={company?.profile?.name ?? ""} minLength={2} maxLength={160} required /></label>
        <label>Email<input name="email" type="email" defaultValue={company?.profile?.email ?? ""} /></label>
        <label className="company-profile-wide">Address<input name="address" defaultValue={company?.profile?.address ?? ""} maxLength={300} /></label>
        <label>Phone<input name="phone" type="tel" defaultValue={company?.profile?.phone ?? ""} maxLength={40} /></label>
        <label>Quotation prefix<input name="quotePrefix" defaultValue={company?.documents?.quotePrefix ?? "QUO"} maxLength={10} pattern="[A-Za-z0-9-]+" required /></label>
        <label>Default tax rate (%)<input name="defaultTaxRate" type="number" min="0" max="100" step="0.01" defaultValue={company?.documents?.defaultTaxRate ?? 0} required /></label>
        <label>Quotation validity (days)<input name="quoteValidityDays" type="number" min="1" max="365" step="1" defaultValue={company?.documents?.quoteValidityDays ?? 30} required /></label>
        <p className="dashboard-note company-profile-wide">Currency: awaiting requirements. Changes apply to new documents and downloads.</p>
        <button className="dashboard-button" type="submit">Save company profile</button>
      </form> :       <dl className="settings-list"><div><dt>Address</dt><dd>{company?.profile?.address ?? "Not configured"}</dd></div><div><dt>Email</dt><dd>{company?.profile?.email ?? "Not configured"}</dd></div><div><dt>Phone</dt><dd>{company?.profile?.phone ?? "Not configured"}</dd></div><div><dt>Quotation prefix</dt><dd>{company?.documents?.quotePrefix ?? "Not configured"}</dd></div><div><dt>Default tax rate</dt><dd>{company?.documents?.defaultTaxRate ?? 0}%</dd></div><div><dt>Quotation validity</dt><dd>{company?.documents?.quoteValidityDays ?? "Not configured"} days</dd></div><div><dt>Currency</dt><dd>Awaiting requirements</dd></div></dl>}
    </section>

    {canManageStaff && <section className="panel table-panel">
      <div className="panel-heading"><div><p className="eyebrow">Website</p><h3>WhatsApp button</h3><p className="dashboard-note">A floating button on the public website opens WhatsApp to this number with the preset message. Leave the number empty to hide the button.</p></div><span className="prototype-badge">Administrator</span></div>
      {whatsappFeedback && <p className={`staff-feedback${whatsappKey === "invalid" ? " is-error" : ""}`} role="status">{whatsappFeedback}</p>}
      <form action={updateWhatsappSettings} className="prototype-form whatsapp-settings-form">
        <label>WhatsApp number<input name="number" type="tel" inputMode="tel" maxLength={40} defaultValue={company?.profile?.whatsappNumber ? `+${company.profile.whatsappNumber}` : `+${defaultWhatsappNumber}`} placeholder="+254 707 734 670" /><span>Numbers starting with 0 are treated as Kenyan (+254). Leave the published default in place to use +254 707 734 670.</span></label>
        <label className="whatsapp-message-field">Preset message<textarea name="message" maxLength={500} defaultValue={company?.profile?.whatsappMessage ?? defaultWhatsappMessage} /></label>
        <button className="dashboard-button" type="submit">Save WhatsApp settings</button>
      </form>
    </section>}

    {canManageStaff && <section className="panel table-panel staff-management">
      <div className="panel-heading"><div><p className="eyebrow">Access</p><h3>Staff accounts</h3><p className="dashboard-note">Create individual sign-ins, choose which portal sections each person can use, reset passwords, or disable access.</p></div><span className="prototype-badge">Administrator</span></div>
      {staffMessage && <p className={`staff-feedback${staffMessageKey === "invalid" || staffMessageKey === "exists" ? " is-error" : ""}`} role="status">{staffMessage}</p>}
      <form action={createStaffAccount} className="prototype-form staff-create-form">
        <label>Staff name<input name="name" autoComplete="name" minLength={2} maxLength={120} required /></label>
        <label>Work email<input name="email" type="email" autoComplete="email" required /></label>
        <label>Temporary password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /><span>At least 12 characters. Share it with the staff member securely.</span></label>
        <SectionCheckboxes selected={[]} idPrefix="new-staff" />
        <button className="dashboard-button" type="submit">Create staff account</button>
      </form>

      <div className="table-scroll staff-table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Created</th><th>Sections</th><th>Access</th><th>Password</th></tr></thead><tbody>
        {staffUsers.length === 0 ? <tr><td colSpan={7}>No staff accounts have been created.</td></tr> : staffUsers.map((staff) => <tr key={staff.id}>
          <td>{staff.name}</td><td>{staff.email}</td><td><span className={`account-status ${staff.status === "ACTIVE" ? "is-active" : "is-disabled"}`}>{staff.status === "ACTIVE" ? "Active" : "Disabled"}</span></td><td>{staff.createdAt.toLocaleDateString("en")}</td>
          <td><details className="staff-sections-edit"><summary>{sectionSummary(staff.sectionAccess)}</summary><form action={updateStaffSections}><input type="hidden" name="userId" value={staff.id} /><SectionCheckboxes selected={staff.sectionAccess.filter(isStaffAccessKey)} idPrefix={`staff-${staff.id}`} /><button className="staff-action" type="submit">Save sections</button></form></details></td>
          <td><form action={setStaffStatus}><input type="hidden" name="userId" value={staff.id} /><input type="hidden" name="status" value={staff.status === "ACTIVE" ? "DISABLED" : "ACTIVE"} /><button className="staff-action" type="submit">{staff.status === "ACTIVE" ? "Disable" : "Enable"}</button></form></td>
          <td><details className="reset-password"><summary>Reset</summary><form action={resetStaffPassword}><input type="hidden" name="userId" value={staff.id} /><label className="sr-only" htmlFor={`password-${staff.id}`}>New password for {staff.name}</label><input id={`password-${staff.id}`} name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} placeholder="12+ characters" required /><button className="staff-action" type="submit">Set password</button></form></details></td>
        </tr>)}
      </tbody></table></div>
      <p className="dashboard-note staff-security-note">Disabled accounts lose access immediately. The administrator account configured in .env is managed separately and cannot be disabled here.</p>
    </section>}
  </main>;
}
