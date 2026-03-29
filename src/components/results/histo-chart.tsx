"use client"

import { useState } from "react";
import { Bar, ComposedChart, CartesianGrid, XAxis, YAxis, Line } from "recharts";

import {
  Card,
  CardContent, CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";

import { ChartSpline } from "lucide-react";

import { Complex } from "@/app/models";
import { translate } from "@/lib/translation";

/**
 * Histogram Chart Component
 *
 * Displays a histogram of complex properties for non-violated complexes.
 * Users can select which metric to display via a dropdown selector.
 * Only complexes without validation violations are shown.
 *
 * @param complexList - Array of Complex objects to display (should be pre-filtered for non-violated complexes)
 * @param complexListFull - Full array of all complexes (for correct index mapping)
 * @param onHoverBinChange - Callback function called when hovering over a bin, receives array of complex indices in that bin
 */
export function HistoChart({ complexList, complexListFull, onHoverBinChangeAction }: { complexList: Complex[], complexListFull?: Complex[], onHoverBinChangeAction?: (indices: number[]) => void }) {
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
    "rmsd",
  ] as const;

  const [selectedMetric, setSelectedMetric] = useState<typeof complexKeys[number]>("delta_g");
  const [showKDE, setShowKDE] = useState(false);

  // Map indices from filtered list to full list
  const mapFilteredIndicesToFullList = (filteredIndices: number[]): number[] => {
    if (!complexListFull) return filteredIndices;
    
    // Create a mapping of full list indices to filtered list indices
    const filteredComplexSet = new Set(complexList);
    const fullToFilteredMapping: { [key: number]: number } = {};
    let filteredIndex = 0;
    
    for (let fullIndex = 0; fullIndex < complexListFull.length; fullIndex++) {
      if (filteredComplexSet.has(complexListFull[fullIndex])) {
        fullToFilteredMapping[fullIndex] = filteredIndex;
        filteredIndex++;
      }
    }
    
    // Reverse map: find full indices that correspond to filtered indices
    const reverseMapping: number[] = [];
    for (let fullIndex = 0; fullIndex < complexListFull.length; fullIndex++) {
      if (fullToFilteredMapping[fullIndex] !== undefined && filteredIndices.includes(fullToFilteredMapping[fullIndex])) {
        reverseMapping.push(fullIndex);
      }
    }
    
    return reverseMapping;
  };

  // Find complexes that fall within a bin range
  const getComplexesInBin = (binStart: number, binEnd: number, metric: typeof complexKeys[number], isLastBin: boolean = false) => {
    // Use a small tolerance for floating-point comparisons
    const tolerance = 1e-10;

    return complexList
      .map((complex, index) => ({ complex, index }))
      .filter(({ complex }) => {
        const value = complex[metric];
        if (value === null || value === undefined || isNaN(value)) return false;

        // For the last bin, use <= to include the maximum value
        // For other bins, use < to exclude the upper boundary (it belongs to the next bin)
        if (isLastBin) {
          return value >= binStart - tolerance && value <= binEnd + tolerance;
        }
        return value >= binStart - tolerance && value < binEnd - tolerance;
      })
      .map(({ index }) => index);
  };

  const chartConfig = {
    value: {
      label: "Count",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  // Gaussian kernel for KDE
  const gaussianKernel = (x: number) => {
    return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
  };

  // Calculate KDE at a specific point
  const calculateKDE = (point: number, values: number[], bandwidth: number) => {
    if (values.length === 0) return 0;
    let sum = 0;
    values.forEach((value) => {
      sum += gaussianKernel((point - value) / bandwidth);
    });
    return sum / (values.length * bandwidth);
  };

  // Estimate bandwidth using Silverman's rule of thumb
  const estimateBandwidth = (values: number[]) => {
    if (values.length === 0) return 1;
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    return stdDev * Math.pow(4 / (3 * n), 1 / 5);
  };

  // Calculate bin parameters for a given metric
  const calculateBinParams = (metric: typeof complexKeys[number]) => {
    const values = complexList
      .map((complex) => complex[metric])
      .filter((v) => v !== null && v !== undefined && !isNaN(v)) as number[];

    if (values.length === 0) return null;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = Math.max(10, Math.min(30, Math.ceil(Math.sqrt(values.length) * 1.5)));
    const binWidth = (max - min) / binCount || 1;

    return { min, max, binCount, binWidth };
  };

  // Create histogram data by binning the values
  const createHistogramData = (metric: typeof complexKeys[number]) => {
    const binParams = calculateBinParams(metric);
    if (!binParams) return [];

    const { min, binCount, binWidth } = binParams;

    const values = complexList
      .map((complex) => complex[metric])
      .filter((v) => v !== null && v !== undefined && !isNaN(v)) as number[];

    const bins: { [key: number]: number } = {};
    for (let i = 0; i < binCount; i++) {
      bins[i] = 0;
    }

    values.forEach((value) => {
      let binIndex = Math.floor((value - min) / binWidth);
      // Ensure value falls within valid bin range
      binIndex = Math.max(0, Math.min(binCount - 1, binIndex));
      bins[binIndex]++;
    });

    // Calculate bandwidth for KDE
    const bandwidth = estimateBandwidth(values);

    // Create data points for histogram and KDE
    const histoData: { binStart: number; binEnd: number; binCenter: number; value: number; kde: number }[] = [];

    // Add all regular bins
    Object.entries(bins).forEach(([index, count]) => {
      const binIndex = parseInt(index);
      const binStart = min + binIndex * binWidth;
      const binEnd = min + (binIndex + 1) * binWidth;
      const binCenter = (binStart + binEnd) / 2;
      const kdeValue = calculateKDE(binCenter, values, bandwidth);

      histoData.push({
        binStart,
        binEnd,
        binCenter,
        value: count,
        kde: kdeValue,
      });
    });

    // Find max KDE value for scaling
    const maxKDE = Math.max(...histoData.map(d => d.kde), 0.0001);
    const maxCount = Math.max(...histoData.map(d => d.value), 1);
    const scale = maxCount / maxKDE;

    // Scale KDE values
    return histoData.map(d => ({
      ...d,
      kde: d.kde * scale,
    }));
  };

  const chartData = createHistogramData(selectedMetric);

  return (
    <Card className="shadow-none h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{translate(selectedMetric)} Histogram</CardTitle>
          <CardDescription>Histogram plot</CardDescription>
        </div>
          <div className="flex flex-row gap-4">
            <div className="flex flex-row items-center gap-3">
              <Toggle
                variant="outline"
                className="font-normal"
                aria-label="Toggle KDE"
                pressed={showKDE}
                onPressedChange={setShowKDE}
              >
                <ChartSpline/>
                Show KDE
              </Toggle>
            </div>
          <div className="flex flex-row items-center gap-3">
            <Select value={selectedMetric}
                    onValueChange={(value) => setSelectedMetric(value as typeof complexKeys[number])}>
              <SelectTrigger>
                <SelectValue placeholder="Select metric"/>
              </SelectTrigger>
              <SelectContent>
                {complexKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {translate(key) || key}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center w-full min-h-0">
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ComposedChart
              accessibilityLayer
              data={chartData}
              barCategoryGap={1.5}
              onMouseMove={(state) => {
                if (showKDE && state.activeTooltipIndex !== undefined) {
                  const dataPoint = chartData[state.activeTooltipIndex];
                  if (dataPoint && onHoverBinChangeAction) {
                    // Check if this is the last bin by comparing with the last chart data point's binEnd
                    const isLastBin = state.activeTooltipIndex === chartData.length - 1;
                    const filteredIndices = getComplexesInBin(dataPoint.binStart, dataPoint.binEnd, selectedMetric, isLastBin);
                    // Map indices to full list if needed
                    const fullIndices = mapFilteredIndicesToFullList(filteredIndices);
                    onHoverBinChangeAction(fullIndices);
                  }
                }
              }}
              onMouseLeave={() => {
                if (onHoverBinChangeAction) {
                  onHoverBinChangeAction([]);
                }
              }}
            >
              <CartesianGrid vertical={false} />
              {(() => {
                const domainStart = chartData[0].binStart;
                const domainEnd = chartData[chartData.length - 1].binEnd;
                const domainLength = domainEnd - domainStart;
                return (
                  <XAxis
                    type="number"
                    dataKey="binCenter"
                    domain={[domainStart, domainEnd]}
                    ticks={[
                      domainStart,
                      domainStart + domainLength / 4,
                      domainStart + domainLength / 2,
                      domainStart + domainLength * 3 / 4,
                      domainEnd
                    ]}
                    tickLine={true}
                    tickMargin={10}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.toFixed(2)}
                  />
                );
              })()}
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={({ payload }) => {
                  if (payload && payload.length > 0) {
                    const dataPoint = payload[0].payload as { binStart: number; binEnd: number; value: number; kde: number };
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <div className="flex flex-row gap-2 items-center justify-between">
                          <p className="text-sm text-muted-foreground">Range:</p>
                          <p className="text-sm font-mono">{dataPoint.binStart.toFixed(2)} - {dataPoint.binEnd.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-row gap-2 items-center justify-between">
                          <p className="text-sm text-muted-foreground">Count:</p>
                          <p className="text-sm font-mono">{dataPoint.value}</p>
                        </div>
                        {showKDE && (
                          <div className="flex flex-row gap-2 items-center justify-between">
                            <p className="text-sm text-muted-foreground">KDE:</p>
                            <p className="text-sm font-mono">{dataPoint.kde.toFixed(4)}</p>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="value"
                fill="var(--accent)"
                stroke="var(--chart-3)"
                strokeWidth={1.5}
                radius={3}
                isAnimationActive={true}
              />
              {showKDE && (
                <Line
                  type="monotone"
                  dataKey="kde"
                  stroke="var(--chart-5)"
                  dot={false}
                  isAnimationActive={true}
                  strokeWidth={2}
                  connectNulls={true}
                />
              )}
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="text-muted-foreground py-8">
            No data available yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
