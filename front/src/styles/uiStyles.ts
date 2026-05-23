export const floatingButtonStyle: React.CSSProperties = {
  background: 'white',
  color: '#333',
  border: '1px solid #ccc',
  borderRadius: '4px',
  width: '34px',
  height: '34px',
  fontSize: '1.2rem',
  cursor: 'pointer',
  zIndex: 990,
  boxShadow: '0 1px 5px rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
};

export const controlBarStyle: React.CSSProperties = {
  background: 'white',
  border: '2px solid rgba(0,0,0,0.2)',
  backgroundClip: 'padding-box',
  borderRadius: '4px',
  display: 'flex',
  flexDirection: 'column',
};

export const controlBarButtonStyle: React.CSSProperties = {
  width: '30px',
  height: '30px',
  lineHeight: '30px',
  background: 'white',
  border: 'none',
  borderBottom: '1px solid #ccc',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.2rem',
  color: '#333',
  padding: 0,
};

export const controlContainerStyle: React.CSSProperties = {
  position: 'fixed',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  zIndex: 990,
  pointerEvents: 'none',
};

export const controlItemStyle: React.CSSProperties = {
  pointerEvents: 'auto', // Re-enable pointer events for buttons
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
