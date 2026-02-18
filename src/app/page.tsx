import { LandingNavbar } from "@/components/landing-navbar"
import { HeroConsultationDemo } from "@/components/landing/hero-consultation-demo"

export default function Home() {
  return (
    <main className="relative min-h-svh overflow-x-clip bg-white text-foreground">
      <LandingNavbar />

      <section className="relative isolate overflow-hidden">
        <video
          aria-hidden="true"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/vertimg.jpeg"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
          style={{
            filter: "brightness(1.08) contrast(1.02)",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 62%, rgba(0,0,0,0.95) 68%, rgba(0,0,0,0.75) 76%, rgba(0,0,0,0.45) 86%, rgba(0,0,0,0) 100%)",
            maskImage:
              "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 62%, rgba(0,0,0,0.95) 68%, rgba(0,0,0,0.75) 76%, rgba(0,0,0,0.45) 86%, rgba(0,0,0,0) 100%)",
            WebkitMaskRepeat: "no-repeat",
            maskRepeat: "no-repeat",
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
          }}
        >
          <source src="/grok-video-659ea432-9ca4-41d7-bda9-7f3670897f7f.mp4" type="video/mp4" />
        </video>

        <div className="relative z-10">
          <section className="mx-auto flex min-h-[88svh] w-full max-w-7xl flex-col items-center px-6 pb-16 pt-28 text-center md:px-10 md:pt-36">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold leading-tight text-black md:text-6xl">
                AI Clinical Copilot
              </h1>
              <p className="mt-5 text-base text-black/80 md:text-lg">
                Turn every consultation into structured clinical intelligence with
                real-time transcription, live insights, and action-ready next steps.
              </p>
            </div>

            <div className="mt-10 w-full">
              <HeroConsultationDemo />
            </div>
          </section>
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
