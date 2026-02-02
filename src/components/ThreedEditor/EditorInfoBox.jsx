import React from "react";

export default function EditorInfoBox() {
  const stats = [
    { label: "Vertex Count", value: "1000" },
    { label: "Polygon Count", value: "1000" },
    { label: "Material Count", value: "89" },
    { label: "File Size", value: "1002 Mb" },
    { label: "Dimensions", value: "56 X 54 X 25 cm" },
  ];

  return (
    <div className="w-full bg-white px-1 py-2 space-y-1 p-2">
      {stats.map((stat, idx) => (
        <div key={idx} className="flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-medium">
            {stat.label}
          </span>
          <span className="text-[11px] text-gray-600 font-medium tabular-nums">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
