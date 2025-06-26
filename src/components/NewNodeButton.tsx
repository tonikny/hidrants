export const NewNodeButton = ({
  style,
  onClick,
}: Readonly<{ style?: React.CSSProperties; onClick?: () => void }>) => (
  <button onClick={onClick} style={style} title="Afegir node manualment">
    +
  </button>
);
