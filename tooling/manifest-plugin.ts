// Emits manifest.json into the build output from a typed manifest function.
// Generic: knows nothing about the extension beyond "a function that returns a manifest".
// `build` runs on every bundle and `watchFiles` are registered with Rollup, so in
// watch mode a bumped package.json re-emits the manifest instead of keeping the
// version the config was loaded with.
import type { Plugin } from "vite";

export function manifestPlugin(build: () => object, watchFiles: string[] = []): Plugin {
  return {
    name: "extension:manifest",
    buildStart() {
      for (const file of watchFiles) {
        this.addWatchFile(file);
      }
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: `${JSON.stringify(build(), null, 2)}\n`,
      });
    },
  };
}
