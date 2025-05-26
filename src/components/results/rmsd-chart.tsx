"use client"

import React, {FC} from "react";

import {
    CartesianGrid,
    Label,
    Scatter,
    ScatterChart,
    XAxis,
    YAxis,
    LabelProps,
    Dot,
    DotProps,
} from "recharts"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import {Badge} from "@/components/ui/badge";

import {Complex} from "@/app/models"
import {translate} from "@/lib/translation";


export function RmsdChart({ chartData }: { chartData: Complex[] }) {

    const chartConfig = {
      run: {
        label: "Run",
      },
      delta_g: {
        label: translate("delta_g"),
        color: "var(--chart-1)",
      },
      rmsd: {
        label: translate("rmsd"),
        color: "var(--chart-2)"
      },
    } satisfies ChartConfig

    const renderYAxisLabelContent = (props: LabelProps): React.ReactElement => {
        const {value} = props;
        return (
            <foreignObject className="w-full h-full absolute -left-2">
                <div className="h-full pb-12 -ml-2 flex items-center justify-start">
                    <Badge className="text-xs -rotate-90" variant="secondary">
                        {value}
                    </Badge>
                </div>
            </foreignObject>
        );
    }

    const renderXAxisLabelContent = (props: LabelProps): React.ReactElement => {
        const {value} = props;
        return (
            <foreignObject className="w-full h-full absolute -left-2 bottom-4">
                <div className="h-full -mb-10 ml-14 flex items-end justify-center">
                    <Badge className="text-xs" variant="secondary">
                        {value}
                    </Badge>
                </div>
            </foreignObject>
        );
    };

    const RenderDot: FC<DotProps> = ({ cx, cy, fill, r }) => {
      return (
        <Dot cx={cx} cy={cy} fill={fill} r={r} />
      )
    }

    return (
      <Card className="shadow-none pb-1.5 h-full">
        <CardHeader>
            <div>
                <CardTitle>Delta G relative to RMSD</CardTitle>
                <CardDescription>Scatter plot</CardDescription>
            </div>
        </CardHeader>
        <CardContent className="px-2 pb-4 w-full h-full">
            <ChartContainer config={chartConfig} className="w-full h-full">
                <ScatterChart
                    margin={{
                        left: 12,
                        right: 18,
                        bottom: 26,
                    }}
                >
                    <CartesianGrid strokeDasharray="5 3"/>
                    <XAxis
                        dataKey="rmsd"
                        type="number"
                        name="RMSD"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={4}
                        tickCount={7}
                    >
                        <Label content={renderXAxisLabelContent} value={translate("rmsd")}/>
                    </XAxis>
                    <YAxis
                        dataKey="delta_g"
                        type="number"
                        name="Delta G"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickCount={7}
                    >
                        <Label content={renderYAxisLabelContent} value={translate("delta_g")}/>
                    </YAxis>
                    <ChartTooltip
                        cursor={{strokeDasharray: '3 3'}}
                        content={<ChartTooltipContent
                            hideLabel
                            indicator="line"
                            color={"var(--chart-3)"}
                        />}
                    />
                    <Scatter
                        data={chartData}
                        color="#000000"
                        shape={<RenderDot fill={"var(--chart-3)"} r={5} />}
                        activeShape={<RenderDot fill={"var(--chart-3"} r={8} />}
                    />
                </ScatterChart>
            </ChartContainer>
        </CardContent>
      </Card>
    )
}

