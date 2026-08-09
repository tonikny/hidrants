import { useState } from 'react';
import { FONT_SCALES, getFontScale, setFontScale } from '../../../utils/fontScale';
import { selectClass } from '../../../styles/uiStyles';

export function ConfigTab() {
  const [fontScale, setFontScaleValue] = useState(getFontScale());

  return (
    <div className="p-4">
      <h3 className="m-0 mb-3 text-[0.95rem] font-semibold">Configuració</h3>
      <label className="flex items-center justify-between gap-2 text-[0.85rem]">
        <span>Mida de text</span>
        <select
          value={fontScale}
          onChange={(e) => {
            const v = Number(e.target.value);
            setFontScaleValue(v);
            setFontScale(v);
          }}
          className={`${selectClass} max-w-[8rem] px-1`}
        >
          {FONT_SCALES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}