export const NewNodeButton = ({
  className,
  onClick,
}: Readonly<{ className?: string; onClick?: () => void }>) => (
  <button
    onClick={onClick}
    className={`${className || ''} text-[1.5rem] leading-none`}
    title="Afegir node manualment"
  >
    +
  </button>
);
