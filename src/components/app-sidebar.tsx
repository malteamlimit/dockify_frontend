"use client"

import * as React from "react"
import Image from "next/image";
import {History, Info, Plus, Settings} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton";

import {CreditsDialog} from "@/components/credits-dialog";
import ResultPreviewCard from "@/components/result-preview-card";
import {useDockingStore} from "@/store/docking-store";
import {Button} from "@/components/ui/button";
import {SettingsPanel} from "@/components/settings-panel";

const navMain = [
  {
    title: "History",
    icon: History,
  },
  {
    title: "Settings",
    icon: Settings,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { jobs, isLoading, setCurrentJobId, createJob } = useDockingStore();
  const [sortBy, setSortBy] = React.useState<string>("time-desc");
  const [activeItem, setActiveItem] = React.useState(navMain[0]);
  const [creditsDialogOpen, setCreditsDialogOpen] = React.useState(false);
  const { setSidebarOpen } = useSidebar();


  const { highest, lowest } = React.useMemo(() => {
    const validJobs = jobs.filter(job =>
      job.complexes && job.best_complex_nr != null
    );
    const highest = Math.max(...validJobs.map((job) => job.complexes[job.best_complex_nr!].delta_g)) ?? 0
    const lowest = Math.min(...validJobs.map((job) => job.complexes[job.best_complex_nr!].delta_g)) ?? 0
    return { highest, lowest }
  }, [jobs]);

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <div>
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Image src={"/dna.png"} alt={'dna'} width={160} height={160} className={'p-2'} />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Dockify</span>
                    <span className="truncate text-xs">University of Leipzig</span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item)
                        setSidebarOpen(true)
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <CreditsDialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen} />
          <SidebarMenuItem key='Credits'>
            <SidebarMenuButton
              tooltip={{
                children: 'Credits',
                hidden: false,
              }}
              onClick={() => {
                setCreditsDialogOpen(true)
              }}
              className="px-2.5 md:px-2"
            >
              <Info />
              <span>Credits</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarFooter>
      </Sidebar>
      {/* This is the second sidebar */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-3 justify-center">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base p-1.5 font-medium">
              {activeItem?.title}
            </div>
            {activeItem?.title === "History" && (
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Sort by</SelectLabel>
                    <SelectItem value="time-desc">Newest</SelectItem>
                    <SelectItem value="time-asc">Oldest</SelectItem>
                    <SelectItem value="score-desc">Delta G ▽</SelectItem>
                    <SelectItem value="score-asc">Delta G △</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent className="gap-0">
          {activeItem?.title === "History" ? (
            <>
              <SidebarGroup className={"relative top-0 border-b p-4 pt-4"}>
                {isLoading ?
                    <Skeleton className="h-9 w-full" />
                    : <Button variant="outline" onClick={createJob}>Create new structure <Plus/></Button>}
              </SidebarGroup>
              <SidebarGroup className={!isLoading && jobs.length == 0 ? "h-full justify-center px-0 pt-0" : "px-0 pt-0"}>
                <SidebarGroupContent>
                  {
                    isLoading ? (
                      Array(5).fill(0).map((_, index) => (
                        <div key={index} className="p-4 border-b last:border-b-0">
                          <Skeleton className="h-75 w-full" />
                        </div>
                      ))
                    ) : (
                        jobs.length == 0 ? (
                          <div className="h-full w-full flex flex-col items-center justify-center">
                            <Image src="/dna_broken.svg" alt="broken dna icon" width={80} height={80} className="mb-4 rotate-45" />
                            <p className="text-center text-muted-foreground">No structures found.<br />Please start designing your molecule.</p>
                          </div>
                        ) : (
                        jobs
                          .slice()
                          .sort((a, b) => {
                            if (sortBy === "score-asc" || sortBy === "score-desc") {
                              const aHasValidComplex = a.best_complex_nr != null && a.complexes && a.complexes[a.best_complex_nr];
                              const bHasValidComplex = b.best_complex_nr != null && b.complexes && b.complexes[b.best_complex_nr];

                              if (!aHasValidComplex && !bHasValidComplex) return 0;
                              if (!aHasValidComplex) return 1;
                              if (!bHasValidComplex) return -1;
                            }

                            if (sortBy === "time-asc") return new Date(a.created).getTime() - new Date(b.created).getTime();
                            if (sortBy === "time-desc") return new Date(b.created).getTime() - new Date(a.created).getTime();
                            if (sortBy === "score-asc") return a.complexes[a.best_complex_nr!].delta_g - b.complexes[b.best_complex_nr!].delta_g;
                            if (sortBy === "score-desc") return b.complexes[b.best_complex_nr!].delta_g - a.complexes[a.best_complex_nr!].delta_g;
                            return 0;
                          })
                          .map((job, idx) => (
                              <div
                                  key={job.job_id || idx}
                                  className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                                  onClick={() => setCurrentJobId(job.job_id)}
                              >
                                <ResultPreviewCard job={job} highest={highest} lowest={lowest}/>
                              </div>
                          )))
                    )
                  }
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          ) : (
            <SidebarGroup className="p-4">
              <SettingsPanel />
            </SidebarGroup>
          )}
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
