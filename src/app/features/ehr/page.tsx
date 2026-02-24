import { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, FileJson, Share2, Server, LayoutDashboard } from "lucide-react"

export const metadata: Metadata = {
    title: "EHR Integration | Rxly",
    description: "Seamlessly integrate with your Electronic Health Records (EHR) through FHIR R4 standard resources.",
}

const RESOURCES = [
    { id: "encounter", title: "Encounter Mapping", desc: "Consultation sessions are automatically mapped to FHIR Encounter resources, preserving timestamps, participant details, and clinical context." },
    { id: "condition", title: "Condition Syncing", desc: "Identified diagnoses and chronic issues are structured into FHIR Condition resources, ready to populate the patient's problem list." },
    { id: "observation", title: "Observation Extraction", desc: "Vital signs, lab results, and clinical findings mentioned during the consultation are codified as FHIR Observation resources." },
]

export default function EhrPage() {
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-violet-50 border border-violet-100/50">
                        <FileJson className="w-4 h-4 text-violet-600" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-violet-800">FHIR R4 Standard</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-black mb-6 tracking-tight leading-tight">
                        FHIR R4-ready handoff for EMR/EHR
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Eliminate double documentation. Rxly automatically structures the unstructured clinical narrative into standard FHIR R4 bundles, ready to be dispatched into your system of record.
                    </p>
                </header>

                {/* Workflow Steps */}
                <section className="mb-20">
                    <h2 className="text-2xl font-serif text-black mb-8 border-b border-black/[0.08] pb-4">Integration Workflow</h2>
                    <div className="grid md:grid-cols-3 gap-6 relative">
                        {/* Path line connecting steps (hidden on mobile) */}
                        <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-px bg-black/[0.08] -z-10 translate-y-[-1rem]"></div>

                        <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm text-center">
                            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center mb-4 border border-blue-100 relative z-10">
                                <LayoutDashboard className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-black mb-2">1. Clinical Review</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">The clinician reviews the generated insights within the Rxly workspace, making any necessary adjustments.</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm text-center">
                            <div className="w-12 h-12 mx-auto rounded-full bg-violet-50 flex items-center justify-center mb-4 border border-violet-100 relative z-10">
                                <FileJson className="w-5 h-5 text-violet-600" />
                            </div>
                            <h3 className="font-semibold text-black mb-2">2. Resource Staging</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">Rxly compiles the validated data into a comprehensive FHIR R4 Bundle containing mapped sub-resources.</p>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm text-center">
                            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-100 relative z-10">
                                <Share2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="font-semibold text-black mb-2">3. EHR Dispatch</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">The bundle is securely transmitted to the target EHR API endpoint (e.g., Epic, Cerner, Medplum).</p>
                        </div>
                    </div>
                </section>

                {/* Mapped Resources */}
                <section>
                    <h2 className="text-2xl font-serif text-black mb-8 border-b border-black/[0.08] pb-4">Core Mapped Resources</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {RESOURCES.map((resource) => (
                            <div key={resource.id} className="p-6 bg-gray-50/50 rounded-2xl">
                                <h3 className="font-semibold text-black mb-2 flex items-center gap-2">
                                    <Server className="w-4 h-4 text-gray-400" />
                                    {resource.title}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {resource.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    )
}
