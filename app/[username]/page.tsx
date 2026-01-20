import { getPublicProfile } from "@/lib/profile"
import { notFound } from "next/navigation"
import { PublicProfileView } from "@/components/public-profile-view"

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const profile = await getPublicProfile(username)

  if (!profile) {
    return {
      title: "Profile Not Found",
    }
  }

  return {
    title: `${profile.user.display_name || profile.user.username} | Linkpop`,
    description: profile.user.bio || `Check out ${profile.user.username}'s links`,
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const profile = await getPublicProfile(username)

  if (!profile) {
    notFound()
  }

  return <PublicProfileView profile={profile} />
}
