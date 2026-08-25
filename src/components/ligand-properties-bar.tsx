'use client'

import { useDockingStore } from "@/store/docking-store";
import { useSettingsStore } from "@/store/settings-store";

import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";

import { OctagonAlert } from "lucide-react";

export function LigandPropertiesBar() {
  const currentJob = useDockingStore((state) => state.getCurrentJob());
  const qedThreshold = useSettingsStore((state) => state.qedThreshold);

  const value = (v: number | undefined, digits = 2) => v?.toFixed(digits) ?? "\u2014";
  const qedIsLow = currentJob != null && currentJob.qed < qedThreshold;
  const valueClass = `text-base font-mono font-medium${currentJob ? "" : " text-muted-foreground"}`;

  return (
    <div className="px-4 py-2 bg-background">
      <Card className="p-4 shadow-none">
        <div className="flex grow justify-between align-middle gap-4">
          <div className="flex-1/5 grow border rounded-xl p-3">
            <div className="text-xs text-muted-foreground">Weight</div>
            <div className={valueClass}>{value(currentJob?.weight)}</div>
          </div>
          <div className="flex-1/5 grow border rounded-xl p-3">
            <div className="text-xs text-muted-foreground">LogP</div>
            <div className={valueClass}>{value(currentJob?.logp)}</div>
          </div>
          <div className={`flex-1/5 grow border rounded-xl p-3`} >
            <div className="text-xs text-muted-foreground">QED</div>
            <div className='flex gap-2'>
              <div className={valueClass}>{value(currentJob?.qed)}</div>
              <div className={`transition-opacity ease-in duration-400 ${qedIsLow ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center justify-center text-sm/0 bg-warning-bg border-warning-border border-1 rounded-md">
                      <p className="pl-2 text-warning-text whitespace-nowrap text-xs">QED is low</p>
                      <div className="flex items-center justify-center text-warning-text text-xs font-medium w-6 h-6 rounded-full flex-shrink-0">
                        <OctagonAlert size={14}/>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm flex flex-col items-center align-middle gap-1">
                      <p className="text-warning-border text-center">The QED score is below the threshold of {qedThreshold}.<br/>Improve your structure or change the threshold.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
          <div className="flex-2/5 flex flex-row grow border rounded-xl">
            <div className="flex-1 p-3">
              <div className="text-xs text-muted-foreground">H-Bond Donor</div>
              <div className={valueClass}>{value(currentJob?.hbond_don, 0)}</div>
            </div>
            <Separator orientation={'vertical'} />
            <div className="flex-1 p-3">
              <div className="text-xs text-muted-foreground">H-Bond Acceptor</div>
              <div className={valueClass}>{value(currentJob?.hbond_acc, 0)}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
