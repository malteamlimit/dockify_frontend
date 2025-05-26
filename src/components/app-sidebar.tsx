"use client"

import * as React from "react"
import Image from "next/image";
import {History, Info, Settings} from "lucide-react"

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

import {CreditsDialog} from "@/components/credits-dialog";
import ResultPreviewCard from "@/components/result-preview-card";
import {getAllJobs} from "@/lib/api";
import {DockingJobPreview} from "@/app/models";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
  const [jobs, setJobs] = React.useState<DockingJobPreview[]>([]);
  const [sortBy, setSortBy] = React.useState<string>("time-desc");
  const [activeItem, setActiveItem] = React.useState(navMain[0]);
  const [creditsDialogOpen, setCreditsDialogOpen] = React.useState(false);

  const { setSidebarOpen } = useSidebar();

  const { highest, lowest } = React.useMemo(() => {
    const highest = Math.max(...jobs.map((job: DockingJobPreview) => job.best_complex.delta_g))
    const lowest = Math.min(...jobs.map((job: DockingJobPreview) => job.best_complex.delta_g))
    return { highest, lowest }
  }, [jobs]);

  React.useEffect(() => {
    getAllJobs().then((fetchedData: DockingJobPreview[]) => {
        if (Array.isArray(fetchedData)) {
            setJobs(fetchedData);
        }
    })
  }, []);

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
                <a href="#">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Image src={"/dna.png"} alt={'dna'} width={16} height={16} />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Dockify</span>
                    <span className="truncate text-xs">University of Leipzig</span>
                  </div>
                </a>
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
        <SidebarHeader className="gap-3.5 border-b p-3 ">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-base font-medium">
              {activeItem?.title}
            </div>
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
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0 pt-0">
            <SidebarGroupContent>
              {
                jobs
                  .slice()
                  .sort((a, b) => {
                    if (sortBy === "time-asc") return new Date(a.created).getTime() - new Date(b.created).getTime();
                    if (sortBy === "time-desc") return new Date(b.created).getTime() - new Date(a.created).getTime();
                    if (sortBy === "score-asc") return a.best_complex.delta_g - b.best_complex.delta_g;
                    if (sortBy === "score-desc") return b.best_complex.delta_g - a.best_complex.delta_g;
                    return 0;
                  })
                  .map((job: DockingJobPreview, idx) => (
                    <div
                      key={job.job_id || idx}
                      className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
                    >
                      <ResultPreviewCard job={job} highest={highest} lowest={lowest} />
                    </div>
                  ))
              }
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
