import type {
  DocumentGenerationConfig,
  DocumentGenerationContextSource,
  DocumentTemplateLanguage,
  DocumentTemplateRegion,
  DocumentSchemaNode,
  DocumentTemplateSchema,
} from "@/types/document"

interface SeededPublicDocumentDefinition {
  id: string
  slug: string
  title: string
  description: string
  category: string
  language?: DocumentTemplateLanguage
  region?: DocumentTemplateRegion
  authorName?: string
  featuredInstallCount?: number
  schema: DocumentTemplateSchema
  generationConfig: DocumentGenerationConfig
  previewLocale: DocumentTemplateLanguage
  previewContent: Record<string, unknown>
}

interface NodeOptions {
  required?: boolean
  placeholder?: string
}

function createField(
  key: string,
  label: string,
  type: "shortText" | "longText" | "stringList" = "shortText",
  options: NodeOptions = {}
): DocumentSchemaNode {
  return {
    key,
    label,
    type,
    helpText: "",
    required: options.required ?? false,
    placeholder: options.placeholder ?? "",
  }
}

function createGroup(
  key: string,
  label: string,
  children: DocumentSchemaNode[],
  repeatable = false
): DocumentSchemaNode {
  return {
    key,
    label,
    type: repeatable ? "repeatableGroup" : "group",
    helpText: "",
    required: false,
    placeholder: "",
    children,
  }
}

function createGenerationConfig(input: {
  audience: string
  outputTone: string
  contextSources: DocumentGenerationContextSource[]
  systemInstructions: string
  emptyValuePolicy: DocumentGenerationConfig["emptyValuePolicy"]
}): DocumentGenerationConfig {
  return {
    audience: input.audience,
    outputTone: input.outputTone,
    contextSources: input.contextSources,
    systemInstructions: input.systemInstructions,
    emptyValuePolicy: input.emptyValuePolicy,
  }
}

const KR_MANUAL_FIELD_PLACEHOLDER = "수동 입력"
const KR_EXTERNAL_METADATA_GUARDRAIL =
  "제출처, 수신기관, 기관코드, 연락처, 주민등록번호, 병원 식별자, 법정 문구, 보험사 메타데이터는 기록에 명시된 경우만 사용하고, 근거가 없으면 비워 두세요. 임의로 생성하지 마세요."

const AFTER_VISIT_SUMMARY_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("visit_snapshot", "Visit snapshot", [
      createField("visit_reason", "Visit reason", "longText"),
      createField("todays_impression", "Today's impression", "longText"),
      createField("diagnosis_codes", "Diagnosis codes", "stringList"),
    ]),
    createGroup("medication_and_orders", "Medication and orders", [
      createField("medication_changes", "Medication changes", "stringList"),
      createField(
        "tests_or_procedures_ordered",
        "Tests or procedures ordered",
        "stringList"
      ),
      createField("referrals_ordered", "Referrals ordered", "stringList"),
    ]),
    createGroup("follow_up_and_safety", "Follow-up and safety", [
      createField(
        "scheduled_follow_up_date",
        "Scheduled follow-up date",
        "shortText",
        { placeholder: "Add manually if already scheduled" }
      ),
      createField("follow_up_plan", "Follow-up plan", "longText"),
      createField("return_precautions", "Return precautions", "stringList"),
      createField("patient_action_items", "Patient action items", "stringList"),
    ]),
  ],
}

const REFERRAL_REQUEST_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("referral_request_header", "Referral request header", [
      createField("referring_clinician", "Referring clinician"),
      createField(
        "receiving_clinician_or_service",
        "Receiving clinician or service",
        "shortText",
        { placeholder: "Manual field" }
      ),
      createField("urgency", "Urgency"),
      createField("referral_question", "Referral question", "longText", {
        required: true,
      }),
    ]),
    createGroup("clinical_summary", "Clinical summary", [
      createField("reason_for_referral", "Reason for referral", "longText"),
      createField("diagnosis_codes", "Diagnosis codes", "stringList"),
      createField(
        "pertinent_history_and_findings",
        "Pertinent history and findings",
        "longText"
      ),
      createField("workup_completed", "Workup completed", "stringList"),
      createField(
        "current_medications_and_allergies",
        "Current medications and allergies",
        "longText"
      ),
    ]),
    createGroup("requested_actions_and_attachments", "Requested actions and attachments", [
      createField(
        "requested_evaluation_or_service",
        "Requested evaluation or service",
        "longText"
      ),
      createField(
        "target_appointment_window",
        "Target appointment window",
        "shortText",
        { placeholder: "Manual field" }
      ),
      createField("attachments_to_send", "Attachments to send", "stringList"),
    ]),
  ],
}

const CONSULTATION_REPLY_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("consultation_header", "Consultation header", [
      createField("referring_clinician", "Referring clinician"),
      createField("specialty_service", "Specialty service"),
      createField("reason_seen", "Reason seen", "longText"),
    ]),
    createGroup("impression_and_workup", "Impression and workup", [
      createField(
        "impression_and_diagnoses",
        "Impression and diagnoses",
        "longText"
      ),
      createField("diagnosis_codes", "Diagnosis codes", "stringList"),
      createField(
        "workup_or_procedures_completed",
        "Workup or procedures completed",
        "stringList"
      ),
      createField("treatment_changes", "Treatment changes", "stringList"),
    ]),
    createGroup("recommendations_and_follow_up", "Recommendations and follow-up", [
      createField(
        "recommendations_to_referring_clinician",
        "Recommendations to referring clinician",
        "stringList"
      ),
      createField(
        "co_management_requests",
        "Co-management requests",
        "stringList"
      ),
      createField("follow_up_cadence", "Follow-up cadence"),
      createField(
        "return_or_escalation_triggers",
        "Return or escalation triggers",
        "stringList"
      ),
    ]),
  ],
}

