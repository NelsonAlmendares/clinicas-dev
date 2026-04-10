/**
 * Cliente ORDS: gestión del token OAuth2 client_credentials.
 *
 * El token NUNCA sale del servidor — se usa únicamente en API Routes
 * o en Server Components. No importar desde componentes cliente.
 */
import { ordsConfig } from "./config";

export async function getOrdsToken(): Promise<string> {
  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");

  const res = await fetch(ordsConfig.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: ordsConfig.basicAuth,
    },
    body,
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("[ORDS] Token request failed:", res.status, text);
    throw new Error(`ORDS token error: ${res.status}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("[ORDS] Token response is not valid JSON");
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !("access_token" in data) ||
    typeof (data as Record<string, unknown>).access_token !== "string"
  ) {
    throw new Error("[ORDS] Response does not contain access_token");
  }

  return (data as { access_token: string }).access_token;
}

/**
 * Headers de autorización para llamadas autenticadas a ORDS.
 * Obtiene un token fresco en cada llamada (ORDS tokens son de corta duración).
 */
export async function buildAuthHeaders(): Promise<Record<string, string>> {
  const token = await getOrdsToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
