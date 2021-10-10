import { ListenerState } from "../types";

export const createListenerState = (): ListenerState => ({
  id: String(Math.random()),
  map: new Map(),
});
