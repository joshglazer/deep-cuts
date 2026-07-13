import {
  SegmentedControl as AstryxSegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";

export interface SegmentedControlOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: SegmentedControlOption[];
}

export function SegmentedControl({
  value,
  onChange,
  label,
  options,
}: SegmentedControlProps) {
  return (
    <AstryxSegmentedControl value={value} onChange={onChange} label={label}>
      {options.map((option) => (
        <SegmentedControlItem
          key={option.value}
          value={option.value}
          label={option.label}
        />
      ))}
    </AstryxSegmentedControl>
  );
}
SegmentedControl.displayName = "SegmentedControl";
