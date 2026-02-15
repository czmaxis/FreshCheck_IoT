import axios from "axios";
import { emitLogout } from "./authEvents.js";

const attachedClients = new WeakSet();

function shouldLogout(error) {
  const status = error?.response?.status;
  if (status === 401) return true;

  // CORS may block 401 responses, surfacing them as network errors.
  // Treat a network error on an authenticated request as an expired token.
  if (
    !error.response &&
    error.config?.headers?.Authorization
  ) {
    return true;
  }

  return false;
}

export function setupAxiosAuth(client) {
  if (!client || attachedClients.has(client)) return;
  attachedClients.add(client);

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (shouldLogout(error)) {
        emitLogout("unauthorized");
      }
      return Promise.reject(error);
    },
  );
}

// Attach to default axios immediately
setupAxiosAuth(axios);
