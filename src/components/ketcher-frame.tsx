'use client'

import { Ketcher, StructServiceProvider } from "ketcher-core";
import { Editor, InfoModal, ButtonsConfig } from "ketcher-react";
import { StandaloneStructServiceProvider } from "ketcher-standalone";
import * as React from "react";

import { useDockingStore } from "@/store/docking-store";
import { useSettingsStore } from "@/store/settings-store";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import 'ketcher-react/dist/index.css';
import { generateConf } from "@/lib/api";

const structServiceProvider = new StandaloneStructServiceProvider() as StructServiceProvider;

function KetcherFrame() {
    const ketcherRef = React.useRef<Ketcher | null>(null);
    // isLoadingRef to prevent triggering change event while loading molecule (happens on switching fast between jobs)
    const isLoadingRef = React.useRef(false);
    const currentLoadingJobIdRef = React.useRef<string | null>(null);

    const [hasError, setHasError] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState('');
    const [isLocked, setIsLocked] = React.useState(true);
    // workaround to prevent scroll jump on ketcher init
    const scrollPositionRef = React.useRef(0);
    // fix: makes ketcher mouse and scroll navigation work
    const editorContainerRef = React.useRef<HTMLDivElement>(null);

    const subscribedKetcherRef = React.useRef<Ketcher | null>(null);

    const currentJobId = useDockingStore((state) => state.currentJobId);
    const currentJobQED = useDockingStore((state) => state.getCurrentJob()?.qed);
    const currentJobIsSub = useDockingStore((state) => state.getCurrentJob()?.is_sub);
    const qedThreshold = useSettingsStore((state) => state.qedThreshold);
    const enforceSub = useSettingsStore((state) => state.enforceSubstructure);

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
      try {
        if (ketcher.editor?.subscribe && subscribedKetcherRef.current !== ketcher) {
          const handler = () => {
            if (isLoadingRef.current) return;

            const { updateStructure } = useDockingStore.getState();
            const currentJobId = useDockingStore.getState().currentJobId;

            ketcher.getSmiles().then(async smiles => {
                const conformer = await generateConf(smiles, currentJobId!);
                updateStructure(smiles, conformer);
              }).catch(console.error);
          };

          subscribedKetcherRef.current = ketcher;
          ketcher.editor.subscribe('change', handler);
        }
      } catch (err) {
        // expect error because of editor's disableMacromoleculesEditor keyword
        console.warn('Could not subscribe to editor changes:', err);
      }

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
      const currentJobStatus = useDockingStore((state) => state.getCurrentJob()?.job_status);

      const toastIdRef = React.useRef<string | number | null>(null);
      const optionsRef = React.useRef({ header, description, type });
      optionsRef.current = { header, description, type };

      React.useEffect(() => {
        if (currentJobStatus !== 'draft') {
          if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
          }
          return;
        }

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
      }, [condition, currentJobStatus]);

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
      !!currentJobQED && currentJobQED < qedThreshold,
      `Warning: QED < ${qedThreshold}`,
      'The current molecule has a low drug-likeness. Consider optimizing it further.',
      'warning'
    );

    usePersistentToast(
      currentJobIsSub === false && enforceSub,
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

    // fix: makes ketcher mouse and scroll navigation work
    React.useEffect(() => {
      const container = editorContainerRef.current;
      if (!container) return;

      const handleWheel = (e: WheelEvent) => {
        e.stopPropagation();
        e.preventDefault();
      };

      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }, []);

    React.useEffect(() => {
      const container = editorContainerRef.current;
      if (!container) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Meta' || e.key === 'Control') {
          e.stopPropagation();
        }
      };

      container.addEventListener('keydown', handleKeyDown, true);
      return () => container.removeEventListener('keydown', handleKeyDown, true);
    }, []);

    return (
      <div className="relative h-full w-full">
          <div className="absolute bottom-18 left-1/2 -translate-x-1/2 z-1 w-3/5">
            <Toaster id="ketcher" position="bottom-center" theme="light" richColors />
          </div>
          <div
              className="h-full w-full"
              ref={editorContainerRef}
          >
            <Editor
              staticResourcesUrl={process.env.PUBLIC_URL!}
              structServiceProvider={structServiceProvider}
              errorHandler={(message: string) => {
                setHasError(true);
                setErrorMessage(message.toString());
              }}
              onInit={handleOnInit}
              disableMacromoleculesEditor
              buttons={{
                  "arom": { hidden: true },
                  "dearom": { hidden: true },
                  "cip": { hidden: true },
                  "check": { hidden: true },
                  "analyse": { hidden: true },
                  "recognize": { hidden: true },
                  "explicit-hydrogens": { hidden: true },
                  "miew": { hidden: true },

                  "sgroup": { hidden: true },
                  "rgroup": { hidden: true },
                  "arrows": { hidden: true },
                  "reaction-plus": { hidden: true },
                  "reaction-mapping-tools": { hidden: true },
                  "enhanced-stereo": { hidden: true },
                  // "create-monomer": { hidden: true },
                  "text": { hidden: true },
                  "shape-line": { hidden: true },
                  "shape-ellipse": { hidden: true },
                  "shape-rectangle": { hidden: true },
                  "images": { hidden: true },
              } as ButtonsConfig}
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