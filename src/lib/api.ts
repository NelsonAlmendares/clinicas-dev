/**
 * Wrapper de fetch tipado para llamadas desde el cliente al API interno.
 *
 * Lanza ApiError con información de diagnóstico cuando la respuesta no es ok.
 * Usar solo para llamadas a /api/... desde componentes cliente.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;
  readonly method: string;
  readonly detail: unknown;

  constructor(
    message: string,
    opts: { status: number; url: string; method: string; detail?: unknown }
  ) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.url = opts.url;
    this.method = opts.method;
    this.detail = opts.detail;
  }
}

export async function apiFetch<T = unknown>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const method = init?.method ?? "GET";

  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const raw = await res.text();
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : undefined;
  } catch {
    parsed = raw;
  }

  if (!res.ok) {
    const message =
      typeof parsed === "object" &&
      parsed !== null &&
      "message" in parsed &&
      typeof (parsed as Record<string, unknown>).message === "string"
        ? (parsed as { message: string }).message
        : `HTTP ${res.status} ${res.statusText}`;

    throw new ApiError(message, {
      status: res.status,
      url: input,
      method,
      detail: parsed,
    });
  }

  return parsed as T;
}
