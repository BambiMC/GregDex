export interface GTNHVersion {
  id: string;
  displayName: string;
  dataPath: string;
  isDefault?: boolean;
}

export const GTNH_VERSIONS: GTNHVersion[] = [
  {
    id: "2.7.4",
    displayName: "GTNH 2.7.4",
    dataPath: "data",
    isDefault: true,
  },
];

export const DEFAULT_VERSION = GTNH_VERSIONS.find(v => v.isDefault)?.id || "2.7.4";
