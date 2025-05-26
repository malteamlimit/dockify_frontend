'use client'
// @ts-expect-error due to missing types for ketcher
import {StandaloneStructServiceProvider} from "ketcher-standalone";
import {Editor} from "ketcher-react";
import {Ketcher} from "ketcher-core";
import * as React from "react";

import {useMolecule} from "@/context/molecule-context";
import 'ketcher-react/dist/index.css';
// import {smiles2mol} from "@/lib/utils";

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
        : "<div>Ketcher couldn't be started :(</div>";
    }
    return this.props.children;
  }
}

function KetcherFrame() {

    const ketcherRef = React.useRef<Ketcher | null>(null);
    const { setMoleculeData } = useMolecule()

      const updateMoleculeData = React.useCallback(async () => {
        if (ketcherRef.current) {
          try {
            // const molData = await smiles2mol(await ketcherRef.current.getSmiles())
            const molData = await ketcherRef.current.getSdf()
            setMoleculeData(molData)
          } catch (error) {
            console.error("Failed to export molecule:", error)
          }
        }
      }, [setMoleculeData])

    const handleOnInit = React.useCallback((ketcher: Ketcher) => {
      ketcherRef.current = ketcher
      // @ts-expect-error ketcher is not defined in window
      window.ketcher = ketcher

      const initialData = "CN(C(=O)CN3CC2(CCN(C(=O)c1cccnc1)CC2)C3)c5ccc4COCc4c5"
      ketcher.setMolecule(initialData).then(() => {
        updateMoleculeData()
      })

      ketcher.editor.subscribe('change', updateMoleculeData)
    }, [updateMoleculeData])

    return (
      <ErrorBoundary>
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
      </ErrorBoundary>
    )
}

export default KetcherFrame