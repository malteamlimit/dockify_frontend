import { useEffect, useState } from "react";

type RDKitModuleType = any;

export function useRDKit() {
  const [RDKit, setRDKit] = useState<RDKitModuleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadRDKit() {
      try {
        if (typeof window === "undefined") return;

        // Falls das Skript schon geladen ist – keine Duplikate
        if (!(window as any).initRDKitModule) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "/static/chunks/RDKit_minimal.js";
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () =>
              reject(new Error("RDKit_minimal.js konnte nicht geladen werden"));
            document.body.appendChild(script);
          });
        }

        const initRDKitModule = (window as any).initRDKitModule;
        if (!initRDKitModule) {
          throw new Error("RDKit initRDKitModule nicht gefunden");
        }

        const RDKitModule = await initRDKitModule({
          locateFile: () => "/static/chunks/RDKit_minimal.wasm",
        });

        setRDKit(RDKitModule);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadRDKit();
  }, []);

  return { RDKit, loading, error };
}