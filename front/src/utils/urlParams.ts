export function getQueryParam(key: string): string | null {
  return new URLSearchParams(window.location.search).get(key);
}

export function setUrlParam(key: string, value: string | null): void {
  const url = new URL(window.location.href);
  if (value) {
    url.searchParams.set(key, value);
  } else {
    url.searchParams.delete(key);
  }
  window.history.replaceState({}, "", url.toString());
}

export function setNodeUrlParam(nodeId: string | null): void {
  setUrlParam("node", nodeId);
}

export function setAdfUrlParam(adfId: number | null): void {
  setUrlParam("adf", adfId ? adfId.toString() : null);
}

export function getNodeShareUrl(nodeId: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set("node", nodeId);
  return url.toString();
}
