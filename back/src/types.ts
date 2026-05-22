export type ApiRequest = {
  method: string;
  query?: any;
  body?: any;
  headers?: any;
  params?: any;
  url?: string;
  user?: {
    id: string;
    username: string;
    adf_id: number | null;
    role: string;
  };
};

export type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (data: any) => void;
  send: (data: any) => void;
  end: () => void;
  setHeader: (name: string, value: string) => void;
};

export type ApiHandler = (
  req: ApiRequest,
  res: ApiResponse
) => Promise<void> | void;
