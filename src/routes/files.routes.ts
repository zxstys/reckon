import { Router } from "express";
import { upload } from "../middleware/upload";
import { requireAuth } from "../middleware/auth";
import * as filesController from "../controllers/files.controller";

const router = Router();

router.get("/", filesController.showLanding);
router.post("/upload", upload.single("file"), filesController.handleUpload);
router.post("/upload/remote", filesController.handleRemoteUpload);

router.get("/f/:id", filesController.showFilePage);
router.get("/f/:id/download", filesController.downloadFile);

router.get("/dashboard", requireAuth, filesController.showDashboard);
router.post("/dashboard/:id/delete", requireAuth, filesController.deleteOwnFile);

export default router;
