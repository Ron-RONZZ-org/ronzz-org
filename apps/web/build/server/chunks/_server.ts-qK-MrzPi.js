import { r as redirect } from './index-BkmUvga9.js';

const POST = async ({ cookies }) => {
  cookies.delete("session", { path: "/" });
  redirect(303, "/lib/login");
};

export { POST };
//# sourceMappingURL=_server.ts-qK-MrzPi.js.map
