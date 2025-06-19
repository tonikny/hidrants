type ModalToastProps = {
  message: string;
  onClose: () => void;
};

export function NewNodeModal({ message, onClose }: Readonly<ModalToastProps>) {
  return (
    <button
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        background: 'transparent',
        opacity: '80%',
      }}
      onClick={() => onClose()}
    >
      <div
        // onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          padding: '1rem 2rem',
          borderRadius: '10px',
          opacity: 0.9,
          maxWidth: '50vw',
          boxShadow: '0 0 10px rgba(0,0,0,0.2)',
          fontSize: '1rem',
        }}
      >
        {message}
      </div>
    </button>
  );
}
