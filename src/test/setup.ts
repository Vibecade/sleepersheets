import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// React Testing Library mounts into a shared DOM container; clean up between
// tests so assertions don't bleed into the next case.
afterEach(() => {
  cleanup();
});
