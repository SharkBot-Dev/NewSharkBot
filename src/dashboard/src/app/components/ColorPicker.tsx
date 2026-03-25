import { ChangeEvent } from "react";

interface Props {
  value: number;
  onChange: (value: number) => void;
}

export default function ColorPicker({ value, onChange }: Props) {
  const hexValue = `#${value.toString(16).padStart(6, "0")}`;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newColor = parseInt(e.target.value.replace("#", ""), 16);
    onChange(newColor);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={hexValue}
        onChange={handleChange}
        className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
      />
      <span className="text-sm font-mono text-gray-700">{hexValue.toUpperCase()}</span>
    </div>
  );
}