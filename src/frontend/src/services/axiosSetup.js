import axios from "axios";
import { emitLogout } from "./authEvents.js";

const attachedClients = new WeakSet();

function shouldLogout(error) {
  const status = error?.response?.status;
  return status === 401 || status === 403;
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