const KR_REFERRAL_REQUEST_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("referral_basics", "의뢰 기본정보", [
      createField("referring_clinician", "의뢰의"),
      createField("receiving_institution", "수신기관", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
      createField("receiving_department", "수신 진료과", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
      createField("referral_priority", "의뢰 우선도"),
      createField("referral_purpose", "의뢰 목적", "longText", {
        required: true,
      }),
    ]),
    createGroup("clinical_summary", "임상 요약", [
      createField("chief_issue", "주요 문제", "longText"),
      createField("diagnosis_codes", "상병 코드", "stringList"),
      createField("pertinent_findings", "주요 소견", "longText"),
      createField("tests_completed", "시행한 검사", "stringList"),
      createField("current_treatment", "현재 치료 및 약물", "longText"),
    ]),
    createGroup("request_and_attachments", "요청사항 및 첨부", [
      createField("specific_request", "구체적 요청사항", "longText"),
      createField("submission_destination", "제출처", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
      createField("attachments_to_send", "첨부 예정 자료", "stringList"),
      createField("contact_number", "연락처", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
    ]),
  ],
}

const KR_REFERRAL_REPLY_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("reply_basics", "회송 기본정보", [
      createField("replying_clinician", "회송의"),
      createField("original_referring_clinician", "원의뢰의"),
      createField("receiving_institution", "수신기관", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
      createField("visit_date", "진료일"),
      createField("reply_reason", "회송 사유", "longText"),
    ]),
    createGroup("assessment_and_actions", "평가 및 조치", [
      createField("assessment_summary", "평가 요약", "longText", {
        required: true,
      }),
      createField("diagnosis_codes", "상병 코드", "stringList"),
      createField("tests_or_procedures", "시행한 검사/처치", "stringList"),
      createField("treatment_changes", "치료 변경 사항", "stringList"),
      createField("important_findings", "중요 소견", "longText"),
    ]),
    createGroup("follow_up_plan", "향후 관리", [
      createField("co_management_requests", "공동 관리 요청", "stringList"),
      createField("follow_up_recommendations", "추적 관리 권고", "longText"),
      createField("return_triggers", "재의뢰 또는 재내원 기준", "stringList"),
      createField("contact_number", "연락처", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
    ]),
  ],
}

const KR_MEDICAL_CERTIFICATE_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("issuance_info", "발급 정보", [
      createField("certificate_type", "증명서 종류", "shortText", {
        required: true,
      }),
      createField("submission_destination", "제출처", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
      createField("issue_date", "발급일", "shortText", {
        required: true,
      }),
      createField("institution_code", "기관코드", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
    ]),
    createGroup("diagnosis_info", "진단 정보", [
      createField("diagnosis_name", "진단명", "longText", {
        required: true,
      }),
      createField("diagnosis_codes", "상병 코드", "stringList"),
      createField("onset_date", "발병일"),
      createField("diagnosis_date", "진단일", "shortText"),
      createField("clinical_basis", "진단 근거", "longText"),
    ]),
    createGroup("treatment_and_opinion", "치료 및 소견", [
      createField("treatment_summary", "치료 내용 요약", "longText"),
      createField("current_status", "현재 상태", "longText"),
      createField("work_or_activity_limitations", "활동 제한", "longText"),
      createField("clinician_opinion", "의학적 소견", "longText", {
        required: true,
      }),
    ]),
  ],
}

const KR_VISIT_CONFIRMATION_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("confirmation_basics", "확인 기본정보", [
      createField("confirmation_type", "확인서 종류", "shortText", {
        required: true,
      }),
      createField("submission_destination", "제출처", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
      createField("issue_date", "발급일"),
      createField("contact_number", "연락처", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
    ]),
    createGroup("visit_facts", "진료 사실", [
      createField("visit_dates", "진료 일자", "stringList", {
        required: true,
      }),
      createField("department_name", "진료과"),
      createField("treating_clinician", "담당 의료진"),
      createField("visit_reason_summary", "진료 사실 요약", "longText"),
      createField("procedures_or_tests", "시행한 검사/처치", "stringList"),
    ]),
    createGroup("follow_up_plan", "후속 계획", [
      createField("ongoing_treatment_plan", "향후 치료 계획", "longText"),
      createField("next_visit_guidance", "재내원 안내", "longText"),
      createField("additional_notes", "비고", "longText"),
    ]),
  ],
}

const KR_OUTPATIENT_CONFIRMATION_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("outpatient_basics", "통원 기본정보", [
      createField("submission_destination", "제출처", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
      createField("issue_date", "발급일"),
      createField("department_name", "진료과"),
      createField("contact_number", "연락처", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
    ]),
    createGroup("outpatient_facts", "통원 사실", [
      createField("outpatient_visit_dates", "통원 일자", "stringList", {
        required: true,
      }),
      createField("visit_count", "통원 횟수"),
      createField("treatment_summary", "진료 내용 요약", "longText"),
      createField("diagnosis_codes", "상병 코드", "stringList"),
    ]),
    createGroup("remarks", "비고", [
      createField("attendance_statement", "통원 확인 문구", "longText", {
        required: true,
      }),
      createField("next_visit_guidance", "추가 안내", "longText"),
    ]),
  ],
}

const KR_ADMISSION_DISCHARGE_CONFIRMATION_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("stay_info", "입퇴원 정보", [
      createField("submission_destination", "제출처", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
      createField("admission_date", "입원일", "shortText", {
        required: true,
      }),
      createField("discharge_date", "퇴원일"),
      createField("ward_or_department", "병동 또는 진료과"),
      createField("institution_code", "기관코드", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
    ]),
    createGroup("treatment_summary", "치료 요약", [
      createField("principal_diagnosis", "주진단", "longText", {
        required: true,
      }),
      createField("diagnosis_codes", "상병 코드", "stringList"),
      createField("hospital_course", "입원 경과", "longText"),
      createField("procedures_or_operations", "시행한 처치/수술", "stringList"),
    ]),
    createGroup("confirmation_and_guidance", "확인 및 안내", [
      createField("discharge_status", "퇴원 시 상태", "longText"),
      createField("follow_up_plan", "퇴원 후 계획", "longText"),
      createField("contact_number", "연락처", "shortText", {
        placeholder: KR_MANUAL_FIELD_PLACEHOLDER,
      }),
      createField("additional_notes", "비고", "longText"),
    ]),
  ],
}

const MEDICAL_NECESSITY_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("request_details", "Request details", [
      createField("payer_name", "Payer name", "shortText", {
        placeholder: "Manual field",
      }),
      createField("request_type", "Request type", "shortText", {
        placeholder: "Manual field",
      }),
      createField(
        "requested_service_or_drug",
        "Requested service or drug",
        "shortText",
        {
          required: true,
          placeholder: "Manual field",
        }
      ),
      createField("service_or_drug_code", "Service or drug code", "shortText", {
        placeholder: "Manual field",
      }),
      createField("urgency", "Urgency"),
    ]),
    createGroup("clinical_justification", "Clinical justification", [
      createField("diagnosis_codes", "Diagnosis codes", "stringList"),
      createField("clinical_summary", "Clinical summary", "longText"),
      createField("objective_findings", "Objective findings", "stringList"),
      createField("functional_impact", "Functional impact", "longText"),
      createField(
        "prior_management_and_failures",
        "Prior management and failures",
        "stringList"
      ),
    ]),
    createGroup("supporting_rationale", "Supporting rationale", [
      createField(
        "evidence_or_guideline_support",
        "Evidence or guideline support",
        "stringList"
      ),
      createField(
        "risk_if_delayed_or_denied",
        "Risk if delayed or denied",
        "longText"
      ),
      createField("requested_outcome", "Requested outcome", "longText"),
      createField(
        "attachments_available",
        "Attachments available",
        "stringList"
      ),
    ]),
  ],
}

const LONGITUDINAL_CARE_PLAN_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("care_plan_overview", "Care plan overview", [
      createField("primary_condition_focus", "Primary condition focus", "longText"),
      createField("active_problems", "Active problems", "stringList"),
      createField("health_concerns", "Health concerns", "stringList"),
    ]),
    createGroup("goals_and_interventions", "Goals and interventions", [
      createGroup(
        "care_goals",
        "Care goals",
        [
          createField("goal", "Goal", "longText"),
          createField("interventions", "Interventions", "stringList"),
          createField("monitoring_metric", "Monitoring metric"),
          createField("target_timeframe", "Target timeframe"),
        ],
        true
      ),
    ]),
    createGroup("monitoring_and_escalation", "Monitoring and escalation", [
      createField("monitoring_plan", "Monitoring plan", "stringList"),
      createField(
        "expected_outcomes",
        "Expected outcomes",
        "longText"
      ),
      createField("escalation_criteria", "Escalation criteria", "stringList"),
      createField(
        "patient_or_caregiver_responsibilities",
        "Patient or caregiver responsibilities",
        "stringList"
      ),
      createField("next_review_date", "Next review date", "shortText", {
        placeholder: "Manual field",
      }),
    ]),
  ],
}

const PROCEDURE_NOTE_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("procedure_overview", "Procedure overview", [
      createField("procedure_name", "Procedure name", "shortText", {
        required: true,
      }),
      createField("site_or_laterality", "Site or laterality"),
      createField("indication", "Indication", "longText"),
      createField("consent_discussed", "Consent discussed", "longText"),
      createField(
        "time_out_or_preprocedure_checks",
        "Time-out or pre-procedure checks",
        "longText"
      ),
    ]),
    createGroup("procedure_details", "Procedure details", [
      createField("technique", "Technique", "longText"),
      createField("medications_or_anesthesia", "Medications or anesthesia", "longText"),
      createField("findings", "Findings", "longText"),
      createField("specimens_or_implants", "Specimens or implants", "longText"),
    ]),
    createGroup("outcome_and_aftercare", "Outcome and aftercare", [
      createField("complications", "Complications", "longText"),
      createField("patient_tolerance", "Patient tolerance", "longText"),
      createField(
        "post_procedure_instructions",
        "Post-procedure instructions",
        "stringList"
      ),
      createField("follow_up_plan", "Follow-up plan", "longText"),
    ]),
  ],
}

const MEDICAL_CERTIFICATE_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("certificate_request", "Certificate request", [
      createField("certificate_type", "Certificate type", "shortText", {
        required: true,
      }),
      createField("intended_use", "Intended use", "longText"),
      createField(
        "recipient_name_or_agency",
        "Recipient name or agency",
        "shortText",
        { placeholder: "Manual field" }
      ),
      createField("issuance_date", "Issuance date", "shortText", {
        required: true,
      }),
      createField("visit_or_assessment_date", "Visit or assessment date"),
    ]),
    createGroup("diagnostic_basis", "Diagnostic basis", [
      createField(
        "diagnosis_or_condition_summary",
        "Diagnosis or condition summary",
        "longText",
        { required: true }
      ),
      createField("diagnosis_codes", "Diagnosis codes", "stringList"),
      createField("diagnosis_date", "Diagnosis date", "shortText", {
        required: true,
      }),
      createField("onset_or_injury_date", "Onset or injury date"),
      createField(
        "injury_or_service_context",
        "Injury or service context",
        "longText"
      ),
    ]),
    createGroup("certification_statement", "Certification statement", [
      createField("current_treatment_status", "Current treatment status", "longText"),
      createField(
        "functional_or_service_impact",
        "Functional or service impact",
        "longText"
      ),
      createField(
        "expected_recovery_or_follow_up",
        "Expected recovery or follow-up",
        "shortText"
      ),
      createField("clinician_attestation", "Clinician attestation", "longText", {
        required: true,
      }),
      createField(
        "mandatory_statements_or_attachments",
        "Mandatory statements or attachments",
        "stringList"
      ),
    ]),
  ],
}

