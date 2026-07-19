import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import * as adminController from "../controllers/admin.controller";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/", adminController.showAdminDashboard);
router.get("/users", adminController.showAdminUsers);
router.post("/users/:id/ban", adminController.banUser);
router.post("/users/:id/unban", adminController.unbanUser);
router.post("/users/:id/delete", adminController.removeUser);
router.get("/files", adminController.showAdminFiles);
router.post("/files/:id/delete", adminController.removeFile);

export default router;
