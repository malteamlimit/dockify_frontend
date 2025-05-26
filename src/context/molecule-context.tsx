"use client"

import * as React from "react"

type MoleculeContextType = {
  moleculeData: string | null
  setMoleculeData: (data: string | null) => void
}

export const MoleculeContext = React.createContext<MoleculeContextType>({
  moleculeData: null,
  setMoleculeData: () => {}
})

export const MoleculeProvider = ({ children }: { children: React.ReactNode }) => {
  const [moleculeData, setMoleculeData] = React.useState<string | null>(null)

  return (
    <MoleculeContext.Provider value={{ moleculeData, setMoleculeData }}>
      {children}
    </MoleculeContext.Provider>
  )
}

export const useMolecule = () => React.useContext(MoleculeContext)