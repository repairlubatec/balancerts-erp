import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("balancertsDesktop", {
  platform: process.platform,
  version: process.versions.electron,
});
