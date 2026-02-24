import { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, Database, Search, Zap, CheckCircle2 } from "lucide-react"

export const metadata: Metadata = {
    title: "Connectors | Rxly",
    description: "Connect Rxly to tier-1 clinical data endpoints like PubMed, ClinicalTrials.gov, and more.",
}

const CONNECTORS = [
    { id: "pubmed", name: "PubMed", description: "Access more than 35 million citations for biomedical literature from MEDLINE, life science journals, and online books.", status: "Live" },
    { id: "icd11", name: "ICD-11", description: "The global standard for diagnostic health information by the World Health Organization.", status: "Live" },
    { id: "europe-pmc", name: "Europe PMC", description: "Worldwide, free-access collection of life science publications and preprints.", status: "Live" },
    { id: "openfda", name: "OpenFDA", description: "Public FDA data on adverse events, drug recalls, and labeling.", status: "Live" },
    { id: "clinicaltrials", name: "ClinicalTrials.gov", description: "Database of privately and publicly funded clinical studies conducted around the world.", status: "Live" },
    { id: "dailymed", name: "DailyMed", description: "Official provider of FDA label information (package inserts).", status: "Live" },
]

export default function ConnectorsPage() {
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-blue-50 border border-blue-100/50">
                        <Database className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-blue-800">Data Endpoints</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif text-black mb-6 tracking-tight leading-tight">
                        Trusted medical sources, always in the loop
                    </h1>
                    <p className="text-lg text-gray-600 leading-relaxed">
                        Rxly connects directly to tier-1 clinical data endpoints, ensuring that the evidence presented is always current, authoritative, and relevant to the patient context.
                    </p>
                </header>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6 mb-20">
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4">
                            <Search className="w-5 h-5 text-orange-600" />
                        </div>
                        <h3 className="font-semibold text-black mb-2">Real-time Search</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">Queries are executed live against source APIs. No stale vector databases or outdated indexes.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                            <Zap className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-black mb-2">Parallel Execution</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">Connectors run simultaneously. A single clinical query can cross-reference trials, labels, and literature instantly.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-black mb-2">Verified Citations</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">Every fact presented includes a direct source link to the original database record for clinical verification.</p>
                    </div>
                </div>

                {/* Roster List */}
                <section>
                    <h2 className="text-2xl font-serif text-black mb-8 border-b border-black/[0.08] pb-4">Available Connectors</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {CONNECTORS.map(connector => (
                            <div key={connector.id} className="group relative flex flex-col p-6 bg-white rounded-2xl border border-black/[0.08] hover:border-black/20 transition-all hover:shadow-md">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-black">{connector.name}</h3>
                                    <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                                        {connector.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                                    {connector.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    )
}
