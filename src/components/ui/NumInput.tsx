import { useEffect, useState, type InputHTMLAttributes } from 'react';
import { sanitizeDecimal, sanitizeInteger } from '@/lib/numericInput';

type Base = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'inputMode'
>;

interface Props extends Base {
  value: number;
  onCommit: (n: number) => void;
  decimal?: boolean;
  allowZero?: boolean;
}

export default function NumInput({
  value,
  onCommit,
  decimal = false,
  allowZero = false,
  onBlur,
  ...rest
}: Props) {
  const [raw, setRaw] = useState<string>(() => String(value));

  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  const sanitize = decimal ? sanitizeDecimal : sanitizeInteger;

  const commit = () => {
    const normalized = raw.replace(',', '.');
    const n = decimal ? parseFloat(normalized) : parseInt(normalized, 10);
    const valid = Number.isFinite(n) && (allowZero ? n >= 0 : n > 0);
    if (valid && n !== value) {
      onCommit(n);
      setRaw(String(n));
    } else if (!valid) {
      setRaw(String(value));
    }
  };

  return (
    <input
      {...rest}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={raw}
      onChange={(e) => setRaw(sanitize(e.target.value))}
      onBlur={(e) => {
        commit();
        onBlur?.(e);
      }}
    />
  );
}
