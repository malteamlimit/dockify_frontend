'use client'

// @ts-expect-error due to missing types for ketcher
import {StandaloneStructServiceProvider} from "ketcher-standalone";
import {Editor} from "ketcher-react";
import {Ketcher} from "ketcher-core";
import * as React from "react";

import 'ketcher-react/dist/index.css';
import { useDockingStore } from "@/store/docking-store";

const structServiceProvider = new StandaloneStructServiceProvider()

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error(error, info);
    }
  }
  render() {
    if (this.state.hasError) {
      return process.env.NODE_ENV === "production"
        ? null
        : <div>Ketcher could not be started :(</div>;
    }
    return this.props.children;
  }
}

function KetcherFrame() {
    const ketcherRef = React.useRef<Ketcher | null>(null);
    const { setCurrentSmiles, setCurrentSdf, getCurrentJob, runPropertiesCalculation } = useDockingStore()
    const [isInternalUpdate, setIsInternalUpdate] = React.useState(false);
    const lastSmiles = React.useRef<string | null>(null);
    const currentJob = getCurrentJob()


    const updateMoleculeData = React.useCallback(async () => {
      if (ketcherRef.current && !isInternalUpdate) {
          try {
          const smiles = await ketcherRef.current.getSmiles()
          if (smiles !== lastSmiles.current) {
                lastSmiles.current = smiles;
                setCurrentSdf(null)
                setCurrentSmiles(smiles)
                runPropertiesCalculation()
          }
        } catch (error) {
          console.error("Failed to export molecule:", error)
        }
      }
    }, [isInternalUpdate, runPropertiesCalculation, setCurrentSdf, setCurrentSmiles])

    const handleOnInit = React.useCallback((ketcher: Ketcher) => {
      ketcherRef.current = ketcher
      // @ts-expect-error ketcher is not defined in window
      window.ketcher = ketcher

      if (currentJob) {
        setIsInternalUpdate(true);
        ketcher.setMolecule(currentJob.smiles).then(() => {
            lastSmiles.current = currentJob.smiles;
            setIsInternalUpdate(false);
        })
      }

      ketcher.editor.subscribe('change', updateMoleculeData)
    }, [currentJob, updateMoleculeData])

    React.useEffect(() => {
      if (!ketcherRef.current || !currentJob) return;


      ketcherRef.current.getSmiles().then(currentKetcherSmiles => {
        if (currentKetcherSmiles === currentJob.smiles) {
          console.log("Ketcher molecule is already up-to-date.");
          return;
        }

        setIsInternalUpdate(true);
        ketcherRef.current!.setMolecule(currentJob.smiles)
          .then(() => {
            lastSmiles.current = currentJob.smiles;
            setIsInternalUpdate(false);
          })
          .catch(err => {
            console.error("Error setting molecule:", err);
            setIsInternalUpdate(false);
          });
      });
    }, [currentJob]);


    return (
      <ErrorBoundary>
          <div className="h-full w-full overflow-hidden rounded-xl border-2">
              <Editor
              staticResourcesUrl={process.env.PUBLIC_URL!}
              structServiceProvider={structServiceProvider}
              onInit={handleOnInit}
              errorHandler={message => {
                  if (process.env.NODE_ENV !== "production") {
                      throw new Error(message);
                  }
              }}
          />
          </div>
      </ErrorBoundary>
    )
}

export default KetcherFrame