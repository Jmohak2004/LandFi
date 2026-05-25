import { createXRStore } from '@react-three/xr';

export const xrStore = createXRStore({
  controller: true,
  hand: false,
  gaze: true,
  transientPointer: true,
});
