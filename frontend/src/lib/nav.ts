import type { useRouter } from "next/navigation";

type Router = ReturnType<typeof useRouter>;

// Slide between pages via the View Transitions API; plain push where unsupported
// or when the user prefers reduced motion. `back` flips the slide direction.
export function navTo(router: Router, href: string, opts?: { back?: boolean }) {
  const go = () => router.push(href);
  const start = (document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  }).startViewTransition;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!start || reduced) {
    go();
    return;
  }
  document.documentElement.classList.toggle("nav-back", !!opts?.back);
  start.call(document, go).finished.finally(() =>
    document.documentElement.classList.remove("nav-back"),
  );
}
