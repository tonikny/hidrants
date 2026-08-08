let dirty = false;

export function setFormDirty(value: boolean): void {
  dirty = value;
}

export function isFormDirty(): boolean {
  return dirty;
}

/** Confirma el tancament d'un formulari d'edició; avisa si hi ha canvis sense desar. */
export function confirmDiscardChanges(): boolean {
  if (!dirty) {return true;}
  return window.confirm('Hi ha canvis sense desar. Si tanques ara, es perdran. Vols continuar?');
}