-- AlterTable
ALTER TABLE "User" ADD COLUMN "sectionAccess" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Existing staff accounts keep access to every portal section.
UPDATE "User" SET "sectionAccess" = ARRAY['dashboard', 'customers', 'prospects', 'quotations', 'invoices', 'receipts', 'payment-plans', 'analytics', 'reports', 'findings', 'portfolio', 'settings']::TEXT[];
