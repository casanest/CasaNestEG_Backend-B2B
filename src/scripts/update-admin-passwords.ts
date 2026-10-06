import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

const NEW_PASSWORD = process.env.ADMIN_USER_PASSWORD || "Dash.CN@1";
const EMAILPASS_PROVIDER = "emailpass";
const PAGE_SIZE = 50;

export default async function updateAdminPasswords({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const userModuleService = container.resolve(Modules.USER);
  const authModuleService = container.resolve(Modules.AUTH);

  logger.info("Updating admin user passwords...");

  let skip = 0;
  let updated = 0;
  let failed = 0;

  while (true) {
    const [users, count] = await userModuleService.listAndCountUsers(
      {},
      { skip, take: PAGE_SIZE }
    );

    if (!users.length) {
      break;
    }

    for (const user of users) {
      const { success, error } = await authModuleService.updateProvider(
        EMAILPASS_PROVIDER,
        {
          entity_id: user.email,
          password: NEW_PASSWORD,
        }
      );

      if (success) {
        updated++;
        logger.info(`Updated password for ${user.email}`);
      } else {
        failed++;
        logger.warn(
          `Could not update password for ${user.email}: ${
            error || "no emailpass auth identity found"
          }`
        );
      }
    }

    skip += users.length;

    if (skip >= count) {
      break;
    }
  }

  if (!updated && !failed) {
    logger.info("No admin users found.");
    return;
  }

  logger.info(
    `Finished. ${updated} admin user(s) updated, ${failed} skipped/failed.`
  );
}
