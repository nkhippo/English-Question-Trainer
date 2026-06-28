export function ProgressRail({ phase }) {
  return (
    <div className="rail">
      {[0, 1, 2].map((i) => (
        <span key={i} className={i <= phase ? 'on' : ''} />
      ))}
    </div>
  );
}
