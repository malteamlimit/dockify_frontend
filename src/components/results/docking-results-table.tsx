import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams, ValueFormatterParams } from "ag-grid-community";
import { Complex } from "@/app/models";
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { translate } from "@/lib/translation";
import {HardDriveDownload, OctagonAlert} from "lucide-react";
import { themeQuartz } from 'ag-grid-community';
import {Button} from "@/components/ui/button";
ModuleRegistry.registerModules([ AllCommunityModule ]);

interface ComplexWithIndex extends Complex {
  index: number;
}

export function DockingResultsTable({ complexList, bestComplexId }: { complexList: Complex[], bestComplexId: number | null }) {

  function handleDownload(job_id: string, id: number) {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/static/poses/${job_id}_${id}.pdb`;
    const link = document.createElement('a');
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

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
        const constraint_name = "DELTA_G";
        return (
          <div>
            {params.data?.violation?.includes(constraint_name) ? (
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center text-sm/0 bg-red-100 rounded-md pl-2">
                      {params.value.toFixed(4)}
                      <div className="flex items-center justify-center bg-red-100 text-red-800 text-xs font-medium w-6 h-6 rounded-full">
                        <OctagonAlert size={14}/>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                      <div className="text-sm flex flex-col items-center align-middle gap-1">
                          <div className="text-red-300">{translate(constraint_name)}</div>
                      </div>
                  </TooltipContent>
                </Tooltip>
            ) : (
                params.value.toFixed(4)
            )}
          </div>
        );
      }
    },
    {
      field: "atom_pair_cst",
      headerName: "Atom Pair CST",
      valueFormatter: (params: ValueFormatterParams<ComplexWithIndex, number>) => params.value!.toFixed(4),
      cellRenderer: (params: ICellRendererParams<ComplexWithIndex>) => {
        const constraint_name = "ATOM_PAIR_CST";
        return (
          <div>
            {params.data?.violation?.includes(constraint_name) ? (
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center text-sm/0 bg-red-100 rounded-md pl-2">
                      {params.value.toFixed(4)}
                      <div className="flex items-center justify-center bg-red-100 text-red-800 text-xs font-medium w-6 h-6 rounded-full">
                        <OctagonAlert size={14}/>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                      <div className="text-sm flex flex-col items-center align-middle gap-1">
                          <div className="text-red-300">{translate(constraint_name)}</div>
                      </div>
                  </TooltipContent>
                </Tooltip>
            ) : (
                params.value.toFixed(4)
            )}
          </div>
        );
      }
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
      // @ts-expect-error download button job id is not defined ....
      cellRenderer: (params: ICellRendererParams<ComplexWithIndex>) => <DownloadButton job_id={params.data?.job_id} id={params.value} handleDownload={handleDownload}/>,
    }
  ];

  const defaultColDef: ColDef = {
    flex: 1,
    sortable: true,
    filter: false,
    resizable: true,
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
          animateRows={true}
          domLayout="autoHeight"
          theme={themeQuartz}
      />
    </div>
  );
}


interface DownloadButtonProps {
  job_id: string;
  id: number;
  handleDownload: (job_id: string, id: number) => void;
}

export function DownloadButton({ job_id, id, handleDownload }: DownloadButtonProps) {
  return (
    <Button
      variant="secondary"
      size="icon"
      className="size-7 m-1.5 cursor-pointer"
      onClick={() => handleDownload(job_id, id)}
    >
      <HardDriveDownload />
    </Button>
  )
}