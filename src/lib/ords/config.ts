/**
 * Configuración centralizada de Oracle ORDS.
 *
 * Falla con un mensaje claro si faltan variables de entorno, evitando
 * errores silenciosos en runtime.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[ORDS Config] Variable de entorno requerida "${key}" no está definida.\n` +
        `Revisa tu .env.local. Consulta .env.example para referencia.`
    );
  }
  return value;
}

export const ordsConfig = {
  get tokenUrl() {
    return (
      process.env.ORDS_TOKEN_URL ??
      "https://g0575431ea754e6-clinicas.adb.us-ashburn-1.oraclecloudapps.com/ords/admin/oauth/token"
    );
  },
  get basicAuth() {
    return requireEnv("ORDS_BASIC_AUTH");
  },
  get baseUrl() {
    const val = process.env.ORDS_BASE_URL;
    console.log("[ORDS config] ORDS_BASE_URL =", val);
    return requireEnv("ORDS_BASE_URL");
  },
  get module() {
    return process.env.ORDS_MODULE ?? "api";
  },
  endpoint(path: string): string {
    const base = this.baseUrl.replace(/\/$/, "");
    const mod = this.module.replace(/^\/|\/$/g, "");
    const p = path.replace(/^\//, "");
    return `${base}/${mod}/${p}`;
  },
};
