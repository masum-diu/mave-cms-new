const STORAGE_KEY = "mave_user_temp_passwords";

const readStore = () => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch (_) {
    return {};
  }
};

const writeStore = (store) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (_) {}
};

/** Save plaintext password right after Add User (session only). */
export const rememberCreatedUserPassword = (userKey, password) => {
  if (!userKey || !password) return;
  const store = readStore();
  store[String(userKey)] = {
    password: String(password),
    at: Date.now(),
  };
  writeStore(store);
};

/** Read password shown in User Details if we still have it from create. */
export const getRememberedUserPassword = (user) => {
  if (!user) return null;
  const store = readStore();
  const byId = user.id != null ? store[String(user.id)] : null;
  const byEmail = user.email ? store[String(user.email).toLowerCase()] : null;
  return byId?.password || byEmail?.password || null;
};

export const forgetRememberedUserPassword = (userKey) => {
  if (!userKey) return;
  const store = readStore();
  delete store[String(userKey)];
  writeStore(store);
};
