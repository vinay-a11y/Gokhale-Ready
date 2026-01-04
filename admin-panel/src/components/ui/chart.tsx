// File: ./src/components/ui/chart.tsx

import React from "react";
import { TooltipProps } from "recharts";

interface PayloadItem {
  name: string;
  value: number | string;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  className?: string;
  indicator?: string;
  hideLabel?: boolean;
  payload?: PayloadItem[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = (props) => {
  const {
    active,
    payload,
    className,
    indicator = "dot",
    hideLabel = false,
  } = props;

  if (active && payload && payload.length > 0) {
    return (
      <div className={`custom-tooltip ${className}`}>
        <p className="label">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }

  return null;
};

export default CustomTooltip;

