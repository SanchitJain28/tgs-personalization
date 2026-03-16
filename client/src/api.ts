const BASE = import.meta.env.VITE_API_BASE_URL;
const SECRET = import.meta.env.VITE_CONFIG_SECRET;

const headers = {
  "Content-Type": "application/json",
  "x-config-secret": SECRET,
};

export async function checkAuthStatus() {
  const res = await fetch(`${BASE}/auth/status`);
  return res.json();
}

export async function getProducts() {
  const res = await fetch(`${BASE}/api/products`, { headers });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getProductConfig(id : any) {
  const res = await fetch(`${BASE}/api/product/${id}/config`, { headers });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveProductConfig(id : any, payload : any) {
  const res = await fetch(`${BASE}/api/product/${id}/config`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export const AUTH_URL = `${BASE}/auth`;
