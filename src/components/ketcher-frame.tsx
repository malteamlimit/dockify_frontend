'use client'

import {Ketcher, StructServiceProvider} from "ketcher-core";
import { Editor, InfoModal } from "ketcher-react";
import { StandaloneStructServiceProvider } from "ketcher-standalone";
import * as React from "react";

import 'ketcher-react/dist/index.css';
import { useDockingStore } from "@/store/docking-store";

const structServiceProvider = new StandaloneStructServiceProvider() as StructServiceProvider;

function KetcherFrame() {
    const ketcherRef = React.useRef<Ketcher | null>(null);
    const isLoadingRef = React.useRef(false);
    const currentLoadingJobIdRef = React.useRef<string | null>(null);

    const [hasError, setHasError] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [isLocked, setIsLocked] = React.useState(true);
    const scrollPositionRef = React.useRef(0);

    const currentJobId = useDockingStore((state) => state.currentJobId);

    // loading molecule when currentJobId changes
    React.useEffect(() => {
      if (!ketcherRef.current || !currentJobId) return;

      const smiles = useDockingStore.getState().getCurrentJob()?.smiles;
      const status = useDockingStore.getState().getCurrentJob()?.job_status;
      if (!smiles) return;
      if (status !== 'draft') return;

      isLoadingRef.current = true;
      currentLoadingJobIdRef.current = currentJobId;

      ketcherRef.current.setMolecule(smiles)
        .then(() => {
          if (currentLoadingJobIdRef.current === currentJobId) {
            isLoadingRef.current = false;
          }
        })
        .catch(err => {
          console.error('Failed to load molecule:', err);
          isLoadingRef.current = false;
        });

    }, [currentJobId]);

    // first init on component mount
    const handleOnInit = React.useCallback((ketcher: Ketcher) => {
      window.ketcher = ketcher;
      ketcherRef.current = ketcher;

      const job = useDockingStore.getState().getCurrentJob();
      if (job?.smiles) {
        isLoadingRef.current = true;
        currentLoadingJobIdRef.current = job.job_id;

        ketcher.setMolecule(job.smiles)
          .then(() => {
            isLoadingRef.current = false;
          })
          .catch(err => {
            console.error('Failed to load molecule:', err);
            isLoadingRef.current = false;
          });
      }

      // subscription to change in Ketcher editor and update
      ketcher.editor.subscribe('change', () => {
        if (isLoadingRef.current) return;

        const { setCurrentSdf, setCurrentSmiles, runPropertiesCalculation } = useDockingStore.getState();

        ketcher.getSmiles().then(smiles => {
          setCurrentSdf(null);
          setCurrentSmiles(smiles);
          runPropertiesCalculation().catch(err => {
            console.error('Failed to load molecule:', err);
          });
        }).catch(console.error);
      });

      // workaround to prevent scroll jump on ketcher init
      setTimeout(() => setIsLocked(false), 100);
    }, []);

    // workaround to prevent scroll jump on ketcher init
    React.useEffect(() => {
      scrollPositionRef.current = window.scrollY;
    }, []);

    // workaround to prevent scroll jump on ketcher init
    React.useEffect(() => {
      if (!isLocked) return;

      const preventScroll = (e: Event) => {
        e.preventDefault();
        window.scrollTo(0, scrollPositionRef.current);
      };

      window.addEventListener('scroll', preventScroll, { passive: false });

      return () => {
        window.removeEventListener('scroll', preventScroll);
      };
    }, [isLocked]);

    return (
      <>
          <div className="h-full w-full">
            <Editor
              staticResourcesUrl={process.env.PUBLIC_URL!}
              structServiceProvider={structServiceProvider}

              errorHandler={(message: string) => {
                setHasError(true);
                setErrorMessage(message.toString());
              }}

              onInit={handleOnInit}
            />
          </div>
          {hasError && (
            <InfoModal
              message={errorMessage}
              close={() => {
                setHasError(false);

                const cliparea: HTMLElement | null =
                  document.querySelector('.cliparea');
                cliparea?.focus();
              }}
            />
          )}
      </>
    )
}

export default KetcherFrame