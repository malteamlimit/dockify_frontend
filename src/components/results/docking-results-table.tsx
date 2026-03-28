import {AgGridReact} from "ag-grid-react";
import {ColDef, ICellRendererParams, ValueFormatterParams } from "ag-grid-community";
import {Complex, DockingJob} from "@/app/models";
import {ModuleRegistry, AllCommunityModule} from 'ag-grid-community';
import {Badge} from "@/components/ui/badge";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {translate} from "@/lib/translation";
import {HardDriveDownload, OctagonAlert} from "lucide-react";
import {themeQuartz} from 'ag-grid-community';
import {Button} from "@/components/ui/button";
import {handlePDBDownload, validateDeltaG, validateAtomPairCst} from "@/lib/utils";
import {useSettingsStore} from "@/store/settings-store";
ModuleRegistry.registerModules([ AllCommunityModule ]);

interface ComplexWithIndex extends Complex {
  index: number;
}

interface ViolationCellProps {
  value: number;
  constraintName: string;
  violations?: string[];
}

function ViolationCell({ value, constraintName, violations }: ViolationCellProps) {
  const hasViolation = violations?.includes(constraintName);

  if (!hasViolation) {
    return <span>{value.toFixed(4)}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="flex items-center text-sm/0 bg-red-100 rounded-md pl-2">
          {value.toFixed(4)}
          <div className="flex items-center justify-center bg-red-100 text-red-800 text-xs font-medium w-6 h-6 rounded-full">
            <OctagonAlert size={14} />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm flex flex-col items-center align-middle gap-1">
          <div className="text-red-300">{translate(constraintName)}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export function DockingResultsTable({ job, highlightedComplexIndices = [] }: { job: DockingJob, highlightedComplexIndices?: number[] }) {
  const complexList = job.complexes ?? [];
  const bestComplexId = job.best_complex_nr;
  const deltaGThreshold = useSettingsStore((state) => state.deltaGThreshold);
  const atomPairCstThreshold = useSettingsStore((state) => state.atomPairCstThreshold);

  const columnDefs: ColDef<ComplexWithIndex>[] = [
    {
      field: "index",
      headerName: "Run",
      filter: false,
      cellRenderer: (params: ICellRendererParams<ComplexWithIndex>) => {
        const value = params.value as number;
        return (
           <div>
             <div className="inline-flex text-muted-foreground">{value + 1}</div>
             {value === bestComplexId ? <Badge variant="outline" color="#009A00" className="ml-2">Best</Badge> : ""}
           </div>
        );
      },
    },
    {
      field: "delta_g",
      headerName: "Delta G",
      valueFormatter: (params: ValueFormatterParams<ComplexWithIndex, number>) => params.value!.toFixed(4),
      cellRenderer: (params: ICellRendererParams<ComplexWithIndex>) => {
        const hasDeltaGViolation = validateDeltaG(params.data!, deltaGThreshold);
        return (
          <ViolationCell
            value={params.value}
            constraintName="DELTA_G"
            violations={hasDeltaGViolation ? ["DELTA_G"] : []}
          />
        );
      },
    },
    {
      field: "atom_pair_cst",
      headerName: "Atom Pair CST",
      valueFormatter: (params: ValueFormatterParams<ComplexWithIndex, number>) => params.value!.toFixed(4),
      cellRenderer: (params: ICellRendererParams<ComplexWithIndex>) => {
        const hasAtomPairCstViolation = validateAtomPairCst(params.data!, atomPairCstThreshold);
        return (
          <ViolationCell
            value={params.value}
            constraintName="ATOM_PAIR_CST"
            violations={hasAtomPairCstViolation ? ["ATOM_PAIR_CST"] : []}
          />
        );
      },
    },
    {
      field: "total_score",
      headerName: "Total Score",
      valueFormatter: (params: ValueFormatterParams<ComplexWithIndex, number>) => params.value!.toFixed(4),
    },
    {
      field: "atom_attraction",
      headerName: "Attraction",
      valueFormatter: (params: ValueFormatterParams<ComplexWithIndex, number>) => params.value!.toFixed(4),
    },
    {
      field: "electrostatic",
      headerName: "Electrostatic",
      valueFormatter: (params: ValueFormatterParams<ComplexWithIndex, number>) => params.value!.toFixed(4),
    },
    {
      field: "atom_repulsion",
      headerName: "Repulsion",
      valueFormatter: (params: ValueFormatterParams<ComplexWithIndex, number>) => params.value!.toFixed(4),
    },
    {
      field: "solvation",
      headerName: "Solvation",
      valueFormatter: (params: ValueFormatterParams<ComplexWithIndex, number>) => params.value!.toFixed(4),
    },
    {
      field: "hbond",
      headerName: "H-Bond",
      valueFormatter: (params: ValueFormatterParams<ComplexWithIndex, number>) => params.value!.toFixed(4),
    },
    {
      field: "pairwise_energy",
      headerName: "Pairwise Energy",
      valueFormatter: (params: ValueFormatterParams<ComplexWithIndex, number>) => params.value!.toFixed(4),
    },
    {
      field: "rmsd",
      headerName: "RMSD",
      valueFormatter: (params: ValueFormatterParams<ComplexWithIndex, number>) => {
        if (params.value === null || params.value === undefined) {
          return "N/A";
        }
        return params.value.toFixed(4)
      },
    },
    {
      field: "index",
      headerName: "Download",
      width: 10,
      initialWidth: 10,
      cellRenderer: (params: ICellRendererParams<ComplexWithIndex>) => <DownloadButton job={job} index={params.value} handleDownload={handlePDBDownload}/>,
    }
  ];

  const defaultColDef: ColDef = {
    flex: 1,
    sortable: true,
    filter: false,
    resizable: true,
  };

  const getRowStyle = (params: any) => {
    if (highlightedComplexIndices.includes(params.data.index)) {
      return {
        backgroundColor: 'var(--chart-3-muted)',
        boxShadow: 'inset 4px 0 0 0 var(--chart-1)',
      };
    }
    return undefined;
  };

  const rowData = complexList.map((complex, index) => ({
    ...complex,
    index
  }));

  {/* TODO: adapt style (font, hover color, ...) */}
  return (
    <div className="ag-theme-alpine w-full">
      <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          getRowStyle={getRowStyle}
          animateRows={true}
          domLayout="autoHeight"
          theme={themeQuartz}
      />
    </div>
  );
}


interface DownloadButtonProps {
  job: DockingJob;
  index: number;
  handleDownload: (job: DockingJob, index: number) => void;
}

export function DownloadButton({ job, index, handleDownload }: DownloadButtonProps) {
  return (
    <Button
      variant="secondary"
      size="icon"
      className="size-7 m-1.5 cursor-pointer"
      onClick={() => handleDownload(job, index)}
    >
      <HardDriveDownload />
    </Button>
  )
}