const MEDICAL_LEAVE_CERTIFICATE_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("leave_request", "Leave request", [
      createField("leave_type", "Leave type", "shortText", {
        required: true,
      }),
      createField(
        "recipient_organization",
        "Recipient organization",
        "shortText",
        { placeholder: "Manual field" }
      ),
      createField("assessment_date", "Assessment date"),
      createField("leave_start_date", "Leave start date", "shortText", {
        required: true,
      }),
      createField("expected_return_date", "Expected return date"),
      createField(
        "recommended_leave_duration",
        "Recommended leave duration",
        "shortText",
        { required: true }
      ),
    ]),
    createGroup("clinical_rationale", "Clinical rationale", [
      createField("condition_summary", "Condition summary", "longText", {
        required: true,
      }),
      createField("diagnosis_codes", "Diagnosis codes", "stringList"),
      createField("functional_limitations", "Functional limitations", "longText"),
      createField(
        "why_patient_should_be_excused",
        "Why patient should be excused",
        "longText",
        { required: true }
      ),
    ]),
    createGroup("recovery_plan", "Recovery plan", [
      createField(
        "rest_or_accommodations_instructions",
        "Rest or accommodations instructions",
        "stringList"
      ),
      createField("follow_up_plan", "Follow-up plan", "longText"),
      createField("reevaluation_date", "Reevaluation date"),
      createField("clinician_contact", "Clinician contact", "shortText", {
        placeholder: "Manual field",
      }),
    ]),
  ],
}

const TREATMENT_CONFIRMATION_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("confirmation_request", "Confirmation request", [
      createField("confirmation_type", "Confirmation type", "shortText", {
        required: true,
      }),
      createField("document_purpose", "Document purpose", "longText"),
      createField(
        "recipient_name_or_organization",
        "Recipient name or organization",
        "shortText",
        { placeholder: "Manual field" }
      ),
      createField("issue_date", "Issue date"),
    ]),
    createGroup("encounter_summary", "Encounter summary", [
      createField("encounter_dates", "Encounter dates", "stringList", {
        required: true,
      }),
      createField("department_or_service", "Department or service"),
      createField("treating_clinician", "Treating clinician"),
      createField("diagnosis_codes", "Diagnosis codes", "stringList"),
      createField(
        "tests_treatments_or_procedures",
        "Tests, treatments, or procedures",
        "stringList"
      ),
    ]),
    createGroup("confirmation_statement", "Confirmation statement", [
      createField("confirmation_text", "Confirmation text", "longText", {
        required: true,
      }),
      createField(
        "treatment_course_or_follow_up",
        "Treatment course or follow-up",
        "longText"
      ),
      createField("attachments_available", "Attachments available", "stringList"),
    ]),
  ],
}

const HOSPITALIZATION_CONFIRMATION_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("stay_or_procedure_details", "Stay or procedure details", [
      createField("confirmation_scope", "Confirmation scope", "shortText", {
        required: true,
      }),
      createField("facility_or_service", "Facility or service"),
      createField("admission_date", "Admission date"),
      createField("discharge_date", "Discharge date"),
      createField("procedure_or_operation_date", "Procedure or operation date"),
    ]),
    createGroup("clinical_summary", "Clinical summary", [
      createField("principal_diagnosis", "Principal diagnosis", "shortText", {
        required: true,
      }),
      createField("diagnosis_codes", "Diagnosis codes", "stringList"),
      createField(
        "reason_for_admission_or_procedure",
        "Reason for admission or procedure",
        "longText"
      ),
      createField("procedure_or_operation", "Procedure or operation"),
      createField(
        "hospital_course_or_major_findings",
        "Hospital course or major findings",
        "longText"
      ),
    ]),
    createGroup("recovery_and_attestation", "Recovery and attestation", [
      createField("discharge_status", "Discharge status"),
      createField(
        "recommended_recovery_period",
        "Recommended recovery period",
        "shortText"
      ),
      createField("follow_up_plan", "Follow-up plan", "longText"),
      createField(
        "certification_statement",
        "Certification statement",
        "longText",
        { required: true }
      ),
    ]),
  ],
}

const INSURANCE_CLAIM_CERTIFICATE_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("claim_request", "Claim request", [
      createField("insurer_name", "Insurer name", "shortText", {
        placeholder: "Manual field",
      }),
      createField(
        "claim_reference_optional",
        "Claim reference (optional)",
        "shortText",
        { placeholder: "Manual field" }
      ),
      createField("issue_date", "Issue date"),
      createField("encounter_dates", "Encounter dates", "stringList", {
        required: true,
      }),
      createField("claim_purpose", "Claim purpose", "longText", {
        required: true,
      }),
    ]),
    createGroup("treatment_details", "Treatment details", [
      createField("diagnosis_codes", "Diagnosis codes", "stringList"),
      createField("visit_reason", "Visit reason", "longText"),
      createField(
        "services_and_treatments_provided",
        "Services and treatments provided",
        "stringList"
      ),
      createField(
        "prescribed_medications_or_devices",
        "Prescribed medications or devices",
        "stringList"
      ),
      createField(
        "medical_necessity_summary",
        "Medical necessity summary",
        "longText"
      ),
    ]),
    createGroup("supporting_documentation", "Supporting documentation", [
      createField("place_of_service", "Place of service"),
      createField("clinician_or_department", "Clinician or department"),
      createField(
        "supporting_documents",
        "Supporting documents",
        "stringList"
      ),
      createField(
        "claim_certification_statement",
        "Claim certification statement",
        "longText",
        { required: true }
      ),
    ]),
  ],
}

const RETURN_TO_ACTIVITY_CLEARANCE_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("clearance_request", "Clearance request", [
      createField("clearance_type", "Clearance type", "shortText", {
        required: true,
      }),
      createField(
        "recipient_name_or_organization",
        "Recipient name or organization",
        "shortText",
        { placeholder: "Manual field" }
      ),
      createField("evaluation_date", "Evaluation date"),
      createField("target_return_date", "Target return date"),
    ]),
    createGroup("current_status", "Current status", [
      createField("condition_summary", "Condition summary", "longText", {
        required: true,
      }),
      createField("diagnosis_codes", "Diagnosis codes", "stringList"),
      createField(
        "treatment_completed_or_ongoing",
        "Treatment completed or ongoing",
        "longText"
      ),
      createField(
        "current_functional_status",
        "Current functional status",
        "longText"
      ),
    ]),
    createGroup("clearance_decision", "Clearance decision", [
      createField("clearance_status", "Clearance status", "shortText", {
        required: true,
      }),
      createField(
        "restrictions_or_accommodations",
        "Restrictions or accommodations",
        "stringList"
      ),
      createField(
        "follow_up_or_restriction_end_date",
        "Follow-up or restriction end date",
        "shortText"
      ),
      createField(
        "warning_signs_or_reassessment",
        "Warning signs or reassessment",
        "longText"
      ),
    ]),
  ],
}

const WORK_STATUS_SCHEMA: DocumentTemplateSchema = {
  nodes: [
    createGroup("recipient_details", "Recipient details", [
      createField(
        "recipient_name_or_organization",
        "Recipient name or organization",
        "shortText",
        { placeholder: "Manual field" }
      ),
      createField("visit_date", "Visit date"),
      createField("document_purpose", "Document purpose", "longText"),
    ]),
    createGroup("functional_guidance", "Functional guidance", [
      createField("functional_limitations", "Functional limitations", "longText"),
      createField("allowed_activities", "Allowed activities", "stringList"),
      createField("restricted_activities", "Restricted activities", "stringList"),
      createField("restriction_period", "Restriction period", "shortText"),
      createField(
        "return_to_full_duty_date",
        "Return to full duty date",
        "shortText"
      ),
    ]),
    createGroup("follow_up", "Follow-up", [
      createField("reevaluation_plan", "Reevaluation plan", "longText"),
      createField("clinician_contact", "Clinician contact"),
      createField(
        "diagnosis_details_optional",
        "Diagnosis details (optional)",
        "longText"
      ),
    ]),
  ],
}

