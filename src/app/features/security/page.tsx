import { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, Lock, ShieldCheck, Fingerprint, Activity } from "lucide-react"

export const metadata: Metadata = {
    title: "Security | Rxly",
    description: "Encryption-first with HIPAA-aligned safeguards. Learn how Rxly protects sensitive health information.",
}

const PROTOCOLS = [
    { id: "encryption", title: "AES-256-GCM Encryption", icon: Lock, color: "text-emerald-600", bg: "bg-emerald-50", desc: "All Protected Health Information (PHI) is encrypted at rest using AES-256-GCM. We utilize a unique, per-record salt strategy to ensure maximum cryptographic security against dictionary or rainbow table attacks." },
    { id: "transit", title: "Strict HTTPS (TLS 1.3)", icon: Fingerprint, color: "text-blue-600", bg: "bg-blue-50", desc: "Data in transit is secured using forced TLS 1.3, ensuring that sensitive information moving between our servers, clinical endpoints, and your browser is completely illegible to interception." },
    { id: "audit", title: "Audit-ready Logging", icon: Activity, color: "text-purple-600", bg: "bg-purple-50", desc: "Every read, write, and modification of PHI is tracked in an immutable audit ledger. This provides a complete chronological record necessary for HIPAA compliance reporting and internal security reviews." },
]

export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#111111] font-sans selection:bg-black selection:text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex items-center h-16 px-6 bg-[#FAFAFA]/80 backdrop-blur-md border-b border-black/5">
                <div className="flex-1">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors rounded-full pl-2 pr-4 py-1.5 hover:bg-black/5">
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back to Home</span>
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-32 pb-24 px-6 md:px-10 max-w-5xl mx-auto">
                <header className="mb-16 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-rose-50 border border-rose-100/50">
                        <ShieldCheck className="w-4 h-4 text-rose-600" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-rose-800">Protected & Compliant</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-black mb-6 tracking-tight leading-tight">
                        Encryption-first with HIPAA-aligned safeguards
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Security in healthcare is non-negotiable. Rxly's architecture is built around defense-in-depth principles, ensuring that patient data remains strictly isolated, encrypted, and monitored.
                    </p>
                </header>

                {/* Protocols List */}
                <div className="space-y-6 max-w-3xl">
                    {PROTOCOLS.map((protocol) => (
                        <div key={protocol.id} className="group relative flex gap-6 p-8 bg-white rounded-3xl border border-black/[0.08] hover:border-black/20 transition-all hover:shadow-lg">
                            <div className="flex-shrink-0">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${protocol.bg}`}>
                                    <protocol.icon className={`w-8 h-8 ${protocol.color}`} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-black mb-3">{protocol.title}</h3>
                                <p className="text-base text-gray-600 leading-relaxed">
                                    {protocol.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

            </main>
        </div>
    )
}
