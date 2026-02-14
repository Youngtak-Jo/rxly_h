import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex justify-center">
        <a href="/">
          <Image src="/logo.png" alt="Rxly" width={120} height={36} />
        </a>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}
