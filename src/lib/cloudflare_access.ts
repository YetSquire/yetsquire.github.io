import { createRemoteJWKSet, jwtVerify } from "jose";

export type CloudflareAccessIdentity = {
  sub?: string;
  email?: string;
};

export type EnvLike = Record<string, string | undefined>;

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getTeamDomain(env: EnvLike): string | null {
  const raw = (env.CF_ACCESS_TEAM_DOMAIN || "").trim();
  if (!raw) return null;
  return raw.replace(/^https:\/\//, "").replace(/\/+$/, "");
}

function getAudience(env: EnvLike): string | null {
  const raw = (env.CF_ACCESS_AUD || "").trim();
  return raw || null;
}

function getIssuer(teamDomain: string): string {
  return `https://${teamDomain}`;
}

function getJwks(teamDomain: string) {
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`https://${teamDomain}/cdn-cgi/access/certs`),
    );
  }
  return jwks;
}

export async function requireCloudflareAccess(
  request: Request,
  env: EnvLike,
): Promise<CloudflareAccessIdentity> {
  const bypass = (env.BYPASS_ACCESS || "").trim() === "1";
  const enforce =
    (env.ENFORCE_ACCESS || "").trim() === "1" ||
    (env.NODE_ENV || "") === "production";

  const teamDomain = getTeamDomain(env);
  const audience = getAudience(env);

  if (!teamDomain || !audience) {
    if (enforce && !bypass) {
      throw new Error(
        "Cloudflare Access not configured. Set CF_ACCESS_TEAM_DOMAIN and CF_ACCESS_AUD.",
      );
    }
    return {};
  }

  if (bypass) return {};

  const token =
    request.headers.get("cf-access-jwt-assertion") ||
    request.headers.get("Cf-Access-Jwt-Assertion");

  if (!token) throw new Error("Missing Cf-Access-Jwt-Assertion header.");

  const { payload } = await jwtVerify(token, getJwks(teamDomain), {
    audience,
    issuer: getIssuer(teamDomain),
  });

  return {
    sub: typeof payload.sub === "string" ? payload.sub : undefined,
    email: typeof (payload as any).email === "string" ? (payload as any).email : undefined,
  };
}
