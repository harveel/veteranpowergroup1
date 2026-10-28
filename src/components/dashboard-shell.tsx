import Link from "next/link";
import { logout } from "@/app/login/actions";
import { CompanyBrand } from "@/components/company-brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { Suspense } from "react";
import { AccessDeniedNotice } from "@/components/access-denied-notice";
import { publicSiteUrl } from "@/lib/surface-urls";
import { firstAllowedHref, staffSectionGroups, type StaffAccessKey } from "@/lib/staff-sections";

export function DashboardShell({ children, staff, sections }: { children: React.ReactNode; staff: { name: string; email: string }; sections: StaffAccessKey[] }) {
  const navGroups = staffSectionGroups
    .map(({ group, sections: groupSections }) => [group, groupSections.filter((section) => sections.includes(section.key)).map((section) => [section.label, section.href])] as const)
    .filter(([, items]) => items.length > 0);
  const homeHref = firstAllowedHref(sections) ?? "/dashboard";
  const canDownloadAll = sections.includes("reports");
  const initials = staff.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link className="brand dashboard-brand" href={homeHref} aria-label="Veteran staff portal"><CompanyBrand /></Link>
        <div className="workspace-switcher"><span className="workspace-dot" /> Veteran staff workspace</div>
        <nav className="dashboard-nav" aria-label="Staff navigation">
          {navGroups.map(([group, items]) => <div className="nav-group" key={group}>
            <span className="nav-group-title">{group}</span>
            {items.map(([label, href]) => <Link className="dashboard-nav-link" href={href} key={href}><span className="nav-icon" />{label}</Link>)}
          </div>)}
        </nav>
        <div className="sidebar-bottom">
          <ThemeToggle />
          {canDownloadAll && <a className="sidebar-download-all" href="/api/exports/all">↓ Download all data</a>}
          <a href={publicSiteUrl}>← View public site</a>
          <form action={logout}><button className="sidebar-logout" type="submit">Sign out</button></form>
          <div className="user-chip"><span className="avatar">{initials}</span><span><b>{staff.name}</b><small>{staff.email}</small></span></div>
        </div>
      </aside>
      <nav className="mobile-dashboard-nav" aria-label="Staff navigation">
        {navGroups.flatMap(([, items]) => items).map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        {canDownloadAll && <a href="/api/exports/all">Download all</a>}
        <ThemeToggle />
        <form action={logout}><button type="submit">Sign out</button></form>
      </nav>
      <div className="dashboard-content"><Suspense fallback={null}><AccessDeniedNotice /></Suspense>{children}</div>
    </div>
  );
}
