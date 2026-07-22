"use client";

export function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  className,
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
      className={
        className ??
        "rounded-lg border border-hairline bg-ink-elevated px-2.5 py-1.5 font-ledger text-xs text-paper outline-none transition focus:border-lime focus:ring-2 focus:ring-lime/30"
      }
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
