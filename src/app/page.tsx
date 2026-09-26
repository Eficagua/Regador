import { redirect } from "next/navigation"
import { LoginScreen } from "@/components/login-screen"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const user = await getSessionUser()
  if (user) {
    const campo = await prisma.campo.findFirst({ where: { usuarioId: user.id } })
    redirect(campo ? "/inicio" : "/onboarding")
  }
  const params = await searchParams
  return <LoginScreen error={params.error} />
}
