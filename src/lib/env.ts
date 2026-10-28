import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

// Local development falls back to placeholder values; production must configure every variable explicitly.
const developmentDefaults = {
  DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5433/veteranpowergroup",
  PROTOTYPE_ADMIN_EMAIL: "admin@veteranpowergroup.local",
  PROTOTYPE_ADMIN_PASSWORD: "change-me-please",
  PROTOTYPE_SESSION_SECRET: "development-session-secret-change-me-please",
};

const withDevelopmentDefault = (key: keyof typeof developmentDefaults) =>
  process.env[key] ?? (isProduction ? undefined : developmentDefaults[key]);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is required" })
    .min(1, "DATABASE_URL is required")
    .refine((value) => /^postgres(ql)?:\/\//.test(value), {
      message: "DATABASE_URL must be a PostgreSQL connection string",
    }),
  PROTOTYPE_ADMIN_EMAIL: z.string({ error: "PROTOTYPE_ADMIN_EMAIL is required" }).email(),
  PROTOTYPE_ADMIN_PASSWORD: z.string({ error: "PROTOTYPE_ADMIN_PASSWORD is required" }).min(8),
  PROTOTYPE_SESSION_SECRET: z.string({ error: "PROTOTYPE_SESSION_SECRET is required" }).min(32),
}).superRefine((value, context) => {
  if (value.PROTOTYPE_SESSION_SECRET.startsWith("replace-with-")) {
    context.addIssue({ code: "custom", path: ["PROTOTYPE_SESSION_SECRET"], message: "Set a unique session secret" });
  }
  if (isProduction) {
    if (value.PROTOTYPE_ADMIN_PASSWORD === developmentDefaults.PROTOTYPE_ADMIN_PASSWORD) {
      context.addIssue({ code: "custom", path: ["PROTOTYPE_ADMIN_PASSWORD"], message: "Set a private administrator password" });
    }
    if (value.PROTOTYPE_SESSION_SECRET === developmentDefaults.PROTOTYPE_SESSION_SECRET) {
      context.addIssue({ code: "custom", path: ["PROTOTYPE_SESSION_SECRET"], message: "Set a unique session secret" });
    }
  }
});

export const env = envSchema.parse({
  ...process.env,
  DATABASE_URL: withDevelopmentDefault("DATABASE_URL"),
  PROTOTYPE_ADMIN_EMAIL: withDevelopmentDefault("PROTOTYPE_ADMIN_EMAIL"),
  PROTOTYPE_ADMIN_PASSWORD: withDevelopmentDefault("PROTOTYPE_ADMIN_PASSWORD"),
  PROTOTYPE_SESSION_SECRET: withDevelopmentDefault("PROTOTYPE_SESSION_SECRET"),
});
