const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });

  if (res.status === 204) return null;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && body.message) ? body.message :
      (typeof body === "string" && body.trim()) ? body :
      `Request failed: ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

export const listPins = (mapId) =>
  request(`/api/maps/${mapId}/pins`);

export const createPin = (mapId, payload) =>
  request(`/api/maps/${mapId}/pins`, { method: "POST", body: JSON.stringify(payload) });

export const patchPin = (pinId, payload) =>
  request(`/api/pins/${pinId}`, { method: "PATCH", body: JSON.stringify(payload) });

export const waterPin = (pinId) =>
  request(`/api/pins/${pinId}/water`, { method: "POST" });

export const deletePin = (pinId) =>
  request(`/api/pins/${pinId}`, { method: "DELETE" });
