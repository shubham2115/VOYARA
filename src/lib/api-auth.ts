import "server-only";
import { requireApiUser } from "./session";

export * from "./api";

/** Any signed-in, active user (customers, staff and admins may all use customer features). */
export const requireCustomer = () => requireApiUser();
export { requireApiUser };
