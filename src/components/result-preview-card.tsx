"use client";

import * as React from "react";
import Image from "next/image";

import {Tooltip, TooltipProvider, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {Badge} from "@/components/ui/badge";
import {Card} from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

import {DockingJobPreview} from "@/app/models";
import {perc2color, timeAgo} from "@/lib/utils";
import {Ellipsis, ArrowUpFromLine, HardDriveDownload, Trash2} from "lucide-react";
import {useEffect} from "react";

export default function ResultPreviewCard({ job, highest, lowest }: { job: DockingJobPreview, highest: number, lowest: number }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isContextOpen, setIsContextOpen] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const isHovering = React.useRef(false);

  const desc = "py-2 px-3 text-muted-foreground"
  const val = "py-2 px-3 text-end"

  const handleLoadWorkspace = (jobId: string) => {
    window.dispatchEvent(
      new CustomEvent('load-workspace', {
        detail: { jobId }
      })
    );
  };

    useEffect(() => {
        handleLoadWorkspace("4f73d93c-dfbb-40c8-b9fe-94c234b60b36")
    }, []);

  return (
      <TooltipProvider delayDuration={0}>
        <ContextMenu onOpenChange={(open) => {
          setIsContextOpen(open);
          if (open) {
            setIsExpanded(true);
          } else {
            setTimeout(() => {
              setIsExpanded(isHovering.current || isDropdownOpen);
            }, 50);
          }
        }}>
          <ContextMenuTrigger>
            <div
                className={`relative h-[16rem] ${isExpanded ? 'h-[34rem]' : ''} transition-all duration-300 ease-in-out`}
                onMouseEnter={() => {
                  isHovering.current = true;
                  setIsExpanded(true);
                }}
                onMouseLeave={() => {
                  isHovering.current = false;
                  if (!isContextOpen && !isDropdownOpen) {
                    setIsExpanded(false);
                  }
                }}
            >
              <Card
                  className={`w-full h-[10rem] p-3 top-0 relative border-none overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? '-top-1 h-full' : ''}`}>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-center">
                      <Badge variant="default">{job.runs} Run{job.runs == 1 ? '' : 's'}</Badge>
                      <Badge variant="outline">{timeAgo(Date.parse(job.created))}</Badge>
                    </div>
                    <DropdownMenu onOpenChange={(open) => {
                      setIsDropdownOpen(open);
                      if (open) {
                        setIsExpanded(true);
                      } else {
                        setTimeout(() => {
                          setIsExpanded(isHovering.current || isContextOpen);
                        }, 50);
                      }
                    }}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="size-6 cursor-pointer">
                          <Ellipsis />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-60">
                        <DropdownMenuItem onClick={() => handleLoadWorkspace(job.job_id)}>
                          <ArrowUpFromLine/>
                          Load into Workspace
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <HardDriveDownload />
                          Download Best Pose as PDB
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive">
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="w-full rounded-xl border border-dotted">
                    <div className="w-full h-full rounded-xl overflow-hidden">
                      <Image src={process.env.NEXT_PUBLIC_API_URL + "/static/previews/" + job.job_id + ".svg"}
                             alt="structure preview"
                             width="1000" height="1000" className="rounded-md"/>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className={`w-full p-0 relative -top-29 border-none overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? '-top-[13.5rem]' : ''}`}>
                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full" style={{tableLayout: 'fixed'}}>
                    <colgroup>
                      <col className="w-1/4"/>
                      <col className="w-1/4"/>
                      <col className="w-1/4"/>
                      <col className="w-1/4"/>
                    </colgroup>
                    <tbody>
                    <tr className="border-b">
                      <td colSpan={2} className={desc}>Delta G</td>
                      <td colSpan={2} className={val}>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger>
                            <Badge
                                color={perc2color(job.best_complex.delta_g, highest, lowest)}>{job.best_complex.delta_g.toFixed(2)}</Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{job.best_complex.delta_g}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td colSpan={2} className={desc}>Atom pair constraint</td>
                      <td colSpan={2} className={val}>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger>
                            {job.best_complex.atom_pair_cst.toFixed(4)}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{job.best_complex.atom_pair_cst}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                    <tr className="border-b-2 border-double">
                      <td colSpan={2} className={desc}>Total Score</td>
                      <td colSpan={2} className={val}>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger>
                            {job.best_complex.total_score.toFixed(4)}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{job.best_complex.total_score}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                    <tr className="border-b ">
                      <td colSpan={2} className={desc}>Weight</td>
                      <td colSpan={2} className={val}>{job.weight.toFixed(4)}</td>
                    </tr>
                    <tr className="border-b ">
                      <td className={desc}>H-bond acc.</td>
                      <td className={val + " border-r"}>{job.hbond_acc}</td>
                      <td className={desc}>H-bond don.</td>
                      <td className={val}>{job.hbond_don}</td>
                    </tr>
                    <tr className="">
                      <td className={desc}>LogP</td>
                      <td className={val + " border-r"}>{job.logp.toFixed(4)}</td>
                      <td className={desc}>QED</td>
                      <td className={val}>{job.qed.toFixed(4)}</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-60">
            <ContextMenuItem onClick={() => handleLoadWorkspace(job.job_id)}>
              <ArrowUpFromLine/>
              Load into Workspace
            </ContextMenuItem>
            <ContextMenuItem>
              <HardDriveDownload />
              Download Best Pose as PDB
            </ContextMenuItem>
            <ContextMenuItem className="text-red-500 hover:text-red-600 group">
              <Trash2 className="text-red-500 group-hover:text-red-600"/>
              <span className="group-hover:text-red-600">Delete</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </TooltipProvider>

  )
}