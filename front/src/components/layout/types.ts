import type { ReactNode } from 'react';

export interface PanelTab {
  id: string;
  icon: string;
  label: string;
  content: ReactNode;
}

export interface PanelNode {
  id?: string;
  title?: string;
  content: ReactNode;
  onClose: () => void;
  onEdit?: () => void;
  editing?: boolean;
}

export interface BottomSheetHandle {
  close: () => void;
}