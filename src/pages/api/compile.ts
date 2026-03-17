import type { APIContext } from "astro";
import { requireCloudflareAccess, type EnvLike } from "../../lib/cloudflare_access";

export const prerender = false;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function requiredEnv(env: EnvLike, name: string): string {
  const value = (env[name] || "").trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function resolveEnv(context: APIContext): EnvLike {
  const localsEnv = (context.locals as any)?.runtime?.env;
  if (localsEnv && typeof localsEnv === "object") return localsEnv as EnvLike;
  const nodeEnv = (globalThis as any)?.process?.env;
  if (nodeEnv && typeof nodeEnv === "object") return nodeEnv as EnvLike;
  return {};
}

export async function POST(context: APIContext) {
  try {
    const { request } = context;
    const env = resolveEnv(context);
    const identity = await requireCloudflareAccess(request, env);

    const owner = requiredEnv(env, "GITHUB_OWNER");
    const repo = requiredEnv(env, "GITHUB_REPO");
    const workflowId = (env.GITHUB_WORKFLOW_ID || "compile-post.yml").trim();
    const ref = (env.GITHUB_REF || "main").trim();
    const token = requiredEnv(env, "GITHUB_DISPATCH_TOKEN");

    const body = await request.json().catch(() => null);
    const docId = body?.docId;
    const tabId = body?.tabId;
    const debug = body?.debug === true || body?.debug === 1 || body?.debug === "1";

    if (!docId || typeof docId !== "string") return json(400, { ok: false, error: "Missing docId" });
    if (!tabId || typeof tabId !== "string") return json(400, { ok: false, error: "Missing tabId" });

    const ghResp = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(workflowId)}/dispatches`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          accept: "application/vnd.github+json",
          "content-type": "application/json",
          "x-github-api-version": "2022-11-28",
          "user-agent": "astro-compile-endpoint",
        },
        body: JSON.stringify({
          ref,
          inputs: {
            doc_id: docId,
            tab_id: tabId,
            debug: debug ? "1" : "0",
            requested_by: identity.email || identity.sub || "unknown",
          },
        }),
      },
    );

    if (!ghResp.ok) {
      const text = await ghResp.text().catch(() => "");
      return json(ghResp.status, {
        ok: false,
        error: "GitHub workflow dispatch failed",
        details: text || ghResp.statusText,
      });
    }

    return json(202, { ok: true, message: "Dispatch queued" });
  } catch (err) {
    return json(500, { ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}
