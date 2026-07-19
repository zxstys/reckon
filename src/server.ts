import "./db";
import { createApp } from "./app";
import { config } from "./config";
import { createUser, findUserByEmail } from "./services/user.service";

async function bootstrapAdmin(): Promise<void> {
  const existing = findUserByEmail(config.adminEmail.toLowerCase());
  if (!existing) {
    await createUser(config.adminEmail.toLowerCase(), config.adminPassword, "admin");
    console.log(`Created default admin account: ${config.adminEmail}`);
  }
}

async function main(): Promise<void> {
  await bootstrapAdmin();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Fylo listening on ${config.appUrl} (storage: ${config.storageDriver})`);
  });
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
