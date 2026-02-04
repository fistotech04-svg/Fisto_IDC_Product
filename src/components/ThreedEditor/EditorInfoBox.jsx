import React from "react";

export default function EditorInfoBox({ stats }) {
  const displayStats = [
    { label: "Vertex Count", value: stats?.vertexCount || "0" },
    { label: "Polygon Count", value: stats?.polygonCount || "0" },
    { label: "Material Count", value: stats?.materialCount || "0" },
    { label: "File Size", value: stats?.fileSize || "0 MB" },
    { label: "Dimensions", value: stats?.dimensions || "0 X 0 X 0 cm" },
  ];

  return (
    <div className="w-full px-1 py-1 space-y-1 p-2">
      {displayStats.map((stat, idx) => (
        <div key={idx} className="flex items-center justify-between ">
          <span className="text-[11px] text-white stroke-black stroke-2 font-semibold">
            {stat.label}
          </span>
          <span className="text-[11px] text-white stroke-black stroke-2 font-semibold tabular-nums">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
