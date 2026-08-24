import { HeaderBar } from "@/components/header-bar";
import { getCurrentUser } from "@/lib/user-auth";

/** Server wrapper: reads the session once, then hands it to the client bar. */
export async function SiteHeader() {
  const user = await getCurrentUser();
  return <HeaderBar user={user} />;
}
