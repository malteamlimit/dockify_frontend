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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {Button, buttonVariants} from "@/components/ui/button"
import {Ellipsis, HardDriveDownload, Trash2, Copy} from "lucide-react";

import {DockingJob} from "@/app/models";
import {perc2color, timeAgo, handlePDBDownload} from "@/lib/utils";
import {useDockingStore, } from "@/store/docking-store";
import {TagNameAndRename} from "@/components/tag-name-and-rename";
import {deleteJobById} from "@/lib/api";
import {toast} from "sonner";

export default function ResultPreviewCard({ job, highest, lowest }: { job: DockingJob, highest: number, lowest: number }) {
  const { removeJob, getCurrentJob, createCopy } = useDockingStore();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isContextOpen, setIsContextOpen] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const isHovering = React.useRef(false);
  const [isImageLoaded, setImageLoaded] = React.useState(false);
  const currentJob = getCurrentJob();

  const label = "text-xs font-semibold uppercase p-3 pb-1";
  const desc = "py-2 px-3 text-muted-foreground"
  const val = "py-1 px-3 text-end font-mono"

  const handleCopy = (jobId: string) => {
    createCopy(jobId).catch(() => toast.error("There was an error. Please try again later. :("))
  };

  const handleDelete = async (jobId: string) => {
    deleteJobById(jobId)
      .then(() => {
        removeJob(jobId);
        toast.success("Job successfully deleted.");
      })
      .catch(() => toast.error("There was an error. Please try again later. :("))
  }

  return (
      <div className="w-full">
        <TooltipProvider delayDuration={0}>
          <ContextMenu onOpenChange={(open) => {
            setIsContextOpen(open);
            if (open && job.job_status == "completed") {
              setIsExpanded(true);
            } else {
              setTimeout(() => {
                setIsExpanded(isHovering.current || isDropdownOpen);
              }, 50);
            }
          }}
          >
            <ContextMenuTrigger>
              <div
                  className={`relative w-full h-[18.75rem] ${isExpanded ? 'h-[31rem] mb-32' : ''} transition-all duration-300 ease-in-out`}
                  onMouseEnter={() => {
                    if (job.job_status == "completed") {
                      isHovering.current = true;
                      setIsExpanded(true);
                    }
                  }}
                  onMouseLeave={() => {
                    isHovering.current = false;
                    if (!isContextOpen && !isDropdownOpen) {
                      setIsExpanded(false);
                    }
                  }}
              >
                <Card
                    className={`w-full h-[10rem] top-0 p-0 relative border-none overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? '-top-1 h-full' : ''}`}>
                  <div className="grid grid-cols-1">
                    <div className="p-3 flex justify-between items-start">
                      <div
                          className="flex flex-1 min-w-0 me-1 rounded-sm overflow-x-scroll no-scrollbar gap-2 items-center">
                        {job.error ? (
                            <Tooltip delayDuration={100}>
                              <TooltipTrigger>
                                <Badge variant="destructive">Error</Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{job.error}</p>
                              </TooltipContent>
                            </Tooltip>
                        ) : ''}
                        {job.job_status == "draft" ? (
                            <Badge variant="secondary">Draft</Badge>
                        ) : ''}
                        {job.job_status == "running" ? (
                            <Badge variant="secondary">{job.progress_info}</Badge>
                        ) : ''}
                        {job.runs != 0 ? (
                            <Badge variant="default">{job.runs} Run{job.runs == 1 ? '' : 's'}</Badge>
                        ) : ''}
                        {job.best_complex_nr != null ? (
                            <Tooltip delayDuration={100}>
                              <TooltipTrigger>
                                <Badge
                                    color={perc2color(job.complexes[job.best_complex_nr].delta_g, highest, lowest)}
                                >ΔG: <span
                                    className="font-mono">{job.complexes[job.best_complex_nr].delta_g.toFixed(2)}</span></Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{job.complexes[job.best_complex_nr].delta_g}</p>
                              </TooltipContent>
                            </Tooltip>
                        ) : ''}
                      </div>
                      <DropdownMenu onOpenChange={(open) => {
                        setIsDropdownOpen(open);
                        if (open && job.job_status == "completed") {
                          setIsExpanded(true);
                        } else {
                          setTimeout(() => {
                            setIsExpanded(isHovering.current || isContextOpen);
                          }, 50);
                        }
                      }}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="size-6 cursor-pointer">
                            <Ellipsis/>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-60">
                          <DropdownMenuItem onClick={() => handleCopy(job.job_id)}>
                            <Copy />
                            Duplicate Structure
                          </DropdownMenuItem>
                          {job.best_complex_nr !== null ? (<DropdownMenuItem onClick={() => handlePDBDownload(job, 'best')}>
                            <HardDriveDownload/>
                            Download Best Pose as PDB
                          </DropdownMenuItem>) : ""}
                          <DropdownMenuItem variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                            <Trash2/>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="w-full">
                      {(job.job_status != "draft" && job.job_status != "failed" && job.best_complex_nr != null) ?
                          <table className="w-full" style={{tableLayout: 'fixed'}}>
                            <colgroup>
                              <col className="w-1/4"/>
                              <col className="w-1/4"/>
                              <col className="w-1/4"/>
                              <col className="w-1/4"/>
                            </colgroup>
                            <tbody>
                            <tr className="border-b">
                              <td colSpan={4} className={label}>Best result</td>
                            </tr>
                            <tr className="border-y">
                              <td colSpan={2} className={desc}>Delta G</td>
                              <td colSpan={2} className={val}>
                                <Tooltip delayDuration={100}>
                                  <TooltipTrigger>
                                    <Badge
                                        color={perc2color(job.complexes[job.best_complex_nr].delta_g, highest, lowest)}>{job.complexes[job.best_complex_nr].delta_g.toFixed(2)}</Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{job.complexes[job.best_complex_nr].delta_g}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td colSpan={2} className={desc}>Atom pair constraint</td>
                              <td colSpan={2} className={val}>
                                <Tooltip delayDuration={100}>
                                  <TooltipTrigger>
                                    {job.complexes[job.best_complex_nr].atom_pair_cst.toFixed(4)}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{job.complexes[job.best_complex_nr].atom_pair_cst}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td colSpan={2} className={desc}>Total Score</td>
                              <td colSpan={2} className={val}>
                                <Tooltip delayDuration={100}>
                                  <TooltipTrigger>
                                    {job.complexes[job.best_complex_nr].total_score.toFixed(4)}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{job.complexes[job.best_complex_nr].total_score}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td colSpan={4} className={label.concat(" pt-4")}>Ligand Props</td>
                            </tr>
                            <tr className="border-b">
                              <td colSpan={2} className={desc}>Weight</td>
                              <td colSpan={2} className={val}>{job.weight!.toFixed(4)}</td>
                            </tr>
                            <tr className="border-b">
                              <td className={desc}>H-bond acc.</td>
                              <td className={val + " border-r"}>{job.hbond_acc}</td>
                              <td className={desc}>H-bond don.</td>
                              <td className={val}>{job.hbond_don}</td>
                            </tr>
                            <tr className="border-b">
                              <td className={desc}>LogP</td>
                              <td className={val + " border-r"}>{job.logp.toFixed(4)}</td>
                              <td className={desc}>QED</td>
                              <td className={val}>{job.qed.toFixed(4)}</td>
                            </tr>
                            </tbody>
                          </table>
                          : ""}
                    </div>
                  </div>
                </Card>

                <Card
                  className={`w-full p-0 bg-white relative -top-29 aspect-[7/6] border-none overflow-hidden transition-all duration-300 ease-in-out
                              ${isExpanded ? '-top-[10.5rem] aspect-[1/1]' : ''}
                              ${job.job_id === currentJob?.job_id ? 'shadow-[0px_0px_2px_2px_rgba(229,127,78,0.65)]' : ''}`}>
                  <div className="overflow-hidden rounded-xl border h-full w-full relative">
                    <div className="absolute z-10 w-full p-3 pt-2 flex items-center justify-between gap-1">
                      <div className="flex items-center justify-between w-full gap-1">
                        <div className="truncate min-w-0 overflow-hidden bg-white/70 pr-1 rounded-md">
                          <TagNameAndRename job={job} />
                        </div>
                        <Badge variant="outline" className="flex-shrink-0 bg-card">
                          {timeAgo(Date.parse(job.created))}
                        </Badge>
                      </div>
                    </div>
                    <Image
                      src={`${process.env.NEXT_PUBLIC_API_URL}/static/previews/${job.job_id}.svg${job.thumbnailRefresh ? `?v=${job.thumbnailRefresh}` : ''}`}
                      alt="structure preview"
                      fill
                      priority
                      className={`${isExpanded ? 'mt-4 pb-2' : 'mt-1'} ${!isImageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-all`}
                      onLoad={() => setImageLoaded(true)}
                    />
                  </div>
                </Card>

              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-60">
              <ContextMenuItem onClick={() => handleCopy(job.job_id)}>
                <Copy />
                Duplicate Structure
              </ContextMenuItem>
              {job.best_complex_nr !== null ? (<ContextMenuItem onClick={() => handlePDBDownload(job, 'best')}>
                <HardDriveDownload/>
                Download Best Pose as PDB
              </ContextMenuItem>) : ""}
              <ContextMenuItem className="text-red-500 hover:text-red-600 group" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="text-red-500 group-hover:text-red-600"/>
                <span className="group-hover:text-red-600">Delete</span>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </TooltipProvider>
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                You are about to delete the structure <span className="font-bold">{job.name}</span>.<br/>
                This action cannot be undone. This will permanently delete the structure and its associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className={buttonVariants({variant: 'destructive'})} onClick={() => handleDelete(job.job_id)}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  )
}
