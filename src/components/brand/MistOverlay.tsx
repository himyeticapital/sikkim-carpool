/**
 * Web fallback for the Skia mist shader (see MistOverlay.native.tsx):
 * MountainBackdrop's own static gradient already carries the haze on web,
 * so this renders nothing rather than shipping CanvasKit to the browser.
 */
export function MistOverlay(_props: { height?: number }) {
  return null;
}

export default MistOverlay;
