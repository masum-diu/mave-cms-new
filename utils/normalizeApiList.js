/** Normalize list payloads from axios or custom fetch helpers. */
export const normalizeApiList = (payload) => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (typeof payload?.data === "object" && payload.data !== null) {
    const values = Object.values(payload.data);
    if (values.every((item) => item && typeof item === "object")) return values;
  }
  return [];
};

/** Unwrap axios response, raw array, or cached value. */
export const unwrapApiPayload = (result) => {
  if (result == null) return [];
  if (typeof result === "object" && "data" in result && "status" in result) {
    return normalizeApiList(result.data);
  }
  return normalizeApiList(result);
};
