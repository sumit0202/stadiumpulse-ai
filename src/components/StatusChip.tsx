interface StatusChipProps {
  tone: string;
  label: string;
}

/**
 * A status chip that communicates state via BOTH a coloured dot and a text
 * label, so meaning is never conveyed by colour alone.
 */
export function StatusChip({ tone, label }: StatusChipProps) {
  return (
    <span className="chip" data-tone={tone}>
      <span className="dot" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