export const SEEDED_PUBLIC_DOCUMENTS: SeededPublicDocumentDefinition[] = [
  {
    id: "after-visit-summary",
    slug: "after-visit-summary",
    title: "After Visit Summary",
    description:
      "Patient-facing visit summary with medication changes, ordered tests, follow-up actions, and return precautions.",
    category: "discharge-and-followup",
    authorName: "Jack",
    featuredInstallCount: 184,
    schema: AFTER_VISIT_SUMMARY_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "patient",
      outputTone: "plain-language",
      contextSources: [
        "sessionMeta",
        "record",
        "insights",
        "ddx",
        "patientHandout",
      ],
      systemInstructions:
        "Write visit-specific instructions only. Do not repeat generic disease encyclopedia text already covered by patient education handouts. Keep action items concrete and easy to scan.",
      emptyValuePolicy: "BLANK",
    }),
    previewLocale: "en",
    previewContent: {
      visit_snapshot: {
        visit_reason:
          "Follow-up for poorly controlled type 2 diabetes with fatigue and intermittent numbness in both feet.",
        todays_impression:
          "Your diabetes remains above goal, but there are no signs of a foot ulcer or urgent infection today. We are intensifying treatment and prioritizing complication screening.",
        diagnosis_codes: ["5A11 Type 2 diabetes mellitus"],
      },
      medication_and_orders: {
        medication_changes: [
          "Increase metformin to 1,000 mg twice daily as tolerated.",
          "Start home blood glucose checks before breakfast and dinner.",
        ],
        tests_or_procedures_ordered: [
          "Repeat HbA1c in 3 months.",
          "Lipid panel and fasting glucose before next follow-up.",
        ],
        referrals_ordered: [
          "Ophthalmology referral for annual dilated eye exam.",
        ],
      },
      follow_up_and_safety: {
        scheduled_follow_up_date: "To be scheduled within 6 weeks",
        follow_up_plan:
          "Return in 6 weeks to review glucose logs, medication tolerance, and lab scheduling progress.",
        return_precautions: [
          "Seek urgent care for severe vomiting, dehydration, confusion, or persistent blood sugar readings above the clinic threshold discussed today.",
          "Call sooner if you develop a new foot wound, spreading redness, or rapidly worsening numbness.",
        ],
        patient_action_items: [
          "Check your feet every day and avoid walking barefoot.",
          "Bring your glucose log and medication list to the next visit.",
          "Schedule the eye exam referral this week.",
        ],
      },
    },
  },
  {
    id: "referral-request-letter",
    slug: "referral-request-letter",
    title: "Referral Request Letter",
    description:
      "Provider-to-provider referral or transfer summary that frames the clinical question, urgency, suspected findings, and workup to date.",
    category: "referral-communication",
    authorName: "Youngtak",
    featuredInstallCount: 137,
    schema: REFERRAL_REQUEST_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "clinician",
      outputTone: "clinical",
      contextSources: [
        "sessionMeta",
        "transcript",
        "doctorNotes",
        "record",
        "insights",
        "ddx",
      ],
      systemInstructions:
        "Write concise referral communication for transfer or specialist input. Focus on the referral question, urgency, suspected diagnosis or concern, pertinent findings, workup already completed, and what the receiving service is being asked to do.",
      emptyValuePolicy: "NOT_PROVIDED",
    }),
    previewLocale: "en",
    previewContent: {
      referral_request_header: {
        referring_clinician: "Dr. Maya Patel, Internal Medicine",
        receiving_clinician_or_service: "Ophthalmology clinic",
        urgency: "Routine but should be scheduled within 4 weeks",
        referral_question:
          "Please evaluate for diabetic retinopathy and complete a baseline dilated eye exam after worsening glycemic control.",
      },
      clinical_summary: {
        reason_for_referral:
          "This 58-year-old patient with type 2 diabetes has persistent hyperglycemia and reports intermittent numbness in both feet. No acute visual complaints were reported today, but annual retinal screening is overdue.",
        diagnosis_codes: ["5A11 Type 2 diabetes mellitus"],
        pertinent_history_and_findings:
          "HbA1c remains above goal despite current therapy. Foot exam today showed no ulceration or infection. The visit focused on medication intensification and complication prevention.",
        workup_completed: [
          "Medication review completed.",
          "Foot inspection completed in clinic.",
          "Repeat HbA1c and lipid panel ordered.",
        ],
        current_medications_and_allergies:
          "Metformin with planned dose escalation; no drug allergies documented in today's note.",
      },
      requested_actions_and_attachments: {
        requested_evaluation_or_service:
          "Perform retinal screening, document any diabetic eye disease, and advise on follow-up interval.",
        target_appointment_window: "Within 4 weeks",
        attachments_to_send: [
          "Most recent consultation record",
          "Updated medication list",
          "Recent diabetes labs once resulted",
        ],
      },
    },
  },
  {
    id: "consultation-reply-letter",
    slug: "consultation-reply-letter",
    title: "Consultation Reply Letter",
    description:
      "Specialist response letter summarizing impressions, workup, treatment changes, and co-management recommendations for the referring clinician.",
    category: "referral-communication",
    authorName: "Emma",
    featuredInstallCount: 96,
    schema: CONSULTATION_REPLY_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "clinician",
      outputTone: "clinical",
      contextSources: ["sessionMeta", "record", "insights", "ddx", "research"],
      systemInstructions:
        "Write as a specialist replying to a referring clinician. Summarize the impression, what was completed, what changed in treatment, and what the referring team should monitor next.",
      emptyValuePolicy: "NOT_PROVIDED",
    }),
    previewLocale: "en",
    previewContent: {
      consultation_header: {
        referring_clinician: "Dr. Elena Ruiz, Primary Care",
        specialty_service: "Rheumatology",
        reason_seen:
          "Evaluation of progressive bilateral hand pain, morning stiffness, and concern for inflammatory arthritis.",
      },
      impression_and_workup: {
        impression_and_diagnoses:
          "Presentation is most consistent with early rheumatoid arthritis with active inflammatory synovitis involving the MCP and PIP joints.",
        diagnosis_codes: ["FA20 Rheumatoid arthritis"],
        workup_or_procedures_completed: [
          "Reviewed RF and anti-CCP positivity.",
          "Confirmed elevated ESR and CRP.",
          "Exam documented symmetric MCP/PIP synovitis.",
        ],
        treatment_changes: [
          "Started methotrexate 10 mg weekly.",
          "Started folic acid 1 mg daily.",
          "Short prednisone taper prescribed for active symptoms.",
        ],
      },
      recommendations_and_follow_up: {
        recommendations_to_referring_clinician: [
          "Please monitor CBC and liver enzymes in 4 to 6 weeks.",
          "Reinforce infection precautions and pregnancy counseling as applicable.",
        ],
        co_management_requests: [
          "Coordinate vaccine review before long-term immunomodulator escalation.",
          "Continue blood pressure and general preventive care follow-up.",
        ],
        follow_up_cadence: "Rheumatology follow-up in 2 to 3 weeks, then again after lab review.",
        return_or_escalation_triggers: [
          "Urgent reassessment if rapid joint swelling progression or fever develops.",
          "Call sooner for medication intolerance or abnormal lab results.",
        ],
      },
    },
  },
  {
    id: "kr-referral-request-letter",
    slug: "kr-referral-request-letter",
    title: "진료의뢰서",
    description:
      "상급병원 또는 타과 협진을 위해 의뢰 목적, 임상 요약, 요청사항을 구조화해 전달하는 한국형 진료의뢰서입니다.",
    category: "referral-communication",
    language: "ko",
    region: "kr",
    authorName: "Rxly",
    featuredInstallCount: 64,
    schema: KR_REFERRAL_REQUEST_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "의료진",
      outputTone: "임상적",
      contextSources: [
        "sessionMeta",
        "transcript",
        "doctorNotes",
        "record",
        "insights",
        "ddx",
      ],
      systemInstructions: `한국 의료기관 간 의뢰 문서 형식으로 작성하세요. 의뢰 목적, 주요 소견, 시행한 검사, 요청사항을 간결하게 정리하세요. ${KR_EXTERNAL_METADATA_GUARDRAIL}`,
      emptyValuePolicy: "BLANK",
    }),
    previewLocale: "ko",
    previewContent: {
      referral_basics: {
        referring_clinician: "조은정 내과 전문의",
        receiving_institution: "서울권역심뇌혈관센터",
        receiving_department: "신경과",
        referral_priority: "2주 이내 진료 권고",
        referral_purpose:
          "최근 3주간 반복되는 편측 박동성 두통과 시야 흐림이 있어 정밀 평가와 추가 검사 여부 자문을 의뢰합니다.",
      },
      clinical_summary: {
        chief_issue:
          "진통제에 반응이 제한적인 두통이 주 3회 이상 발생하며, 업무 중 집중력 저하와 오심이 동반됩니다.",
        diagnosis_codes: ["8A80 편두통"],
        pertinent_findings:
          "신경학적 진찰에서 뚜렷한 국소 신경학적 이상은 없었으나, 최근 증상 빈도 증가와 시야 불편 호소로 추가 평가가 필요합니다.",
        tests_completed: [
          "기초 신경학적 진찰 시행",
          "혈압 및 활력징후 확인",
          "복용 약물 및 유발 요인 문진",
        ],
        current_treatment:
          "대증 진통제를 우선 사용 중이며 수면 부족과 업무 스트레스가 악화 요인으로 파악됩니다.",
      },
      request_and_attachments: {
        specific_request:
          "편두통과 이차성 두통 감별을 포함해 추가 검사 필요성 및 예방 치료 적응증을 평가해 주십시오.",
        submission_destination: "외래 협진 접수 창구",
        attachments_to_send: [
          "최근 진료기록 사본",
          "복용 약물 목록",
          "증상 경과 메모",
        ],
        contact_number: "수동 입력",
      },
    },
  },
  {
    id: "kr-referral-reply-letter",
    slug: "kr-referral-reply-letter",
    title: "진료회송서",
    description:
      "협진 또는 상급병원 평가 후 원의뢰 의료진에게 평가 결과와 향후 관리 계획을 전달하는 한국형 진료회송서입니다.",
    category: "referral-communication",
    language: "ko",
    region: "kr",
    authorName: "Rxly",
    featuredInstallCount: 52,
    schema: KR_REFERRAL_REPLY_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "의료진",
      outputTone: "임상적",
      contextSources: ["sessionMeta", "record", "insights", "ddx", "research"],
      systemInstructions: `한국 의료기관 간 회송 문서 형식으로 작성하세요. 평가 결과, 시행한 조치, 공동 관리 요청, 재의뢰 기준을 명확히 적으세요. ${KR_EXTERNAL_METADATA_GUARDRAIL}`,
      emptyValuePolicy: "BLANK",
    }),
    previewLocale: "ko",
    previewContent: {
      reply_basics: {
        replying_clinician: "박서현 신경과 전문의",
        original_referring_clinician: "조은정 내과 전문의",
        receiving_institution: "조은정내과의원",
        visit_date: "2026-03-06",
        reply_reason:
          "반복성 두통과 시야 흐림 증상에 대한 평가 결과 및 향후 약물 조정 계획을 공유드립니다.",
      },
      assessment_and_actions: {
        assessment_summary:
          "임상 양상은 편두통에 합당하며, 현재로서는 응급성 이차성 두통을 시사하는 소견은 뚜렷하지 않았습니다.",
        diagnosis_codes: ["8A80 편두통"],
        tests_or_procedures: [
          "신경학적 진찰 재평가",
          "두통 악화 인자 및 수면 패턴 상담",
        ],
        treatment_changes: [
          "예방 약제 시작 여부를 외래 추적 관찰 후 결정",
          "급성기 약물 사용 기준 교육",
        ],
        important_findings:
          "증상 빈도는 증가했지만 신경학적 이상 징후와 발열, 의식 변화는 확인되지 않았습니다.",
      },
      follow_up_plan: {
        co_management_requests: [
          "두통 일지 작성 여부 확인",
          "수면, 카페인, 스트레스 요인 관리 지속 교육",
        ],
        follow_up_recommendations:
          "2~4주 내 외래 추적 진료를 권고하며, 증상 악화 시 조기 재평가가 필요합니다.",
        return_triggers: [
          "새로운 국소 신경학적 증상 발생 시",
          "갑작스러운 극심한 두통 또는 지속 구토 동반 시",
        ],
        contact_number: "수동 입력",
      },
    },
  },
  {
    id: "kr-general-medical-certificate",
    slug: "kr-general-medical-certificate",
    title: "일반진단서",
    description:
      "진단명, 발병 및 진단 시점, 치료 경과와 의학적 소견을 외부 제출용으로 정리하는 한국형 일반진단서입니다.",
    category: "patient-certificates",
    language: "ko",
    region: "kr",
    authorName: "Rxly",
    featuredInstallCount: 71,
    schema: KR_MEDICAL_CERTIFICATE_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "외부 제출기관",
      outputTone: "격식체",
      contextSources: [
        "sessionMeta",
        "transcript",
        "doctorNotes",
        "record",
        "insights",
      ],
      systemInstructions: `한국 의료기관의 일반진단서 형식에 맞춰 진단명, 진단 근거, 현재 상태를 명확히 작성하세요. 진단되지 않은 내용이나 법정 고정 문구를 임의로 추가하지 마세요. ${KR_EXTERNAL_METADATA_GUARDRAIL}`,
      emptyValuePolicy: "BLANK",
    }),
    previewLocale: "ko",
    previewContent: {
      issuance_info: {
        certificate_type: "일반진단서",
        submission_destination: "회사 인사팀",
        issue_date: "2026-03-06",
        institution_code: "수동 입력",
      },
      diagnosis_info: {
        diagnosis_name:
          "급성 요추 염좌 및 근막통으로 판단되며 무거운 물건을 든 후 요통이 발생하였습니다.",
        diagnosis_codes: ["ME84 요통"],
        onset_date: "2026-03-03",
        diagnosis_date: "2026-03-06",
        clinical_basis:
          "문진상 급성 발병 경과가 확인되었고 진찰에서 요추 주위 압통과 움직임 제한이 관찰되었습니다.",
      },
      treatment_and_opinion: {
        treatment_summary:
          "소염진통제와 근이완제를 처방하고 자세 교정 및 무리한 활동 제한을 교육하였습니다.",
        current_status:
          "통증으로 장시간 서기와 반복적인 허리 굴곡 동작이 어려운 상태입니다.",
        work_or_activity_limitations:
          "초기 회복 기간 동안 중량물 취급과 반복적인 허리 사용을 피하는 것이 필요합니다.",
        clinician_opinion:
          "임상 경과상 보존적 치료와 안정이 우선 필요하며 단기간의 업무 조정이 권고됩니다.",
      },
    },
  },
  {
    id: "kr-visit-confirmation-certificate",
    slug: "kr-visit-confirmation-certificate",
    title: "진료확인서",
    description:
      "실제 진료 사실과 진료 일자, 향후 계획을 외부 제출용으로 확인해 주는 한국형 진료확인서입니다.",
    category: "patient-certificates",
    language: "ko",
    region: "kr",
    authorName: "Rxly",
    featuredInstallCount: 68,
    schema: KR_VISIT_CONFIRMATION_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "외부 제출기관",
      outputTone: "격식체",
      contextSources: [
        "sessionMeta",
        "transcript",
        "doctorNotes",
        "record",
        "insights",
      ],
      systemInstructions: `진료확인서는 실제 진료 사실, 진료 일자, 검사/처치 사실만 근거 기반으로 정리하세요. 진단 확정이 없는 내용은 단정적으로 쓰지 말고, 행정 식별 정보는 수동 입력 항목으로 남기세요. ${KR_EXTERNAL_METADATA_GUARDRAIL}`,
      emptyValuePolicy: "BLANK",
    }),
    previewLocale: "ko",
    previewContent: {
      confirmation_basics: {
        confirmation_type: "진료확인서",
        submission_destination: "학교 행정실",
        issue_date: "2026-03-06",
        contact_number: "수동 입력",
      },
      visit_facts: {
        visit_dates: ["2026-03-06"],
        department_name: "가정의학과",
        treating_clinician: "김지훈 전문의",
        visit_reason_summary:
          "발열과 인후통으로 외래 진료를 받았으며, 상기도 감염 의심 하에 진찰과 대증 치료 상담을 시행하였습니다.",
        procedures_or_tests: [
          "활력징후 측정",
          "인후부 진찰",
          "대증 치료 및 경과 관찰 교육",
        ],
      },
      follow_up_plan: {
        ongoing_treatment_plan:
          "해열진통제 복용과 수분 섭취를 유지하며 증상 악화 시 재내원을 안내하였습니다.",
        next_visit_guidance:
          "고열 지속, 호흡곤란, 삼킴 곤란이 있으면 즉시 재평가가 필요합니다.",
        additional_notes: "제출처 요구 형식은 수동 확인이 필요합니다.",
      },
    },
  },
  {
    id: "kr-outpatient-confirmation-certificate",
    slug: "kr-outpatient-confirmation-certificate",
    title: "통원확인서",
    description:
      "외래 통원 사실과 통원 일자, 진료과, 간단한 진료 요약을 제출용으로 정리하는 한국형 통원확인서입니다.",
    category: "patient-certificates",
    language: "ko",
    region: "kr",
    authorName: "Rxly",
    featuredInstallCount: 59,
    schema: KR_OUTPATIENT_CONFIRMATION_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "외부 제출기관",
      outputTone: "격식체",
      contextSources: [
        "sessionMeta",
        "transcript",
        "doctorNotes",
        "record",
        "insights",
      ],
      systemInstructions: `통원 사실 확인용 문서로서 통원 일자와 진료 사실 위주로 간결하게 작성하세요. 진단 확정이 불충분하면 진료 내용 요약 수준으로 유지하세요. ${KR_EXTERNAL_METADATA_GUARDRAIL}`,
      emptyValuePolicy: "BLANK",
    }),
    previewLocale: "ko",
    previewContent: {
      outpatient_basics: {
        submission_destination: "보험사 제출용",
        issue_date: "2026-03-06",
        department_name: "정형외과",
        contact_number: "수동 입력",
      },
      outpatient_facts: {
        outpatient_visit_dates: ["2026-03-06", "2026-03-13"],
        visit_count: "총 2회",
        treatment_summary:
          "좌측 발목 염좌로 외래 추적 진료를 시행하였고 통증 조절, 보조기 착용, 활동 제한 교육을 지속하였습니다.",
        diagnosis_codes: ["NC72 발목 염좌"],
      },
      remarks: {
        attendance_statement:
          "상기 환자는 기재된 일자에 본원 외래를 통해 통원 진료를 받은 사실이 있음을 확인합니다.",
        next_visit_guidance:
          "통증과 부종이 지속될 경우 예정된 재진일 전이라도 조기 내원을 권고하였습니다.",
      },
    },
  },
  {
    id: "kr-admission-discharge-confirmation-certificate",
    slug: "kr-admission-discharge-confirmation-certificate",
    title: "입퇴원확인서",
    description:
      "입원 및 퇴원 사실, 입원 경과, 시행한 처치와 퇴원 후 계획을 제출용으로 정리하는 한국형 입퇴원확인서입니다.",
    category: "patient-certificates",
    language: "ko",
    region: "kr",
    authorName: "Rxly",
    featuredInstallCount: 57,
    schema: KR_ADMISSION_DISCHARGE_CONFIRMATION_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "외부 제출기관",
      outputTone: "격식체",
      contextSources: [
        "sessionMeta",
        "doctorNotes",
        "record",
        "insights",
      ],
      systemInstructions: `입퇴원 사실과 입원 기간 중 진료 경과를 제출용 문서 형식으로 정리하세요. 기록에 없는 수술명, 법정 문구, 기관 식별 정보는 추가하지 마세요. ${KR_EXTERNAL_METADATA_GUARDRAIL}`,
      emptyValuePolicy: "BLANK",
    }),
    previewLocale: "ko",
    previewContent: {
      stay_info: {
        submission_destination: "회사 복지팀",
        admission_date: "2026-02-24",
        discharge_date: "2026-02-28",
        ward_or_department: "일반외과 병동",
        institution_code: "수동 입력",
      },
      treatment_summary: {
        principal_diagnosis: "급성 충수염",
        diagnosis_codes: ["DB30.4 급성 충수염"],
        hospital_course:
          "입원 후 금식과 정주 수액, 항생제 치료를 시행하였고 복강경 충수절제술 후 합병증 없이 회복하였습니다.",
        procedures_or_operations: [
          "복강경 충수절제술",
          "수술 후 통증 조절 및 상처 관리",
        ],
      },
      confirmation_and_guidance: {
        discharge_status:
          "퇴원 당시 활력징후는 안정적이었고 식이 진행 및 보행이 가능하였습니다.",
        follow_up_plan:
          "퇴원 후 1주 이내 외래 추적 관찰과 상처 부위 확인을 계획하였습니다.",
        contact_number: "수동 입력",
        additional_notes: "제출처 요구 양식에 따른 원본 확인이 필요할 수 있습니다.",
      },
    },
  },
  {
    id: "medical-necessity-letter",
    slug: "medical-necessity-letter",
    title: "Medical Necessity Letter",
    description:
      "Reviewer-facing justification letter for imaging, medications, or procedures with documented findings, prior management, and urgency.",
    category: "insurer-communication",
    authorName: "Ethan",
    featuredInstallCount: 128,
    schema: MEDICAL_NECESSITY_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "reviewer",
      outputTone: "formal",
      contextSources: ["sessionMeta", "record", "insights", "ddx", "research"],
      systemInstructions:
        "Write for a payer or utilization reviewer. Use objective findings, prior management, and evidence-based rationale when available. Never invent payer metadata or service codes.",
      emptyValuePolicy: "NOT_PROVIDED",
    }),
    previewLocale: "en",
    previewContent: {
      request_details: {
        payer_name: "North Ridge Health Plan",
        request_type: "Prior authorization",
        requested_service_or_drug: "MRI brain with and without contrast",
        service_or_drug_code: "CPT 70553",
        urgency: "Expedited outpatient review requested",
      },
      clinical_justification: {
        diagnosis_codes: ["8A80 Migraine", "BA00 Essential hypertension"],
        clinical_summary:
          "The patient has a new pattern of severe unilateral headaches with visual symptoms, nausea, and elevated blood pressure. The change in pattern and associated neurologic concern make advanced imaging medically necessary.",
        objective_findings: [
          "Persistent severe pulsating headaches for 2 weeks.",
          "Visual symptoms concerning for aura or secondary pathology.",
          "Blood pressure elevated during evaluation.",
        ],
        functional_impact:
          "Symptoms are interfering with work and daily function, and the patient cannot safely defer diagnostic clarification.",
        prior_management_and_failures: [
          "Initial symptomatic management reviewed.",
          "Neurologic exam was reassuring but not sufficient to exclude structural causes given the evolving pattern.",
        ],
      },
      supporting_rationale: {
        evidence_or_guideline_support: [
          "Advanced imaging is appropriate when headache pattern changes and associated neurologic features raise concern for secondary causes.",
          "Timely imaging will guide treatment selection and determine whether a higher-acuity pathway is needed.",
        ],
        risk_if_delayed_or_denied:
          "Delay may postpone diagnosis of a structural or vascular cause and could prolong uncontrolled symptoms with avoidable emergency utilization.",
        requested_outcome:
          "Approve MRI brain with and without contrast to complete the outpatient diagnostic workup without further delay.",
        attachments_available: [
          "Consultation record",
          "Differential diagnosis summary",
          "Relevant clinical support references",
        ],
      },
    },
  },
  {
    id: "medical-certificate",
    slug: "medical-certificate",
    title: "Medical Certificate",
    description:
      "Flexible patient-issued certificate for general, injury, or service-related requests with diagnosis date, codes, and clinician attestation.",
    category: "patient-certificates",
    language: "en",
    region: "global",
    authorName: "Hannah",
    featuredInstallCount: 154,
    schema: MEDICAL_CERTIFICATE_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "employer-or-agency",
      outputTone: "formal",
      contextSources: [
        "sessionMeta",
        "transcript",
        "doctorNotes",
        "record",
        "insights",
        "ddx",
      ],
      systemInstructions:
        "Draft a formal medical certificate for external submission. Include only clinically supported diagnoses, dates, and limitations. Do not invent identifiers, agencies, or mandatory legal phrases that are not present in the record.",
      emptyValuePolicy: "BLANK",
    }),
    previewLocale: "en",
    previewContent: {
      certificate_request: {
        certificate_type: "General medical certificate for employment submission",
        intended_use:
          "Requested for employer filing with diagnosis disclosure consented by the patient.",
        recipient_name_or_agency: "Employer occupational health office",
        issuance_date: "2026-03-06",
        visit_or_assessment_date: "2026-03-06",
      },
      diagnostic_basis: {
        diagnosis_or_condition_summary:
          "The patient was evaluated for acute lumbar strain after a lifting injury with persistent low back pain and muscle spasm, without focal neurologic deficit.",
        diagnosis_codes: ["ME84 Low back pain"],
        diagnosis_date: "2026-03-06",
        onset_or_injury_date: "2026-03-03",
        injury_or_service_context:
          "Symptoms began after heavy lifting at work and are consistent with an acute musculoskeletal strain.",
      },
      certification_statement: {
        current_treatment_status:
          "Conservative treatment has been started with analgesics, activity modification, and home exercise guidance.",
        functional_or_service_impact:
          "Pain currently limits repetitive bending, lifting, and prolonged standing. Full duty is not advisable during the early recovery period.",
        expected_recovery_or_follow_up:
          "Reevaluation planned within 1 to 2 weeks",
        clinician_attestation:
          "This certificate reflects the findings documented during clinical assessment and is issued at the patient's request.",
        mandatory_statements_or_attachments: [
          "Diagnosis code included",
          "Initial assessment date documented",
          "Issued for administrative submission only",
        ],
      },
    },
  },
  {
    id: "medical-leave-certificate",
    slug: "medical-leave-certificate",
    title: "Medical Leave Certificate",
    description:
      "Formal sick leave or leave-of-absence certificate for work or school with incapacity rationale and recommended rest period.",
    category: "patient-certificates",
    language: "en",
    region: "global",
    authorName: "Oliver",
    featuredInstallCount: 167,
    schema: MEDICAL_LEAVE_CERTIFICATE_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "employer-or-school",
      outputTone: "formal",
      contextSources: [
        "sessionMeta",
        "transcript",
        "doctorNotes",
        "record",
        "insights",
      ],
      systemInstructions:
        "Write a medical leave certificate when the patient should be fully excused from work or school. State the supported reason for incapacity, the recommended rest period, and the follow-up plan without adding unsupported diagnosis details.",
      emptyValuePolicy: "BLANK",
    }),
    previewLocale: "en",
    previewContent: {
      leave_request: {
        leave_type: "Medical leave certificate for work absence",
        recipient_organization: "Employer HR department",
        assessment_date: "2026-03-06",
        leave_start_date: "2026-03-06",
        expected_return_date: "2026-03-16",
        recommended_leave_duration: "10 calendar days",
      },
      clinical_rationale: {
        condition_summary:
          "Acute exacerbation of asthma with persistent cough, nocturnal symptoms, and reduced exercise tolerance requiring intensified treatment and rest.",
        diagnosis_codes: ["CA23 Asthma"],
        functional_limitations:
          "The patient is temporarily unable to safely perform regular duties because exertion and prolonged speaking provoke cough and dyspnea.",
        why_patient_should_be_excused:
          "Short-term leave is recommended to allow symptom stabilization, medication adjustment, and trigger avoidance during recovery.",
      },
      recovery_plan: {
        rest_or_accommodations_instructions: [
          "Avoid dust, smoke, and heavy exertion during the leave period.",
          "Use rescue and controller medications exactly as prescribed.",
        ],
        follow_up_plan:
          "Follow up within 1 week to reassess symptom control and confirm readiness to return.",
        reevaluation_date: "2026-03-13",
        clinician_contact: "Pulmonary clinic contact on file",
      },
    },
  },
  {
    id: "treatment-confirmation-letter",
    slug: "treatment-confirmation-letter",
    title: "Treatment Confirmation Letter",
    description:
      "Proof-of-visit or ongoing-treatment letter for employers, schools, or administrative submissions with encounter dates and care summary.",
    category: "patient-certificates",
    language: "en",
    region: "global",
    authorName: "Mia",
    featuredInstallCount: 142,
    schema: TREATMENT_CONFIRMATION_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "third-party reviewer",
      outputTone: "formal",
      contextSources: [
        "sessionMeta",
        "transcript",
        "doctorNotes",
        "record",
        "insights",
      ],
      systemInstructions:
        "Confirm attendance or ongoing treatment using encounter dates and clinically supported care details. Keep the wording suitable for third-party submission and avoid unnecessary disclosure beyond what the record supports.",
      emptyValuePolicy: "BLANK",
    }),
    previewLocale: "en",
    previewContent: {
      confirmation_request: {
        confirmation_type: "Outpatient treatment confirmation",
        document_purpose:
          "Submission to school and private insurer for proof of evaluation and follow-up.",
        recipient_name_or_organization: "School administration office",
        issue_date: "2026-03-06",
      },
      encounter_summary: {
        encounter_dates: ["2026-03-06 outpatient consultation"],
        department_or_service: "Internal Medicine",
        treating_clinician: "Dr. Maya Patel",
        diagnosis_codes: ["5A11 Type 2 diabetes mellitus"],
        tests_treatments_or_procedures: [
          "Medication review and dose adjustment",
          "Diabetic foot examination",
          "HbA1c and lipid panel ordered",
        ],
      },
      confirmation_statement: {
        confirmation_text:
          "This is to confirm that the patient attended clinic evaluation and continues to receive outpatient treatment for the above condition.",
        treatment_course_or_follow_up:
          "Ongoing follow-up is planned to monitor glycemic control and complication screening.",
        attachments_available: ["Medication list", "Follow-up plan"],
      },
    },
  },
  {
    id: "hospitalization-and-surgery-confirmation",
    slug: "hospitalization-and-surgery-confirmation",
    title: "Hospitalization and Surgery Confirmation",
    description:
      "Admission, discharge, and procedure confirmation for insurance, employer, or school submission with major hospital-course details.",
    category: "patient-certificates",
    language: "en",
    region: "global",
    authorName: "Lucas",
    featuredInstallCount: 119,
    schema: HOSPITALIZATION_CONFIRMATION_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "third-party reviewer",
      outputTone: "formal",
      contextSources: [
        "sessionMeta",
        "transcript",
        "doctorNotes",
        "record",
        "insights",
        "ddx",
      ],
      systemInstructions:
        "Summarize a documented admission, observation stay, or surgery for external confirmation. Include dates, the principal diagnosis, the major hospital course, and recovery guidance only when supported by the record.",
      emptyValuePolicy: "BLANK",
    }),
    previewLocale: "en",
    previewContent: {
      stay_or_procedure_details: {
        confirmation_scope: "Hospitalization and surgery confirmation",
        facility_or_service: "General surgery service",
        admission_date: "2026-02-14",
        discharge_date: "2026-02-16",
        procedure_or_operation_date: "2026-02-14",
      },
      clinical_summary: {
        principal_diagnosis: "Acute appendicitis",
        diagnosis_codes: ["DB10 Acute appendicitis"],
        reason_for_admission_or_procedure:
          "Admitted through the emergency department for acute right lower quadrant pain with imaging-confirmed appendicitis.",
        procedure_or_operation: "Laparoscopic appendectomy",
        hospital_course_or_major_findings:
          "Surgery was completed without major complication. The patient recovered well postoperatively and was discharged in stable condition.",
      },
      recovery_and_attestation: {
        discharge_status: "Discharged home in stable condition",
        recommended_recovery_period:
          "2 weeks of postoperative recovery before unrestricted activity",
        follow_up_plan:
          "Surgical follow-up in 1 to 2 weeks for wound check and pathology review.",
        certification_statement:
          "This confirmation summarizes the documented admission, operative care, and discharge course for administrative or insurance submission.",
      },
    },
  },
  {
    id: "insurance-claim-medical-confirmation",
    slug: "insurance-claim-medical-confirmation",
    title: "Insurance Claim Medical Confirmation",
    description:
      "Claim-supporting medical confirmation for patients submitting reimbursement requests with encounter details, diagnoses, and documented treatments.",
    category: "insurer-communication",
    language: "en",
    region: "global",
    authorName: "Ava",
    featuredInstallCount: 173,
    schema: INSURANCE_CLAIM_CERTIFICATE_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "reviewer",
      outputTone: "formal",
      contextSources: [
        "sessionMeta",
        "transcript",
        "doctorNotes",
        "record",
        "insights",
        "ddx",
      ],
      systemInstructions:
        "Prepare an insurance claim support certificate that confirms medically necessary encounters and treatments from the chart. Do not invent insurer metadata, claim identifiers, billing codes, or covered benefits.",
      emptyValuePolicy: "NOT_PROVIDED",
    }),
    previewLocale: "en",
    previewContent: {
      claim_request: {
        insurer_name: "Blue Horizon Insurance",
        claim_reference_optional: "Claim intake pending",
        issue_date: "2026-03-06",
        encounter_dates: [
          "2026-03-01 urgent outpatient visit",
          "2026-03-06 follow-up visit",
        ],
        claim_purpose: "Medical confirmation for reimbursement claim",
      },
      treatment_details: {
        diagnosis_codes: ["8A80 Migraine"],
        visit_reason:
          "Evaluation and follow-up for severe unilateral headache with nausea and photophobia.",
        services_and_treatments_provided: [
          "Neurologic assessment and blood pressure check",
          "Review of red-flag symptoms and return precautions",
          "Prescription treatment plan and imaging recommendation",
        ],
        prescribed_medications_or_devices: [
          "Abortive migraine medication prescribed",
          "Home blood pressure monitoring advised",
        ],
        medical_necessity_summary:
          "Visits and recommended workup were medically necessary because of a new severe headache pattern requiring diagnostic assessment and treatment planning.",
      },
      supporting_documentation: {
        place_of_service: "Outpatient neurology clinic",
        clinician_or_department: "Neurology",
        supporting_documents: [
          "Consultation record",
          "Medication list",
          "Imaging order",
        ],
        claim_certification_statement:
          "This document confirms the medically necessary encounters and treatment elements documented in the clinical record for insurance claim support.",
      },
    },
  },
  {
    id: "return-to-activity-clearance",
    slug: "return-to-activity-clearance",
    title: "Return-to-Activity Clearance",
    description:
      "Return-to-work, school, or activity clearance with current clinical status, restrictions, and reassessment guidance.",
    category: "patient-certificates",
    language: "en",
    region: "global",
    authorName: "Chloe",
    featuredInstallCount: 88,
    schema: RETURN_TO_ACTIVITY_CLEARANCE_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "employer-or-school",
      outputTone: "formal",
      contextSources: [
        "sessionMeta",
        "transcript",
        "doctorNotes",
        "record",
        "insights",
      ],
      systemInstructions:
        "Draft a return-to-activity clearance only when the chart supports that the patient can resume work, school, sport, or travel. State the clearance status, any restrictions, and when reassessment is needed.",
      emptyValuePolicy: "BLANK",
    }),
    previewLocale: "en",
    previewContent: {
      clearance_request: {
        clearance_type: "Return-to-work and school clearance",
        recipient_name_or_organization: "Employer and academic affairs office",
        evaluation_date: "2026-03-20",
        target_return_date: "2026-03-21",
      },
      current_status: {
        condition_summary:
          "Symptoms from viral gastroenteritis have resolved, hydration is restored, and the patient is tolerating normal oral intake.",
        diagnosis_codes: ["1A40 Viral gastroenteritis"],
        treatment_completed_or_ongoing:
          "Supportive care is complete with no further fever, vomiting, or diarrhea.",
        current_functional_status:
          "The patient is clinically improved and able to resume routine daily activities.",
      },
      clearance_decision: {
        clearance_status:
          "Cleared to return with temporary pacing as tolerated",
        restrictions_or_accommodations: [
          "Avoid heavy exertion for 48 hours",
          "Maintain hydration and regular meals",
        ],
        follow_up_or_restriction_end_date:
          "Restrictions end on 2026-03-23 if recovery continues",
        warning_signs_or_reassessment:
          "Seek reassessment for recurrent fever, inability to maintain hydration, worsening abdominal pain, or return of frequent vomiting or diarrhea.",
      },
    },
  },
  {
    id: "longitudinal-care-plan",
    slug: "longitudinal-care-plan",
    title: "Longitudinal Care Plan",
    description:
      "Problem-oriented care plan for chronic specialty follow-up with goals, interventions, monitoring metrics, and escalation criteria.",
    category: "care-plan",
    authorName: "Mason",
    featuredInstallCount: 74,
    schema: LONGITUDINAL_CARE_PLAN_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "care-team",
      outputTone: "clinical",
      contextSources: [
        "sessionMeta",
        "record",
        "insights",
        "ddx",
        "research",
        "patientHandout",
      ],
      systemInstructions:
        "Write a longitudinal management plan rather than a single-visit note. Organize by problems, measurable goals, interventions, monitoring, and escalation triggers.",
      emptyValuePolicy: "NOT_PROVIDED",
    }),
    previewLocale: "en",
    previewContent: {
      care_plan_overview: {
        primary_condition_focus:
          "Early rheumatoid arthritis with active inflammatory symptoms requiring disease control and lab safety monitoring.",
        active_problems: [
          "Inflammatory hand pain and morning stiffness",
          "High risk of progressive joint damage without early control",
          "Need for methotrexate safety monitoring",
        ],
        health_concerns: [
          "Pain and functional limitation affecting daily tasks",
          "Medication tolerability and infection risk",
        ],
      },
      goals_and_interventions: {
        care_goals: [
          {
            goal: "Reduce morning stiffness and hand pain to low disease activity range.",
            interventions: [
              "Continue methotrexate weekly with folic acid.",
              "Use short prednisone taper only as prescribed.",
            ],
            monitoring_metric: "Patient symptom diary and joint exam at follow-up",
            target_timeframe: "2 to 6 weeks",
          },
          {
            goal: "Prevent treatment toxicity while therapy is escalated.",
            interventions: [
              "Check CBC and liver enzymes.",
              "Review infection precautions and medication adherence.",
            ],
            monitoring_metric: "CBC, AST/ALT, symptom review",
            target_timeframe: "4 to 6 weeks",
          },
        ],
      },
      monitoring_and_escalation: {
        monitoring_plan: [
          "Repeat CBC and liver enzymes in 4 to 6 weeks.",
          "Assess swollen joint count and morning stiffness at each rheumatology visit.",
        ],
        expected_outcomes:
          "Short-term symptom reduction with improved hand function, followed by sustained low disease activity if medication response is adequate.",
        escalation_criteria: [
          "Escalate therapy if persistent synovitis or functional decline continues despite methotrexate adherence.",
          "Urgent review if fever, severe mouth sores, dyspnea, or concerning lab abnormalities occur.",
        ],
        patient_or_caregiver_responsibilities: [
          "Take methotrexate exactly once weekly.",
          "Report infection symptoms or medication side effects promptly.",
          "Complete ordered lab work before the next visit.",
        ],
        next_review_date: "Rheumatology follow-up in 3 weeks",
      },
    },
  },
  {
    id: "procedure-note",
    slug: "procedure-note",
    title: "Procedure Note",
    description:
      "Specialty office procedure documentation for indication, consent, technique, findings, complications, and aftercare.",
    category: "clinical-documentation",
    authorName: "Owen",
    featuredInstallCount: 111,
    schema: PROCEDURE_NOTE_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "clinician",
      outputTone: "clinical",
      contextSources: ["sessionMeta", "transcript", "doctorNotes", "record", "insights"],
      systemInstructions:
        "Document office procedure details precisely. If a critical procedural detail is absent, leave it not provided rather than inferring technique, medications, consent, or complications.",
      emptyValuePolicy: "NOT_PROVIDED",
    }),
    previewLocale: "en",
    previewContent: {
      procedure_overview: {
        procedure_name: "Right knee corticosteroid injection",
        site_or_laterality: "Right knee, anterolateral approach",
        indication:
          "Persistent inflammatory knee pain limiting ambulation despite oral analgesics and activity modification.",
        consent_discussed:
          "Risks, benefits, alternatives, infection risk, bleeding risk, and expected post-injection soreness were reviewed with the patient. Verbal consent obtained.",
        time_out_or_preprocedure_checks:
          "Correct patient, site, medication, and laterality confirmed immediately before injection.",
      },
      procedure_details: {
        technique:
          "Skin prepped in sterile fashion. Local landmark-guided injection performed without immediate difficulty.",
        medications_or_anesthesia:
          "Triamcinolone with local anesthetic injected using sterile technique.",
        findings:
          "No purulence or unexpected resistance encountered. Patient reported immediate mild pain relief.",
        specimens_or_implants: "No specimen collected. No implant used.",
      },
      outcome_and_aftercare: {
        complications: "No immediate complication observed.",
        patient_tolerance: "Patient tolerated the procedure well.",
        post_procedure_instructions: [
          "Rest the knee for the remainder of the day.",
          "Use ice for post-procedure soreness as needed.",
          "Call for fever, rapidly increasing pain, drainage, or inability to bear weight.",
        ],
        follow_up_plan:
          "Reassess pain, swelling, and function at the next specialty follow-up or sooner if red flags develop.",
      },
    },
  },
  {
    id: "work-status-note",
    slug: "work-status-note",
    title: "Work Status Note",
    description:
      "Modified-duty or attendance restriction note for work or school when the patient needs temporary limits rather than full leave.",
    category: "patient-certificates",
    language: "en",
    region: "global",
    authorName: "Sophie",
    featuredInstallCount: 133,
    schema: WORK_STATUS_SCHEMA,
    generationConfig: createGenerationConfig({
      audience: "employer-or-school",
      outputTone: "plain-language",
      contextSources: ["sessionMeta", "record", "insights"],
      systemInstructions:
        "Use this note for modified duty or partial attendance, not full leave. Keep the note focused on functional restrictions, duration, and reevaluation. Do not disclose diagnosis details unless the consultation explicitly supports disclosure or the clinician later fills the optional diagnosis field.",
      emptyValuePolicy: "BLANK",
    }),
    previewLocale: "en",
    previewContent: {
      recipient_details: {
        recipient_name_or_organization: "Employer HR department",
        visit_date: "2026-03-06",
        document_purpose:
          "Temporary activity restriction note following evaluation for acute exacerbation of low back pain.",
      },
      functional_guidance: {
        functional_limitations:
          "The patient should avoid repetitive bending, heavy lifting, and prolonged unsupported standing during the acute recovery period.",
        allowed_activities: [
          "Desk-based work as tolerated",
          "Short walking breaks",
          "Home exercise program from physical therapy",
        ],
        restricted_activities: [
          "Lifting more than 15 pounds",
          "Repeated twisting or ladder climbing",
          "Extended field duty without position changes",
        ],
        restriction_period: "10 business days",
        return_to_full_duty_date: "Pending reevaluation at follow-up",
      },
      follow_up: {
        reevaluation_plan:
          "Reevaluate symptoms and work tolerance at follow-up after the initial therapy period. Restrictions may be advanced earlier if recovery outpaces expectations.",
        clinician_contact: "Spine clinic nursing line on file",
        diagnosis_details_optional: "",
      },
    },
  },
]
