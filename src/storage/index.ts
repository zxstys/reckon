import { config, assertStorageConfigured } from "../config";
import { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local";
import { S3StorageProvider } from "./s3";

assertStorageConfigured();

function build(): StorageProvider {
  if (config.storageDriver === "s3") {
    return new S3StorageProvider();
  }
  return new LocalStorageProvider();
}

export const storageProvider: StorageProvider = build();

export * from "./types";
