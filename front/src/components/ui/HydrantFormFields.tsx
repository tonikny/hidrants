import React from 'react';
import { inputStyle, selectStyle } from '../../styles/uiStyles';
import { HydrantUiFields } from '../../utils/osmConversion';

interface HydrantFormFieldsProps {
  data: HydrantUiFields;
  onChange: (newData: HydrantUiFields) => void;
  showSurveyDateAndStatus: boolean;
}

export const HydrantFormFields: React.FC<HydrantFormFieldsProps> = ({
  data,
  onChange,
  showSurveyDateAndStatus,
}) => {
  const currentDiameters = data.diameters ? data.diameters.split(';') : [];
  const numCouplings = Number(data.couplings) || 0;

  // Assegurar que tenim prou diàmetres segons el nombre de couplings
  while (currentDiameters.length < numCouplings) {
    currentDiameters.push('');
  }

  const handleFieldChange = (field: keyof HydrantUiFields, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        marginTop: '0.5rem',
      }}
    >
      {/* Estat i Data de revisió (Només en edició) */}
      {showSurveyDateAndStatus && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <label style={{ flex: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
            Estat:
            <select
              value={data.estat}
              onChange={(e) => handleFieldChange('estat', e.target.value)}
              style={selectStyle}
            >
              <option value="Operatiu">Operatiu</option>
              <option value="Fora de servei">Fora de servei</option>
            </select>
          </label>
          <label style={{ flex: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
            Data revisió:
            <input
              type="date"
              value={data.surveyDate}
              onChange={(e) => handleFieldChange('surveyDate', e.target.value)}
              style={{ ...inputStyle, padding: '2px' }}
            />
          </label>
        </div>
      )}

      {/* Tipus - Posició */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <label style={{ flex: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Tipus:
          <select
            value={data.type}
            onChange={(e) => handleFieldChange('type', e.target.value)}
            style={selectStyle}
          >
            <option value=""></option>
            <option value="pillar">Columna</option>
            <option value="underground">Subterrani</option>
          </select>
        </label>
        <label style={{ flex: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Posició:
          <select
            value={data.position}
            onChange={(e) => handleFieldChange('position', e.target.value)}
            style={selectStyle}
          >
            <option value=""></option>
            <option value="lane">Calçada</option>
            <option value="sidewalk">Vorera</option>
            <option value="green">Verd</option>
          </select>
        </label>
      </div>

      {/* Acoblaments - Pressió */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <label style={{ flex: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Acoblaments:
          <select
            value={data.couplings}
            onChange={(e) => handleFieldChange('couplings', e.target.value)}
            style={selectStyle}
          >
            <option value=""></option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </label>
        <label style={{ flex: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Pressió (bar):
          <input
            type="number"
            step="any"
            value={data.pressure}
            onChange={(e) => handleFieldChange('pressure', e.target.value)}
            style={inputStyle}
          />
        </label>
      </div>

      {/* Diàmetres dinàmics */}
      {numCouplings > 0 && (
        <label style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
          Diàmetre{numCouplings > 1 ? 's' : ''} (mm):
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.3rem',
              marginTop: '0.2rem',
            }}
          >
            {Array.from({ length: numCouplings }, (_, i) => (
              <select
                key={i}
                value={currentDiameters[i] || ''}
                onChange={(e) => {
                  const nd = [...currentDiameters];
                  nd[i] = e.target.value;
                  handleFieldChange('diameters', nd.join(';'));
                }}
                style={{ ...selectStyle, flex: '1 1 30%' }}
              >
                <option value=""></option>
                <option value="45">45</option>
                <option value="70">70</option>
                <option value="100">100</option>
              </select>
            ))}
          </div>
        </label>
      )}

      {/* Carrer */}
      <label style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
        Carrer:
        <input
          type="text"
          value={data.street}
          onChange={(e) => handleFieldChange('street', e.target.value)}
          style={inputStyle}
        />
      </label>

      {/* Número i Barri/Urbanització */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <label style={{ flex: 1, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Núm:
          <input
            type="text"
            value={data.num}
            onChange={(e) => handleFieldChange('num', e.target.value)}
            style={inputStyle}
          />
        </label>
        <label style={{ flex: 2, fontSize: '0.75rem', fontStyle: 'italic' }}>
          Barri/Urbanització:
          <input
            type="text"
            value={data.barri}
            onChange={(e) => handleFieldChange('barri', e.target.value)}
            style={inputStyle}
          />
        </label>
      </div>
    </div>
  );
};
