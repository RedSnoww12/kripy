import { T } from './tokens';

interface Props {
  n: number;
  current: number;
}

export default function StepDots({ n, current }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 5,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 18 : 4,
            height: 4,
            borderRadius: 2,
            background: i <= current ? T.acc : T.s3,
            transition: 'all .4s cubic-bezier(.2,.9,.3,1)',
            boxShadow: i === current ? `0 0 6px ${T.acc}` : 'none',
          }}
        />
      ))}
    </div>
  );
}
