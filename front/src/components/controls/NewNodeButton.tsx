export const NewNodeButton = ({
  style,
  onClick,
}: Readonly<{ style?: React.CSSProperties; onClick?: () => void }>) => (
  <button 
    onClick={onClick} 
    style={{
      ...style,
      fontSize: '1.5rem',
      lineHeight: '1',
    }} 
    title="Afegir node manualment"
  >
    +
  </button>
);
