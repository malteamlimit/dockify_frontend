import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ButtonRunDocking } from "@/components/button-run-docking";

import {useDockingStore} from "@/store/docking-store";

export function AppHeader() {
  const currentJob = useDockingStore((state) => state.getCurrentJob());

  return (
    <header className="bg-background sticky z-10 top-0 flex flex-row shrink-0 items-center justify-between gap-2 border-b px-4 py-3">
      <div className="flex flex-row items-center gap-2" ><SidebarTrigger className="-ml-1"/>
        <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink className={'hover:text-muted-foreground'}>Dockify</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block"/>
            <BreadcrumbItem>
              <BreadcrumbPage>Workspace</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {process.env.NODE_ENV === 'development' && <p>{currentJob?.job_id}</p>}
      <ButtonRunDocking variant={(currentJob?.runs ?? 0) == 0 ? "new" : "rerun"} disabled={!currentJob || currentJob.job_status == "running" || currentJob?.qed < 0.4 || !currentJob.is_sub} />
    </header>
  )
}
