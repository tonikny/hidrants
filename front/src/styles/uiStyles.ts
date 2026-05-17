export const floatingButtonStyle: React.CSSProperties = {
  background: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: '3rem',
  height: '3rem',
  fontSize: '1.5rem',
  cursor: 'pointer',
  zIndex: 1000,
  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
};

// formStyles

export const inputStyle: React.CSSProperties = {
  padding: '4px 0',
  border: '1px solid #ccc',
  borderRadius: '4px',
  fontSize: '0.85rem',
  width: '100%',
};

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  backgroundColor: 'white',
};

export const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '12px 12px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

export const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#e0e0e0',
  color: '#333',
  padding: '12px 12px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.85rem',
};

export const popupContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10%',
  left: '50%',
  transform: 'translateX(-50%)',
  backgroundColor: 'white',
  padding: '0.5rem 1rem',
  borderRadius: '10px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  width: 'min(60vw, 300px)',
  maxHeight: '80vh',
  overflowY: 'auto',
  zIndex: 1000,
  fontFamily: '"Helvetica Neue", Arial, Helvetica, sans-serif',
};
