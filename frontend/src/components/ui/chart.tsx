import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<string, string> });
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ReactNode;
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

const ChartTooltip = (props: any) => <RechartsPrimitive.Tooltip {...props} />;

const ChartTooltipContent = (props: any) => {
  const { active, payload, className } = props;
  
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      <div className="grid gap-1.5">
        {payload.map((item: any, index: number) => (
          <div
            key={index}
            className={cn(
              "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
            )}
          >
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: item.color || item.payload?.fill || item.fill,
              }}
            />
            <div className="flex flex-1 justify-between leading-none">
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-mono font-medium tabular-nums text-foreground">
                {item.value?.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ChartLegend = (props: any) => {
  const { payload, verticalAlign = "bottom", className } = props;
  
  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn("flex items-center justify-center gap-4", verticalAlign === "top" ? "pb-3" : "pt-3", className)}
    >
      {payload.map((item: any, index: number) => (
        <div
          key={index}
          className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
        >
          <div
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{
              backgroundColor: item.color,
            }}
          />
          <span className="text-xs">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend };
