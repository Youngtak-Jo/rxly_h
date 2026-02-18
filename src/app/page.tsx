import { LandingNavbar } from "@/components/landing-navbar"
import { HeroConsultationDemo } from "@/components/landing/hero-consultation-demo"

export default function Home() {
  return (
    <main className="relative min-h-svh overflow-x-clip bg-[radial-gradient(120%_90%_at_50%_-20%,oklch(0.98_0.04_75)_0%,oklch(0.97_0.02_70)_40%,oklch(0.94_0.02_55)_100%)] text-foreground dark:bg-[radial-gradient(120%_90%_at_50%_-20%,oklch(0.3_0.03_45)_0%,oklch(0.22_0.01_35)_45%,oklch(0.16_0.01_30)_100%)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 top-[35rem] h-72 w-72 rounded-full bg-chart-2/20 blur-3xl"
      />

      <LandingNavbar />

      <section className="mx-auto flex min-h-[88svh] w-full max-w-7xl flex-col items-center px-6 pb-16 pt-28 text-center md:px-10 md:pt-36">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
            AI Clinical Copilot
          </h1>
          <p className="mt-5 text-base text-muted-foreground md:text-lg">
            Turn every consultation into structured clinical intelligence with
            real-time transcription, live insights, and action-ready next steps.
          </p>
        </div>

        <div className="mt-10 w-full">
          <HeroConsultationDemo />
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-28 px-6 py-20 md:scroll-mt-36 md:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold">Features</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Section skeleton reserved for product capabilities content.
          </p>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-28 px-6 py-20 md:scroll-mt-36 md:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold">How it works</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Section skeleton reserved for workflow and architecture explanation.
          </p>
        </div>
      </section>

      <section
        id="security"
        className="scroll-mt-28 px-6 py-20 md:scroll-mt-36 md:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-semibold">Security</h2>
          <p className="mt-3 max-w-3xl text-muted-foreground">
            Section skeleton reserved for compliance and privacy details.
          </p>
        </div>
      </section>
    </main>
  )
}
