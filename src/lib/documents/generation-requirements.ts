import type {
  DocumentConfirmedDiagnosisRequirement,
  DocumentGenerationConfig,
  DocumentTemplateSchema,
} from "@/types/document"

const DIAGNOSIS_FIELD_KEYS = new Set([
  "diagnosis_name",
  "principal_diagnosis",
  "diagnosis_codes",
  "condition_summary",
  "diagnosis_or_condition_summary",
])

export function documentSchemaContainsDiagnosisFields(
  schema: DocumentTemplateSchema
): boolean {
  function traverse(nodes: DocumentTemplateSchema["nodes"]): boolean {
    return nodes.some((node) => {
      if (DIAGNOSIS_FIELD_KEYS.has(node.key)) {
        return true
      }

      if ("children" in node) {
        return traverse(node.children)
      }

      return false
    })
  }

  return traverse(schema.nodes)
}

export function buildConfirmedDiagnosisRequirement(
  overrides: Partial<DocumentConfirmedDiagnosisRequirement> = {}
): DocumentConfirmedDiagnosisRequirement {
  return {
    type: "confirmedDiagnosis",
    required: true,
    selectionMode: "single",
    allowIcd11Search: true,
    ...overrides,
  }
}

export function templateNeedsConfirmedDiagnosisRequirement(args: {
  category: string
  schema: DocumentTemplateSchema
}): boolean {
  return documentSchemaContainsDiagnosisFields(args.schema)
}

export function getConfirmedDiagnosisRequirement(
  config: Pick<DocumentGenerationConfig, "generationRequirements">
) {
  return (
    config.generationRequirements.find(
      (requirement): requirement is DocumentConfirmedDiagnosisRequirement =>
        requirement.type === "confirmedDiagnosis"
    ) ?? null
  )
}

export function ensureDocumentGenerationRequirements(args: {
  category: string
  schema: DocumentTemplateSchema
  generationConfig: DocumentGenerationConfig
}): DocumentGenerationConfig {
  const confirmedDiagnosisRequirement = getConfirmedDiagnosisRequirement(
    args.generationConfig
  )

  if (!templateNeedsConfirmedDiagnosisRequirement(args)) {
    return confirmedDiagnosisRequirement
      ? {
          ...args.generationConfig,
          generationRequirements:
            args.generationConfig.generationRequirements.filter(
              (requirement) => requirement.type !== "confirmedDiagnosis"
            ),
        }
      : args.generationConfig
  }

  return {
    ...args.generationConfig,
    generationRequirements: [
      ...args.generationConfig.generationRequirements.filter(
        (requirement) => requirement.type !== "confirmedDiagnosis"
      ),
      buildConfirmedDiagnosisRequirement({
        selectionMode: confirmedDiagnosisRequirement?.selectionMode ?? "single",
        required: confirmedDiagnosisRequirement?.required ?? true,
        allowIcd11Search: confirmedDiagnosisRequirement?.allowIcd11Search ?? true,
      }),
    ],
  }
}
