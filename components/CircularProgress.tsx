"use client";

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 12,
  className = "",
}: CircularProgressProps) {
  // Cap percentage at 100 for display logic
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedPercentage / 100) * circumference;

  let strokeColor = "oklch(0.65 0.20 250)"; // primary
  if (percentage >= 100) strokeColor = "oklch(0.72 0.19 155)"; // success
  
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="circular-progress"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="circular-progress-track"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={strokeColor}
          className="circular-progress-fill"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
      </div>
    </div>
  );
}
