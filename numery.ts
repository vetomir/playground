export const CircularLoader: React.FC<{ progress: number }> = React.memo(({ progress }) => {
  const config = useMemo(() => {
    const r = 45, sw = 10;
    const nr = r - sw / 2;
    const c = nr * 2 * Math.PI;
    return { r, sw, nr, c, offset: c - (progress / 100) * c };
  }, [progress]);

  return (
    <svg height={90} width={90} className="circular-loader">
      <circle stroke="#e0e0e0" fill="transparent" strokeWidth={config.sw} 
              r={config.nr} cx={config.r} cy={config.r} />
      <circle stroke="#3b82f6" fill="transparent" strokeWidth={config.sw}
              strokeDasharray={`${config.c} ${config.c}`}
              style={{ strokeDashoffset: config.offset }}
              strokeLinecap="round" r={config.nr} cx={config.r} cy={config.r}
              className="progress-circle" />
    </svg>
  );
});
