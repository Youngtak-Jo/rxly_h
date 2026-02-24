"use client"

import Link from "next/link"
import LiquidGlass from "liquid-glass-react"
import { ChevronRight } from "lucide-react"
import { Instrument_Serif } from "next/font/google"
import styles from "./landing-sections.module.css"

const instrumentSerif = Instrument_Serif({
    subsets: ["latin"],
    weight: "400",
})

export function LandingCta() {
    return (
        <section className={`px-6 pb-24 md:px-10 md:pb-32 ${styles.section} ${styles.delayFour} ${styles.ctaSection}`}>
            <div className={styles.inner}>
                <div className={styles.ctaWrapper}>
                    {/* Animated colorful blobs behind the glass for distortion */}
                    <div aria-hidden className={`${styles.ctaDriftBlob} ${styles.ctaBlobOne}`} />
                    <div aria-hidden className={`${styles.ctaDriftBlob} ${styles.ctaBlobTwo}`} />
                    <div aria-hidden className={`${styles.ctaDriftBlob} ${styles.ctaBlobThree}`} />

                    <div className="relative z-10 flex w-full flex-col items-center justify-center py-12 px-5 md:py-24 md:px-12">
                        <div className="relative w-full max-w-[68rem]">
                            {/* 
                                The LiquidGlass library strictly relies on absolute positioning and translate(-50%, -50%). 
                                We use an invisible spacer duplicate to correctly force the parent height, keeping the 
                                outer wrapper (brown background) from vertically crushing the glass content.
                            */}
                            <div className={styles.liquidGlassSpacer} aria-hidden="true">
                                <div className={styles.ctaContentFull}>
                                    <div className={styles.ctaTextContainer}>
                                        <h2 className={`${instrumentSerif.className} ${styles.ctaTitleFull}`}>
                                            Ready to transform your clinical workflow?
                                        </h2>
                                        <p className={styles.ctaDescriptionFull}>
                                            Join the future of healthcare with Rxly's intelligent, secure, and integrated platform.
                                        </p>
                                    </div>
                                    <div className={styles.ctaButtonGroupFull}>
                                        <div className={styles.ctaPrimaryButtonFull}>
                                            Start
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                        <div className={styles.ctaSecondaryButtonFull}>
                                            Contact Sales
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <LiquidGlass
                                blurAmount={0}
                                aberrationIntensity={1.2}
                                elasticity={0.06}
                                saturation={150}
                                mode="standard"
                                cornerRadius={32}
                                padding="var(--glass-y, 2.5rem) var(--glass-x, 1.5rem)"
                                className={styles.liquidGlassWrapper}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "50%",
                                    width: "100%",
                                    margin: 0
                                }}
                            >
                                <div className={styles.ctaContentFull}>
                                    <div className={styles.ctaTextContainer}>
                                        <h2 className={`${instrumentSerif.className} ${styles.ctaTitleFull}`}>
                                            Ready to transform your clinical workflow?
                                        </h2>
                                        <p className={styles.ctaDescriptionFull}>
                                            Join the future of healthcare with Rxly's intelligent, secure, and integrated platform.
                                        </p>
                                    </div>
                                    <div className={styles.ctaButtonGroupFull}>
                                        <Link href="/consultation" className={styles.ctaPrimaryButtonFull}>
                                            Start
                                            <ChevronRight className="w-5 h-5" />
                                        </Link>
                                        <a href="mailto:contact@rxly.ai" className={styles.ctaSecondaryButtonFull}>
                                            Contact Sales
                                        </a>
                                    </div>
                                </div>
                            </LiquidGlass>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
