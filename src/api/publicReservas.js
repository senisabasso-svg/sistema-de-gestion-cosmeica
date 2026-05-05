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

const requestJson = async (url, options = {}) => {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw new ApiError("No se pudo conectar con el backend. Revisa red y servidor.");
  }

  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    const message = payload?.message || payload?.error || `Error HTTP ${response.status}`;
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

export const crearReservaPublica = async (payload) => {
  const url = buildUrl("/api/public/reservas");
  return requestJson(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
};

export { ApiError };
