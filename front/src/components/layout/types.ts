import type { ReactNode } from 'react';

export interface PanelTab {
  id: string;
  icon: string;
  label: string;
  content: ReactNode;
}

export interface PanelNode {
  content: ReactNode;
  onClose: () => void;
  onEdit?: () => void;
  showDelete?: boolean;
  title?: string;
}

export interface BottomSheetHandle {
  close: () => void;
}