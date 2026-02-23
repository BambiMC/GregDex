import { useVersion } from "@/contexts/VersionContext";

export function useApiWithVersion() {
  const { currentVersion } = useVersion();

  const getApiUrl = (baseUrl: string) => {
    const url = new URL(baseUrl, window.location.origin);
    if (currentVersion) {
      url.searchParams.set("version", currentVersion);
    }
    return url.toString();
  };

  const fetchWithVersion = async (url: string, options?: RequestInit) => {
    const urlWithVersion = getApiUrl(url);
    return fetch(urlWithVersion, options);
  };

  return { getApiUrl, fetchWithVersion, currentVersion };
}
