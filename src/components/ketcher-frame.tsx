'use client'

import {Ketcher, StructServiceProvider} from "ketcher-core";
import { Editor, InfoModal } from "ketcher-react";
import { StandaloneStructServiceProvider } from "ketcher-standalone";
import * as React from "react";

import { useDockingStore } from "@/store/docking-store";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import 'ketcher-react/dist/index.css';

const structServiceProvider = new StandaloneStructServiceProvider() as StructServiceProvider;

function KetcherFrame() {
    const ketcherRef = React.useRef<Ketcher | null>(null);
    // isLoadingRef to prevent triggering change event while loading molecule (happens on switching fast between jobs)
    const isLoadingRef = React.useRef(false);
    const currentLoadingJobIdRef = React.useRef<string | null>(null);

    const [hasError, setHasError] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [isLocked, setIsLocked] = React.useState(true);
    const scrollPositionRef = React.useRef(0);

    const currentJobId = useDockingStore((state) => state.currentJobId);
    const currentJobQED = useDockingStore((state) => state.getCurrentJob()?.qed);
    const currentJobIsSub = useDockingStore((state) => state.getCurrentJob()?.is_sub);

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

    // custom hook for showing warning/error toasts based on a condition like qed or is_sub
    // TODO: outsource condition checking, fetch them from settings, use the same conditions for app-header.tsx / button-run-docking.tsx
    function usePersistentToast(
      condition: boolean,
      header: string,
      description: string,
      type: 'warning' | 'error' = 'warning'
    ) {
      const toastIdRef = React.useRef<string | number | null>(null);
      const optionsRef = React.useRef({ header, description, type });

      optionsRef.current = { header, description, type };

      React.useEffect(() => {
        const { header, description, type } = optionsRef.current;

        if (condition) {
          if (!toastIdRef.current) {
            toastIdRef.current = toast[type](header, {
              description,
              duration: Infinity,
              toasterId: 'ketcher'
            });
          }
        } else {
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
          }
        }
      }, [condition]);

      React.useEffect(() => {
        return () => {
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
          }
        };
      }, []);
    }

    usePersistentToast(
      !!currentJobQED && currentJobQED < 0.4,
      'Warning: QED < 0.4',
      'The current molecule has a low drug-likeness. Consider optimizing it further.',
      'warning'
    );

    usePersistentToast(
      currentJobIsSub === false,
      'Error: Required Substructure Missing',
      'Please add the required substructure to the molecule before proceeding.',
      'error'
    );

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
      <div className="relative h-full w-full">
          <div className="absolute bottom-18 left-1/2 -translate-x-1/2 z-20 w-3/5">
            <Toaster id="ketcher" position="bottom-center" theme="light" richColors />
          </div>
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
      </div>
    )
}

export default KetcherFrame