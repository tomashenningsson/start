'use client';

interface Props {
  count: number;
  total?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function StarRow({ count, total = 3, size = 'md' }: Props) {
  const sizes = {
    sm: 'text-base',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  };
  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={`${count} av ${total} stjärnor`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`${sizes[size]} transition-transform`}
          style={{
            filter: i < count ? 'drop-shadow(0 2px 6px rgba(250,204,21,0.7))' : 'grayscale(1) opacity(0.35)',
            transform: i < count ? 'scale(1)' : 'scale(0.8)',
          }}
        >
          ⭐
        </span>
      ))}
    </div>
  );
}
