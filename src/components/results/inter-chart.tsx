"use client"

import {useState} from "react";
import {CartesianGrid, Line, LineChart, XAxis, YAxis} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    ChartConfig,
    ChartContainer, ChartLegend, ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

import {Complex} from "@/app/models"
import {translate} from "@/lib/translation";


export function InterChart({ complexList }: { complexList: Complex[] }) {
    const [leftAxisKey, setLeftAxisKey] = useState<keyof Complex>("delta_g");
    const [rightAxisKey, setRightAxisKey] = useState<keyof Complex>("atom_pair_cst");

    const complexKeys = [
      "total_score",
      "atom_pair_cst",
      "atom_attraction",
      "electrostatic",
      "atom_repulsion",
      "solvation",
      "hbond",
      "delta_g",
      "pairwise_energy",
      "rmsd"
    ] as const;

    const handleLeftAxisChange = (value: string) => {
      const typedValue = value as keyof Complex;
      if (typedValue === rightAxisKey) {
        setRightAxisKey(leftAxisKey);
      }
      setLeftAxisKey(typedValue);
    };

    const handleRightAxisChange = (value: string) => {
      const typedValue = value as keyof Complex;
      if (typedValue === leftAxisKey) {
        setLeftAxisKey(rightAxisKey);
      }
      setRightAxisKey(typedValue);
    };

    const chartConfig = {
      run: {
        label: "Run",
      },
      [leftAxisKey]: {
        label: translate(leftAxisKey),
        color: "var(--chart-1)",
      },
      [rightAxisKey]: {
        label: translate(rightAxisKey),
        color: "var(--chart-2)"
      },
    } satisfies ChartConfig

    const chartData = complexList.map((complex, index) => ({
    ...complex,
    run: (index + 1).toString()
  }));

  return (
    <Card className="shadow-none">
      <CardHeader>
          <div className="flex h-full justify-between">
              <div>
                  <CardTitle>{translate(leftAxisKey)} vs. {translate(rightAxisKey)}</CardTitle>
                  <CardDescription>Comparison</CardDescription>
              </div>
              <div className="flex gap-4">
                  <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Left Axis</label>
                      <Select value={leftAxisKey} onValueChange={handleLeftAxisChange}>
                          <SelectTrigger>
                              <SelectValue placeholder="Select metric"/>
                          </SelectTrigger>
                          <SelectContent>
                              {complexKeys.map((key) => (
                                  <SelectItem
                                      key={key}
                                      value={key}
                                      disabled={key === rightAxisKey}
                                  >
                                      {translate(key) || key}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
                  <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Right Axis</label>
                      <Select value={rightAxisKey} onValueChange={handleRightAxisChange}>
                          <SelectTrigger>
                              <SelectValue placeholder="Select metric"/>
                          </SelectTrigger>
                          <SelectContent>
                              {complexKeys.map((key) => (
                                  <SelectItem
                                      key={key}
                                      value={key}
                                      disabled={key === leftAxisKey}
                                  >
                                      {translate(key) || key}
                                  </SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  </div>
              </div>
          </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="w-full h-full">
            <LineChart
                accessibilityLayer
                data={chartData}
                margin={{
                    left: 0,
                    right: 0,
                }}
            >
                <CartesianGrid vertical={false}/>
                <XAxis
                    dataKey="run"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                />
                <ChartTooltip
                    content={<ChartTooltipContent
                        indicator="line"
                        labelFormatter={
                            (value: number) => `Run ${value}`
                        }
                    />}
                    cursor={false}
                />
                <ChartLegend content={<ChartLegendContent/>}/>
                <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickCount={7}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickCount={7}
                />
                <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey={leftAxisKey}
                    stroke={chartConfig[leftAxisKey].color}
                    strokeWidth={1.5}
                    dot={{
                        fill: chartConfig[leftAxisKey].color,
                        r: 1
                    }}
                />
                <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey={rightAxisKey}
                    stroke={chartConfig[rightAxisKey].color}
                    strokeWidth={1.5}
                    dot={{
                        fill: chartConfig[rightAxisKey].color,
                        r: 1
                    }}
                />
            </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
