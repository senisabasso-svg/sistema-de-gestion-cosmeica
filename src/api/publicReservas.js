const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiError extends Error {
  constructor(message, status, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const ensureBaseUrl = () => {
  if (!API_BASE_URL) {
    throw new ApiError("Falta configurar VITE_API_BASE_URL en el frontend.");
  }
  return API_BASE_URL.replace(/\/+$/, "");
};

const buildUrl = (path, searchParams = {}) => {
  const url = new URL(`${ensureBaseUrl()}${path}`);
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

/** Junta mensajes tipicos de validacion (.NET, express, etc.) */
const collectPayloadStrings = (payload) => {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const out = [];
  const push = (v) => {
    if (typeof v === "string" && v.trim()) out.push(v.trim());
  };

  [
    payload.message,
    payload.error,
    payload.detail,
    payload.title,
    payload.mensaje,
    payload.description,
  ].forEach(push);

  if (Array.isArray(payload.errors)) {
    for (const entry of payload.errors) {
      if (typeof entry === "string") push(entry);
      else if (entry && typeof entry === "object") push(entry.message || entry.msg || entry.description);
    }
  }

  if (payload.errors && typeof payload.errors === "object" && !Array.isArray(payload.errors)) {
    for (const value of Object.values(payload.errors)) {
      if (Array.isArray(value)) value.forEach((v) => push(typeof v === "string" ? v : String(v)));
      else push(String(value));
    }
  }

  return out;
};

const pickPayloadMessage = (payload) => {
  const parts = collectPayloadStrings(payload);
  return parts.length > 0 ? parts.join(" ") : "";
};

/**
 * Mensaje orientado al usuario para respuestas de error del API publico.
 * 400: validacion / fecha; 404: inactivo; 409: ocupado; 500: servidor.
 */
export const messageForPublicApiError = (status, payload) => {
  const fromApi = pickPayloadMessage(payload);

  const debugTime =
    import.meta.env.DEV && payload && (payload.fechaInterpretadaUTC || payload.horaServidorUTC)
      ? `\n[dev] fechaInterpretadaUTC: ${payload.fechaInterpretadaUTC ?? "—"} | horaServidorUTC: ${payload.horaServidorUTC ?? "—"}`
      : "";

  switch (status) {
    case 400:
      return (
        (fromApi ||
          "Los datos no son validos. Revisa la fecha (debe ser futura respecto al servidor) y que el horario sea exactamente el del slot elegido.") + debugTime
      );
    case 404:
      return fromApi || "La peluqueria no existe o no esta activa, o el recurso ya no esta disponible.";
    case 409:
      return fromApi || "Ese mismo horario ya tiene un turno. Elegi otro instante de la lista.";
    case 500:
      return fromApi || "Error del servidor. Intenta mas tarde; si persiste, avisa al salon.";
    default:
      return fromApi || `No se pudo completar la operacion (codigo ${status}).`;
  }
};

const requestJson = async (url, options = {}) => {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new ApiError("No se pudo conectar con el backend. Revisa red y servidor.");
  }

  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    const message = messageForPublicApiError(response.status, payload);
    throw new ApiError(message, response.status, payload);
  }

  return payload;
};

export const fetchPeluqueriasActivas = async () => {
  const primaryUrl = buildUrl("/api/public/peluquerias-disponibles");
  try {
    return await requestJson(primaryUrl);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) {
      throw error;
    }
    const fallbackUrl = buildUrl("/api/public/peluquerias");
    return requestJson(fallbackUrl);
  }
};

export const fetchDisponibilidad = async ({ idPeluqueria, fecha, slotMinutes = 30 }) => {
  if (!idPeluqueria || !fecha) {
    throw new ApiError("Faltan datos para consultar disponibilidad.");
  }

  const url = buildUrl(`/api/public/peluquerias/${idPeluqueria}/disponibilidad`, {
    fecha,
    slotMinutes,
  });

  return requestJson(url);
};

/**
 * POST /api/public/reservas — Content-Type application/json (Accept application/json).
 * Cuerpo alineado con el backend público:
 * @param {{
 *   idPeluqueria: number,
 *   fechaHora: string,
 *   nombreCliente: string,
 *   telefonoCliente: string,
 *   emailCliente?: string,
 *   notas?: string,
 * }} payload
 */
export const crearReservaPublica = async ({
  idPeluqueria,
  fechaHora,
  nombreCliente,
  telefonoCliente,
  emailCliente = "",
  notas = "",
}) => {
  const url = buildUrl("/api/public/reservas");
  const body = {
    idPeluqueria: Number(idPeluqueria),
    fechaHora,
    nombreCliente,
    telefonoCliente,
    emailCliente,
    notas,
  };
  return requestJson(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

export { ApiError };
