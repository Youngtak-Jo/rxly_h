import { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, Settings, Bot, SlidersHorizontal, Languages } from "lucide-react"

export const metadata: Metadata = {
    title: "Customization | Rxly",
    description: "Shape Rxly around real clinic workflows with customizable AI models, tone formatting, and more.",
}

const SETTINGS = [
    { id: "model", title: "AI Model Selection", icon: Bot, color: "text-orange-600", bg: "bg-orange-50", desc: "Choose your primary reasoning engine. Toggle between ultra-fast models for basic triage or advanced frontier models (like Claude 3.5 Sonnet) for complex differential diagnosis." },
    { id: "tone", title: "Tone & Style", icon: SlidersHorizontal, color: "text-pink-600", bg: "bg-pink-50", desc: "Format responses to match your clinic's style. Switch between 'Concise' bullet points for rapid review, or 'Professional' narrative style for patient hand-offs." },
    { id: "translation", title: "Auto-translate", icon: Languages, color: "text-blue-600", bg: "bg-blue-50", desc: "Output clinical summaries and patient instructions directly in the patient's native language, bridging communication gaps instantly." },
    { id: "evidence", title: "Evidence Threshold", icon: Settings, color: "text-emerald-600", bg: "bg-emerald-50", desc: "Calibrate the confidence level required before Rxly surfaces an insight. Set to 'High' to only show universally accepted guidelines." },
]

export default function CustomizationPage() {
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-indigo-50 border border-indigo-100/50">
                        <Settings className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-800">Clinic Preferences</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-black mb-6 tracking-tight leading-tight">
                        Settings that adapt to each clinical environment
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Healthcare isn't one-size-fits-all. Rxly provides granular control over the AI's behavior, allowing clinical teams to tune the system's output to match their specific workflows and patient populations.
                    </p>
                </header>

                {/* Feature List */}
                <div className="grid md:grid-cols-2 gap-8">
                    {SETTINGS.map((setting) => (
                        <div key={setting.id} className="group relative flex flex-col p-8 bg-white rounded-3xl border border-black/[0.08] hover:border-black/20 transition-all hover:shadow-lg">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${setting.bg}`}>
                                    <setting.icon className={`w-6 h-6 ${setting.color}`} />
                                </div>
                                <h3 className="text-xl font-semibold text-black">{setting.title}</h3>
                            </div>
                            <p className="text-base text-gray-600 leading-relaxed group-hover:text-gray-900 transition-colors">
                                {setting.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    )
}
