import { getCurrentUser } from "@/lib/auth"
import { LinktreeEditor } from "@/components/linktree-editor"

export const metadata = {
  title: "Bio Links | Linkpop",
  description: "Manage your link in bio page",
}

export default async function LinktreePage() {
  const user = await getCurrentUser()

  return <LinktreeEditor user={user!} />
}
