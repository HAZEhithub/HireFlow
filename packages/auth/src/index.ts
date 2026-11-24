import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { deliverAuthEmail, resolveAuthSecret } from "@hireflow/config";
import { ensureUserWorkspace, getDb, schema } from "@hireflow/db";

const webOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const marketingOrigin = process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3002";
const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function createAuth() {
  const db = await getDb();
  return betterAuth({
    secret: resolveAuthSecret(),
    baseURL: process.env.BETTER_AUTH_URL ?? webOrigin,
    trustedOrigins: [webOrigin, marketingOrigin, apiOrigin],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      sendResetPassword: async ({ user, url }) => {
        await deliverAuthEmail({ kind: "reset", to: user.email, url });
      },
    },
    emailVerification: {
      sendOnSignUp: Boolean(process.env.RESEND_API_KEY),
      sendVerificationEmail: async ({ user, url }) => {
        await deliverAuthEmail({ kind: "verify", to: user.email, url });
      },
    },
    socialProviders:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            },
          }
        : undefined,
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      // Cookie cache would keep a signed session readable after DB revocation.
      cookieCache: { enabled: false },
    },
    advanced: {
      defaultCookieAttributes: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await ensureUserWorkspace(db, user.id);
          },
        },
      },
    },
  });
}

type AuthInstance = Awaited<ReturnType<typeof createAuth>>;

let instance: AuthInstance | undefined;
let pending: Promise<AuthInstance> | undefined;

export async function getAuth(): Promise<AuthInstance> {
  if (instance) return instance;
  pending ??= createAuth().then((auth) => {
    instance = auth;
    return auth;
  });
  return pending;
}

export async function getSession(headers: Headers) {
  const auth = await getAuth();
  return auth.api.getSession({ headers });
}

export async function revokeSession(headers: Headers) {
  const auth = await getAuth();
  return auth.api.signOut({ headers });
}
