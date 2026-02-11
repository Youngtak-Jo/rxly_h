import { IconInnerShadowTop } from "@tabler/icons-react"
import { LoginForm } from "./login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-4">
      <div className="flex items-center gap-2">
        <IconInnerShadowTop className="!size-6" />
        <span className="text-xl font-semibold">Rxly</span>
      </div>
      <LoginForm />
    </div>
  )
}
