import multer from "multer";
import { config } from "../config";
import { storageProvider } from "../storage";

export const upload = multer({
  storage: storageProvider.createMulterEngine(),
  limits: {
    fileSize: config.maxUploadSizeBytes,
  },
});
