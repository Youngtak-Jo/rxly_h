import type { SampleConsultationFixturePack } from "@/lib/sample-consultations/types"
import { SAMPLE_PACK_VERSION } from "@/lib/sample-consultations/types"

const fixturePack = {
  "generatedAt": "2026-03-12T12:46:12.696Z",
  "samples": [
    {
      "key": "chest-pain",
      "scenarioId": "chest-pain",
      "sessionTitle": "Example · Chest Pain Evaluation",
      "patientName": "Michael Turner",
      "startedAt": "2026-03-05T09:00:00.000Z",
      "insights": {
        "summary": "55-year-old male with one week of exertional squeezing chest pressure radiating to left arm and jaw, associated with dyspnea and diaphoresis, resolving with rest. Strong family history of CAD, former heavy smoker, hyperlipidemia, and borderline hypertension; exam normal but ECG shows nonspecific ST-T changes. Doctor initiated aspirin, atorvastatin, nitroglycerin, ordered troponin/labs, and plans stress test.",
        "keyFindings": [
          "Exertional central chest pressure (6-7/10), radiates to left arm/jaw, lasts 3-5 min, relieves with rest; also with emotional stress",
          "Associated dyspnea and diaphoresis; no rest pain, nausea, or dizziness",
          "Risk factors: 25 pack-year smoking history (quit 2 yrs ago), family history CAD (father MI at 58, brother CABG at 62), hyperlipidemia, BP 140/88",
          "Exam normal; ECG normal sinus with nonspecific lateral ST-T changes",
          "Started aspirin 81mg, atorvastatin 40mg, SL NTG; labs ordered including troponin; stress test planned"
        ],
        "redFlags": [
          "Classic angina symptoms with high CAD risk and ECG changes",
          "Pending troponin - if elevated, requires urgent cardiology intervention",
          "Recent severe episode prompting visit"
        ],
        "diagnosticKeywords": [
          {
            "phrase": "chest pain",
            "category": "symptom"
          },
          {
            "phrase": "pressure in my chest",
            "category": "symptom"
          },
          {
            "phrase": "walking up the stairs",
            "category": "symptom"
          },
          {
            "phrase": "center of my chest",
            "category": "symptom"
          },
          {
            "phrase": "behind the breastbone",
            "category": "symptom"
          },
          {
            "phrase": "spreads to my left arm",
            "category": "symptom"
          },
          {
            "phrase": "up into my jaw",
            "category": "symptom"
          },
          {
            "phrase": "squeezing or heavy pressure",
            "category": "symptom"
          },
          {
            "phrase": "short of breath",
            "category": "symptom"
          },
          {
            "phrase": "sweating more than usual",
            "category": "symptom"
          },
          {
            "phrase": "smoked a pack a day",
            "category": "finding"
          },
          {
            "phrase": "family history of heart disease",
            "category": "finding"
          },
          {
            "phrase": "father had a heart attack",
            "category": "finding"
          },
          {
            "phrase": "cholesterol was high",
            "category": "finding"
          },
          {
            "phrase": "blood pressure one thirty-five over eighty-five",
            "category": "vital"
          },
          {
            "phrase": "blood pressure one forty over eighty-eight",
            "category": "vital"
          },
          {
            "phrase": "heart rate is seventy-six",
            "category": "vital"
          },
          {
            "phrase": "lungs are clear bilaterally",
            "category": "finding"
          },
          {
            "phrase": "heart sounds are normal",
            "category": "finding"
          },
          {
            "phrase": "no murmurs",
            "category": "finding"
          },
          {
            "phrase": "nonspecific ST-T wave changes",
            "category": "finding"
          },
          {
            "phrase": "normal sinus rhythm",
            "category": "finding"
          },
          {
            "phrase": "troponin level",
            "category": "finding"
          },
          {
            "phrase": "angina",
            "category": "diagnosis"
          },
          {
            "phrase": "aspirin eighty-one milligrams",
            "category": "medication"
          },
          {
            "phrase": "atorvastatin forty milligrams",
            "category": "medication"
          },
          {
            "phrase": "sublingual nitroglycerin tablets",
            "category": "medication"
          }
        ],
        "checklistItems": [
          {
            "label": "Obtain/review troponin and lab results (CMP, lipid panel, CBC)",
            "isChecked": false,
            "isAutoChecked": false,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Schedule cardiac stress test within 1 week",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Prescribe aspirin, statin, sublingual nitroglycerin and educate on use",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Educate on red flag symptoms requiring 911 (rest pain >10min, severe SOB, etc.)",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Advise activity restrictions until stress test",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Follow-up in 1 week to review stress test and meds",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Assess blood pressure management and lifestyle counseling (diet, etc.)",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          }
        ],
        "metadata": {
          "modelId": "grok-4-1-fast-non-reasoning",
          "promptFamily": "insights",
          "generatedAt": "2026-03-12T12:46:12.697Z"
        }
      },
      "diagnoses": [
        {
          "icdCode": "BA80",
          "diseaseName": "Chronic ischaemic heart disease - Stable angina pectoris",
          "confidence": "high",
          "evidence": "Classic presentation of exertional squeezing chest pressure (6-7/10) radiating to left arm and jaw, lasting 3-5 minutes, relieved by rest. Associated dyspnea and diaphoresis with exertion. Multiple major CAD risk factors: 25 pack-year smoking history, strong family history (father MI at 58, brother CABG at 62), hyperlipidemia, and borderline hypertension (140/88). ECG shows nonspecific lateral ST-T changes. Symptom pattern is highly consistent with stable angina pectoris.",
          "citations": [
            {
              "source": "icd11",
              "title": "BA40.Z - Angina pectoris, unspecified",
              "url": "https://icd.who.int/browse/2024-01/mms/en#unspecified"
            },
            {
              "source": "europe_pmc",
              "title": "Brazilian Guideline for Exercise Test in the Adult Population - 2024.",
              "url": "https://europepmc.org/article/MED/38896581",
              "snippet": "Guidelines for exercise stress testing in adult populations, relevant to diagnostic workup of suspected stable angina."
            },
            {
              "source": "europe_pmc",
              "title": "Broad Electrocardiogram Syndromes Spectrum: From Common Emergencies to Particular Electrical Heart Disorders.",
              "url": "https://europepmc.org/article/MED/36573711",
              "snippet": "Review of ECG patterns including ST-T wave changes associated with ischemic heart disease."
            },
            {
              "source": "clinical_trials",
              "title": "Aerobic Exercise-induced Effect on Endothelial Function in Patients With Ischaemic Heart Disease",
              "url": "https://clinicaltrials.gov/study/NCT06788275"
            },
            {
              "source": "clinical_trials",
              "title": "High-intensity Exercise After Acute Cardiac Event (HITCARE)",
              "url": "https://clinicaltrials.gov/study/NCT02235753"
            },
            {
              "source": "dailymed",
              "title": "ANGINA DROPS 2083 (ANGINA DROPS) LIQUID [PROFESSIONAL COMPLEMENTARY HEALTH FORMULAS]",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=99516597-9f59-4123-bd35-a4a73dd54d2d"
            }
          ]
        },
        {
          "icdCode": "BA40.0",
          "diseaseName": "Unstable angina",
          "confidence": "moderate",
          "evidence": "Recent escalation in symptom severity prompting the visit raises concern for unstable angina. One-week history of new-onset exertional chest pain with classic anginal features in a high-risk patient with nonspecific ST-T changes on ECG. Troponin results are pending — if negative, this may represent new-onset angina progressing toward instability. The recent severe episode is a red flag for acute coronary syndrome.",
          "citations": [
            {
              "source": "icd11",
              "title": "BA40.0 - Unstable angina",
              "url": "https://icd.who.int/browse/2024-01/mms/en#253490233"
            },
            {
              "source": "europe_pmc",
              "title": "Integration of ECG and Point-of-Care Ultrasound in the Diagnosis of Wellens' Syndrome with Acute Heart Failure: A Case Report.",
              "url": "https://europepmc.org/article/MED/41096066",
              "snippet": "Case report demonstrating the importance of ECG changes in diagnosing acute coronary syndromes including Wellens' pattern."
            },
            {
              "source": "openfda",
              "title": "Drug adverse event reports related to unstable angina and exertional chest pain",
              "url": "https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:unstable%20angina%20exertional%20chest%20pain%20diagnosis"
            },
            {
              "source": "clinical_trials",
              "title": "Coronary Microcirculatory Disease and Inflammation in Patients With Chronic Coronary Syndrome and no Significant Coronary Artery Stenosis",
              "url": "https://clinicaltrials.gov/study/NCT05313919"
            }
          ]
        },
        {
          "icdCode": "BA41",
          "diseaseName": "Acute myocardial infarction (NSTEMI)",
          "confidence": "moderate",
          "evidence": "Cannot be excluded until troponin results return. Classic anginal symptoms with radiation to arm and jaw, diaphoresis, and nonspecific ST-T changes on ECG in a 55-year-old male with multiple CAD risk factors. The recent severe episode prompting the visit and pending troponin are critical red flags. If troponin is elevated, this would require urgent cardiology intervention.",
          "citations": [
            {
              "source": "icd11",
              "title": "BA40.0 - Unstable angina",
              "url": "https://icd.who.int/browse/2024-01/mms/en#253490233"
            },
            {
              "source": "europe_pmc",
              "title": "Getting to the Heart of the Matter: Myocardial Injury, Coagulopathy, and Other Potential Cardiovascular Implications of COVID-19.",
              "url": "https://europepmc.org/article/MED/34035963",
              "snippet": "Discussion of myocardial injury biomarkers including troponin elevation in cardiac conditions."
            },
            {
              "source": "europe_pmc",
              "title": "Integration of ECG and Point-of-Care Ultrasound in the Diagnosis of Wellens' Syndrome with Acute Heart Failure: A Case Report.",
              "url": "https://europepmc.org/article/MED/41096066",
              "snippet": "Demonstrates ECG and biomarker integration in acute coronary syndrome diagnosis."
            }
          ]
        }
      ],
      "research": [
        {
          "question": "What are the outpatient best practices for risk stratifying stable exertional chest pain that is concerning for angina?",
          "answer": "## Outpatient Risk Stratification of Stable Exertional Chest Pain Concerning for Angina\n\n### Context for This Patient\n\nThis 55-year-old male presents with classic features of **stable angina pectoris**: exertional squeezing chest pressure radiating to the left arm and jaw, associated with dyspnea and diaphoresis, relieved by rest, lasting 3–5 minutes. Per ICD-11, this aligns with the classification of **Stable angina (BA40.1)** [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#216789527). Given his multiple risk factors (former heavy smoker, family history of premature CAD, hyperlipidemia, borderline hypertension) and nonspecific ECG changes, systematic risk stratification is essential.\n\n> **Important:** The pending troponin result must be reviewed urgently. If elevated, the diagnosis shifts toward **Unstable angina (BA40.0)** [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#253490233) or acute coronary syndrome, requiring emergent cardiology referral rather than outpatient workup.\n\n---\n\n## Step 1: Pre-Test Probability Assessment\n\n### Determine the Likelihood of Obstructive CAD\n\nThe first step in outpatient risk stratification is estimating the **pre-test probability (PTP)** of obstructive coronary artery disease. Current guidelines (2021 AHA/ACC Chest Pain Guidelines) recommend using validated clinical frameworks rather than older Diamond-Forrester models, which overestimated risk.\n\nKey variables include:\n\n- **Age and sex** — 55-year-old male (intermediate-to-high baseline risk)\n- **Symptom typicality** — This patient has **typical angina** (all 3 criteria: substernal chest discomfort, provoked by exertion/emotional stress, relieved by rest/nitroglycerin)\n- **Cardiovascular risk factors** — Multiple (smoking history, family history, dyslipidemia, borderline HTN)\n- **ECG findings** — Nonspecific ST-T wave changes at rest increase suspicion\n\n### PTP Classification\n\n| PTP Category | Estimated Probability | Recommended Action |\n|---|---|---|\n| Low (<15%) | CAD unlikely | Consider deferring testing |\n| Intermediate (15–65%) | Uncertain | Proceed with diagnostic testing |\n| High (>65%) | CAD likely | Proceed directly to testing or empiric therapy |\n\n**For this patient**, the combination of typical angina in a 55-year-old male with multiple risk factors places him in the **high PTP category (>65%)**, warranting definitive diagnostic testing [[EPMC]](https://europepmc.org/article/MED/38204849).\n\n---\n\n## Step 2: Choose the Appropriate Diagnostic Testing Strategy\n\nA comprehensive review of chest pain diagnostic evaluation emphasizes that the choice of test depends on PTP, patient characteristics, and local expertise [[EPMC]](https://europepmc.org/article/MED/38204849).\n\n### Functional (Stress) Testing\n\nFunctional testing remains a cornerstone for patients with intermediate-to-high PTP who can exercise.\n\n| Test Modality | Best Candidates | Sensitivity/Specificity | Key Advantages |\n|---|---|---|---|\n| **Exercise ECG (treadmill)** | Patients who can exercise, interpretable baseline ECG | ~68% / ~77% | Low cost, prognostic data (Duke Treadmill Score) |\n| **Stress echocardiography** | Abnormal baseline ECG, need for wall motion assessment | ~85% / ~82% | No radiation, assesses valvular function |\n| **Stress MPI (nuclear)** | Cannot exercise (with pharmacologic stress), obesity | ~87% / ~73% | Quantifies ischemic burden, strong prognostic data |\n| **Stress CMR (cardiac MRI)** | Need for tissue characterization | ~89% / ~87% | No radiation, excellent spatial resolution |\n\n**For this patient:** The nonspecific ST-T changes on resting ECG may limit the interpretability of a standard **exercise ECG**. A **stress imaging test** (stress echocardiography or stress MPI) is preferred to improve diagnostic accuracy. If he can achieve adequate exercise capacity, an **exercise stress echocardiogram** is an excellent first-line choice.\n\n### Anatomical Testing\n\n**Coronary CT Angiography (CCTA)** has emerged as a powerful alternative or complement to functional testing, particularly endorsed by 2021 AHA/ACC and ESC guidelines.\n\n- **Sensitivity >95%** for detecting obstructive CAD; excellent **negative predictive value**\n- Best suited for patients with low-to-intermediate PTP\n- Can be combined with **CT-derived fractional flow reserve (CT-FFR)** to assess hemodynamic significance\n\n### Role of Coronary Artery Calcium (CAC) Scoring\n\nA landmark study demonstrated that **coronary calcium scoring significantly improves risk prediction** in patients with suspected obstructive CAD. Specifically, a **CAC score of 0** has a very high negative predictive value for obstructive CAD and can help safely defer further invasive testing, while high CAC scores (>400) strongly predict obstructive disease [[EPMC]](https://europepmc.org/article/MED/36396197).\n\n- CAC scoring is most useful as a **gatekeeper** before CCTA or functional testing in intermediate-risk patients\n- For this high-risk patient, CAC scoring alone is insufficient — but it can inform the overall risk profile\n\n### Integrating Anatomical and Functional Data\n\nThe **Dan-NICAD 3 trial** is investigating the optimal diagnostic strategy combining non-invasive anatomical and functional tests, reflecting the evolving paradigm of using CCTA as a first-line test followed by functional assessment for hemodynamic significance when stenosis is found [[EPMC]](https://europepmc.org/article/MED/37487656).\n\nWhen CCTA identifies intermediate stenosis, **dobutamine stress echocardiography** can be used to assess functional significance, with fractional flow reserve (FFR) and instantaneous wave-free ratio (iFR) serving as invasive reference standards [[EPMC]](https://europepmc.org/article/MED/39349050).\n\n---\n\n## Step 3: Risk Stratification Based on Test Results\n\n### High-Risk Features on Stress Testing (Warrant Catheterization)\n\n- **Duke Treadmill Score ≤ −11** (high risk)\n- Large area of ischemia (>10% myocardium on MPI)\n- Stress-induced LV dysfunction or multiple wall motion abnormalities\n- Ischemia at low workload (<5 METs) or low heart rate\n- Exercise-induced hypotension or sustained ventricular arrhythmia\n\n### High-Risk Features on CCTA\n\n- **Left main stenosis ≥50%**\n- **Three-vessel disease** with ≥70% stenosis\n- **Proximal LAD stenosis ≥70%**\n- High-risk plaque features (positive remodeling, low-attenuation plaque, napkin-ring sign)\n\n### Intermediate/Low-Risk Results\n\n- Small area of ischemia or single-vessel non-proximal disease → **Optimal medical therapy (OMT)** with close follow-up\n- Normal stress test or CAC = 0 → Consider alternative diagnoses; reassess symptoms\n\n---\n\n## Step 4: Recommended Approach for This Patient\n\nGiven this patient's **high pre-test probability** and clinical profile, the following stepwise approach is recommended:\n\n1. **Confirm troponin is negative** — If positive, escalate to urgent cardiology evaluation for possible ACS [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#253490233)\n\n2. **Proceed with stress imaging** — An **exercise stress echocardiogram** is preferred given the nonspecific baseline ECG changes. If unable to exercise adequately, use **pharmacologic stress MPI or stress echo**\n\n3. **Consider CCTA as an alternative** — Especially if stress testing is equivocal or unavailable; CCTA with CAC scoring provides both anatomical and prognostic information [[EPMC]](https://europepmc.org/article/MED/36396197)\n\n4. **Risk-stratify based on results:**\n   - High-risk findings → **Refer for invasive coronary angiography ± revascularization**\n   - Intermediate findings → **Intensify medical therapy, consider FFR-guided management**\n   - Low-risk findings → **Continue OMT, reassess for non-cardiac causes**\n\n5. **Optimize medical therapy concurrently:**\n   - **Aspirin 81 mg** daily — appropriate\n   - **Atorvastatin 40 mg** — consider uptitrating to **80 mg** given high-risk profile (target LDL <70 mg/dL)\n   - **Sublingual nitroglycerin** PRN — appropriate for symptom relief\n   - **Consider adding a beta-blocker** (e.g., metoprolol succinate) for anti-anginal effect and rate/BP control, especially given BP 140/88\n   - **Address borderline hypertension** — target <130/80 per ACC/AHA guidelines\n\n> Adverse event data from FDA reporting confirms that **exertional dyspnea, angina pectoris, and fatigue** are among the most commonly reported symptoms in patients being treated for stable angina, underscoring the importance of both diagnostic workup and symptom management [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:stable%20angina%20risk%20stratification%20outpatient%20exertional).\n\n---\n\n## Summary Decision Framework\n\n```\nTypical Angina + High PTP + Risk Factors + ECG Changes\n                    │\n          ┌─────────┴──────────┐\n     Troponin (+)          Troponin (−)\n          │                     │\n   Urgent Cardiology    Stress Imaging Test\n   (Rule out ACS)       (Echo or MPI preferred)\n                                │\n                 ┌──────────────┼──────────────┐\n            High-Risk       Intermediate      Low-Risk\n                │               │                │\n         Coronary Angio    Intensify OMT     Continue OMT\n         ± Revasc          ± CCTA/FFR        Reassess\n```\n\n---\n\n## Key Takeaways for This Consultation\n\n- This patient has **typical angina with a high pre-test probability** for obstructive CAD — testing is clearly indicated\n- **Stress imaging** (not plain exercise ECG) is preferred due to baseline ECG abnormalities\n- **CAC scoring and CCTA** are valuable adjuncts, particularly for anatomical delineation and risk refinement [[EPMC]](https://europepmc.org/article/MED/36396197)\n- **Do not delay** — if troponin returns elevated, this becomes an **acute coronary syndrome** requiring emergent management [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#253490233)\n- **Intensify medical therapy** now: consider uptitrating statin and adding a beta-blocker\n\n---\n\n## References\n\n1. \"Chest Pain Evaluation: Diagnostic Testing.\" *CJC Open*, 2023. [[EPMC]](https://europepmc.org/article/MED/38204849)\n\n2. \"Coronary Calcium Scoring Improves Risk Prediction in Patients With Suspected Obstructive Coronary Artery Disease.\" *J Am Coll Cardiol*, 2022. [[EPMC]](https://europepmc.org/article/MED/36396197)\n\n3. \"Danish study of Non-Invasive Testing in Coronary Artery Disease 3 (Dan-NICAD 3): study design of a controlled study on optimal diagnostic strategy.\" *Open Heart*, 2023. [[EPMC]](https://europepmc.org/article/MED/37487656)\n\n4. \"Dobutamine stress echocardiography after positive CCTA: diagnostic performance using fractional flow reserve and instantaneous wave-free ratio as reference standards.\" *Open Heart*, 2024. [[EPMC]](https://europepmc.org/article/MED/39349050)\n\n5. ICD-11: Stable angina (BA40.1). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#216789527)\n\n6. ICD-11: Unstable angina (BA40.0). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#253490233)\n\n7. OpenFDA Drug Adverse Events: Stable angina-related reports. [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:stable%20angina%20risk%20stratification%20outpatient%20exertional)",
          "citations": [
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#216789527"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#253490233"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/38204849"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/36396197"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/37487656"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/39349050"
            },
            {
              "source": "openfda",
              "title": "FDA",
              "url": "https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:stable%20angina%20risk%20stratification%20outpatient%20exertional"
            }
          ],
          "metadata": {
            "modelId": "claude-opus-4-6",
            "promptFamily": "research",
            "generatedAt": "2026-03-12T12:47:08.295Z"
          }
        },
        {
          "question": "What safety-net instructions and nitroglycerin counseling should be emphasized while waiting for stress testing in suspected stable angina?",
          "answer": "## Safety-Net Instructions and Nitroglycerin Counseling for Suspected Stable Angina Awaiting Stress Testing\n\n### Clinical Context\n\nThis 55-year-old male with a high pre-test probability for obstructive CAD has been appropriately started on **aspirin 81 mg**, **atorvastatin 40 mg**, and **sublingual nitroglycerin (SL NTG) PRN** while awaiting stress testing. The period between initial evaluation and definitive testing is a critical window where clear patient education can prevent catastrophic outcomes. His diagnosis currently aligns with **Stable angina (BA40.1)** [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#216789527), but the primary concern is recognizing a transition to **Unstable angina (BA40.0)** [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#253490233) or acute coronary syndrome.\n\n---\n\n## Sublingual Nitroglycerin Counseling\n\n### How It Works — Patient-Friendly Explanation\n\nExplain to the patient that **SL NTG** rapidly dilates coronary arteries and reduces cardiac workload, providing relief of anginal chest pain typically within **1–3 minutes**. The 2014 PHA Clinical Practice Guidelines for Coronary Heart Disease emphasize that short-acting nitrates are the first-line agents for acute symptom relief in stable angina [[EPMC]](https://europepmc.org/article/PMC/PMC4833805).\n\n### Step-by-Step NTG Use Protocol\n\nCounsel the patient using the following structured approach:\n\n1. **At the onset of chest pain**, stop all activity and sit down (to prevent falls from hypotension)\n\n2. **Place one tablet (0.4 mg) under the tongue** — do not chew or swallow\n\n3. **Wait 5 minutes** — if pain persists, take a **second tablet**\n\n4. **Wait another 5 minutes** — if pain still persists, take a **third tablet**\n\n5. **If pain is not relieved after 3 doses (15 minutes total) → Call 911 immediately**\n\n> **Critical Rule for This Patient:** \"If your chest pain does not respond to the first nitroglycerin tablet the way it usually does, or if the pain is more severe than your typical episodes, do NOT wait — call 911 right away.\"\n\n### Common Side Effects to Expect\n\nPrepare the patient for expected pharmacological effects so they are not alarmed:\n\n- **Headache** — the most common side effect; can take acetaminophen\n- **Lightheadedness/dizziness** — due to blood pressure drop; remain seated for several minutes after use\n- **Flushing and warmth** — normal vasodilatory response\n\nFDA adverse event reporting data confirms that **drug ineffectiveness, angina pectoris recurrence, nausea, and dyspnea** are among the most commonly reported events associated with nitroglycerin use, underscoring the importance of counseling patients on when the medication is not working as expected [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:stable%20angina%20patient%20education%20nitroglycerin%20sublingual).\n\n### Storage and Handling Instructions\n\n| Instruction | Rationale |\n|---|---|\n| Store in the **original dark glass bottle** | NTG degrades with light exposure |\n| Keep the bottle **tightly closed** | Volatile compound; loses potency with air exposure |\n| Do **not** transfer to a pill organizer | Plastic and cotton absorb the active ingredient |\n| Store at **room temperature**, away from heat/moisture | Heat accelerates degradation |\n| **Replace every 6 months** after opening | Potency declines over time |\n| A working tablet should produce a **slight tingling/burning** under the tongue | If absent, the tablet may be expired |\n\n### Absolute Contraindication Warning\n\n> **Critical:** Instruct the patient to **NEVER** take nitroglycerin within **24 hours of sildenafil (Viagra) or vardenafil (Levitra)**, or within **48 hours of tadalafil (Cialis)**. The combination can cause **life-threatening hypotension**. Ask directly about PDE-5 inhibitor use, as patients may not volunteer this information.\n\n---\n\n## Safety-Net Instructions: Recognizing Destabilization\n\n### The \"Unstable Angina Transition\" — What to Watch For\n\nThe most important safety-net concept is teaching the patient to recognize when **stable angina (BA40.1)** [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#216789527) is transitioning to **unstable angina (BA40.0)** [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#253490233) or myocardial infarction. Use the mnemonic **\"NEW, WORSE, or DIFFERENT\"**:\n\n### Call 911 Immediately If:\n\n- **Pain at rest** — chest pressure occurring without exertion or emotional stress (new feature)\n- **Increasing frequency** — episodes happening more often than before\n- **Increasing severity** — pain rated higher than the usual 6–7/10\n- **Longer duration** — episodes lasting **>15–20 minutes** instead of the usual 3–5 minutes\n- **Decreasing threshold** — pain triggered by less activity than before (e.g., walking across a room instead of climbing stairs)\n- **NTG failure** — pain not relieved by 3 doses of sublingual nitroglycerin over 15 minutes\n- **New associated symptoms** — sudden onset of nausea/vomiting, cold sweats, severe breathlessness, palpitations, or feeling of impending doom\n\n### Provide a Written Action Plan\n\nResearch from the Society of General Internal Medicine highlights the importance of structured patient education and safety-net counseling in outpatient chest pain evaluation to reduce delays in seeking emergency care [[EPMC]](https://europepmc.org/article/PMC/PMC9205280)[[EPMC]](https://europepmc.org/article/PMC/PMC11231130).\n\nGive the patient a **written card** or printed handout with:\n\n| Item | Details |\n|---|---|\n| **Diagnosis** | Suspected stable angina — awaiting stress test |\n| **Medications** | Aspirin 81 mg daily, Atorvastatin 40 mg daily, SL NTG PRN |\n| **NTG protocol** | 1 tab → wait 5 min → 2nd tab → wait 5 min → 3rd tab → if no relief → 911 |\n| **Call 911 if** | Rest pain, pain >15 min, NTG failure, worsening pattern |\n| **Clinic callback number** | For non-urgent questions or symptom changes |\n| **Stress test date** | Confirm appointment and emphasize importance of attendance |\n\n---\n\n## Activity and Lifestyle Guidance While Awaiting Testing\n\n### Activity Modification\n\n- **Do not abruptly stop all activity** — gentle, routine daily activities are acceptable\n- **Avoid known triggers** — heavy exertion, carrying heavy loads, exercising in extreme cold, large heavy meals followed by exertion\n- **Stop and rest immediately** if chest discomfort begins; use NTG as instructed\n- **Avoid isometric exercises** (heavy lifting, straining) which acutely raise blood pressure and cardiac demand\n\n### Additional Interim Measures\n\nThe 2022 Taiwan Society of Cardiology/Hypertension Society guidelines reinforce the importance of concurrent risk factor management even before definitive diagnosis [[EPMC]](https://europepmc.org/article/MED/35673334):\n\n- **Blood pressure control** — His BP of 140/88 is above target. Consider initiating a **beta-blocker** (e.g., **metoprolol succinate 25–50 mg daily**), which serves dual purpose: anti-anginal effect and BP reduction\n- **Smoking cessation reinforcement** — He quit 2 years ago; reinforce continued abstinence\n- **Dietary counseling** — Low-sodium, heart-healthy diet\n- **Aspirin adherence** — Take daily without interruption; do not add NSAIDs (ibuprofen) which can interfere with aspirin's antiplatelet effect\n\n---\n\n## Medication Adherence Counseling\n\n### Emphasize the Importance of All Prescribed Medications\n\n| Medication | Key Counseling Point |\n|---|---|\n| **Aspirin 81 mg** | Take daily; do not skip; avoid ibuprofen/naproxen concurrently |\n| **Atorvastatin 40 mg** | Take at the same time daily; may cause mild muscle aches — report if severe |\n| **SL Nitroglycerin** | Carry at ALL times; know the 3-dose/15-minute rule; check expiration |\n\n> **Practical Tip:** Advise the patient to keep NTG in a shirt pocket or easily accessible location — not in a car glove compartment (heat) or bathroom (moisture).\n\n---\n\n## When to Return Before the Stress Test\n\n### Urgent Same-Day Return\n\n- Any change in symptom pattern (frequency, severity, duration, threshold)\n- Symptoms at rest\n- Syncope or pre-syncope\n- Palpitations or sensation of irregular heartbeat\n\n### Non-Urgent Callback\n\n- Questions about medications or side effects\n- Difficulty tolerating aspirin or statin\n- Need to reschedule stress test\n- Anxiety about diagnosis (consider brief reassurance and psychosocial support)\n\nGeneral internal medicine research emphasizes that undifferentiated chest pain in the outpatient setting requires robust safety-net protocols, as patients may minimize evolving symptoms if not explicitly instructed on warning signs [[EPMC]](https://europepmc.org/article/MED/34297318)[[EPMC]](https://europepmc.org/article/MED/31090026).\n\n---\n\n## Summary: Key Counseling Points to Cover Before Discharge\n\n1. ✅ **NTG technique** — Sit down, sublingual placement, 5-minute intervals, maximum 3 doses\n2. ✅ **NTG storage** — Dark bottle, room temperature, replace every 6 months\n3. ✅ **PDE-5 inhibitor contraindication** — Ask directly and document\n4. ✅ **911 triggers** — Rest pain, NTG failure, worsening pattern, duration >15 minutes\n5. ✅ **Written action plan** — Provide a take-home card with all key instructions\n6. ✅ **Activity modification** — Avoid heavy exertion; stop and rest if symptoms occur\n7. ✅ **Medication adherence** — All three medications daily; carry NTG at all times\n8. ✅ **Stress test importance** — Emphasize keeping the appointment; explain what to expect\n9. ✅ **Troponin follow-up** — Ensure result is reviewed and patient is contacted if abnormal\n\n> **Red Flag Reminder:** The pending troponin result is critical. If elevated, this patient requires **immediate cardiology referral** for possible ACS, not continued outpatient management. Ensure a reliable callback system is in place [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#253490233).\n\n---\n\n## References\n\n1. \"2014 PHA Clinical Practice Guidelines for the Diagnosis and Management of Patients with Coronary Heart Disease.\" *Asean Heart Journal*, 2016. [[EPMC]](https://europepmc.org/article/PMC/PMC4833805)\n\n2. \"Abstracts from the 2024 Annual Meeting of the Society of General Internal Medicine.\" *J Gen Intern Med*, 2024. [[EPMC]](https://europepmc.org/article/PMC/PMC11231130)\n\n3. \"Abstracts from the 2022 Annual Meeting of the Society of General Internal Medicine.\" *J Gen Intern Med*, 2022. [[EPMC]](https://europepmc.org/article/PMC/PMC9205280)\n\n4. \"Abstracts from the 2021 Annual Meeting of the Society of General Internal Medicine.\" *J Gen Intern Med*, 2021. [[EPMC]](https://europepmc.org/article/MED/34297318)\n\n5. \"Abstracts from the 2019 Annual Meeting of the Society of General Internal Medicine.\" *J Gen Intern Med*, 2019. [[EPMC]](https://europepmc.org/article/MED/31090026)\n\n6. \"2022 Guidelines of the Taiwan Society of Cardiology and the Taiwan Hypertension Society for the Management of Hypertension.\" *Acta Cardiol Sin*, 2022. [[EPMC]](https://europepmc.org/article/MED/35673334)\n\n7. OpenFDA Drug Adverse Events: Nitroglycerin-related reports. [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:stable%20angina%20patient%20education%20nitroglycerin%20sublingual)\n\n8. ICD-11: Stable angina (BA40.1). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#216789527)\n\n9. ICD-11: Unstable angina (BA40.0). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#253490233)\n\n10. ICD-11: Chest pain, unspecified (MD30.Z). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#unspecified)",
          "citations": [
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#216789527"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#253490233"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/PMC/PMC4833805"
            },
            {
              "source": "openfda",
              "title": "FDA",
              "url": "https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:stable%20angina%20patient%20education%20nitroglycerin%20sublingual"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/PMC/PMC9205280"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/PMC/PMC11231130"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/35673334"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/34297318"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/31090026"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#unspecified"
            }
          ],
          "metadata": {
            "modelId": "claude-opus-4-6",
            "promptFamily": "research",
            "generatedAt": "2026-03-12T12:48:13.985Z"
          }
        },
        {
          "question": "When should exertional chest pain patients be escalated urgently instead of managed as expedited outpatient follow-up?",
          "answer": "## When to Urgently Escalate Exertional Chest Pain vs. Manage as Expedited Outpatient\n\n### Relevance to This Patient\n\nThis 55-year-old male currently presents with features consistent with **Stable angina (BA40.1)** [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#216789527) — exertional chest pressure, predictable triggers, relief with rest, and episodes lasting 3–5 minutes. However, several features place him in a **high-risk zone** where the boundary between outpatient management and urgent escalation is narrow. The critical question is: what specific clinical features should trigger immediate escalation to emergency care or urgent cardiology referral rather than continued outpatient workup?\n\n> **Immediate Concern for This Patient:** The pending troponin result is the single most important data point. An elevated troponin reclassifies this patient from stable angina to **Unstable angina (BA40.0)** [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#253490233) or acute myocardial infarction, mandating urgent intervention — not outpatient stress testing.\n\n---\n\n## Framework: The Stable-to-Unstable Spectrum\n\nChest pain concerning for angina exists on a clinical spectrum. The decision to escalate depends on identifying features that indicate **plaque instability, hemodynamic compromise, or high short-term event risk**.\n\n### Diagnostic Classification Guide\n\n| Classification | ICD-11 | Key Features | Disposition |\n|---|---|---|---|\n| **Chest pain, unspecified** | MD30.Z [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#unspecified) | Atypical features, low PTP | Outpatient workup |\n| **Other chest pain** | MD30.1 [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1365807043) | Non-cardiac features identified | Outpatient, alternative diagnosis |\n| **Stable angina** | BA40.1 [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#216789527) | Predictable, exertional, relieved by rest/NTG | Expedited outpatient stress testing |\n| **Unstable angina** | BA40.0 [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#253490233) | New, worsening, or rest pain; NTG failure | **Urgent escalation — ED/cardiology** |\n| **Angina pectoris, unspecified** | BA40.Z [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#unspecified) | Cannot clearly classify | Err toward urgent evaluation |\n\n---\n\n## Criteria for Urgent Escalation\n\n### Category 1: Features of Acute Coronary Syndrome (Highest Priority)\n\nAny of the following features indicate possible **plaque rupture or acute thrombosis** and require **immediate ED referral or 911 activation**:\n\n- **Rest pain** — Angina occurring without exertion or emotional stress, especially if new\n- **Prolonged pain (>15–20 minutes)** — Episodes not self-limiting as expected in stable angina\n- **Crescendo pattern** — Rapidly increasing frequency, severity, or duration over days to weeks\n- **Nitroglycerin failure** — Pain unresponsive to 3 doses of SL NTG over 15 minutes\n- **New-onset angina with severe limitation** — CCS Class III–IV symptoms within the first 2 weeks of onset (pain with minimal activity or at rest)\n\n> **Application to This Patient:** His symptoms have been present for **one week** with a pattern that appears stable. However, the fact that this is **new-onset angina** (not chronic stable angina of months/years duration) inherently places him at higher risk. New-onset exertional angina is classified by some guidelines as a form of unstable angina, particularly when it is rapidly progressive. Close monitoring during the waiting period is essential.\n\n### Category 2: High-Risk Historical Features\n\n| Feature | Why It Matters | This Patient |\n|---|---|---|\n| **New-onset angina (<2 months)** | Higher rate of plaque instability | ✅ **Yes — 1 week** |\n| **Post-MI or post-revascularization angina** | Suggests graft failure or re-stenosis | ❌ No |\n| **Angina despite maximal medical therapy** | Refractory ischemia | Not yet assessed |\n| **Prior known severe CAD** (left main, 3-vessel) | High-risk anatomy | Unknown |\n| **Diabetes mellitus** | Atypical presentations, diffuse disease | ❌ Not documented |\n| **Reduced LVEF (<40%)** | Ischemic cardiomyopathy risk | Unknown — echo not yet done |\n| **Recent severe episode prompting visit** | May represent sentinel event before MI | ✅ **Yes — red flag identified** |\n\n### Category 3: Abnormal Objective Findings Requiring Urgent Action\n\nThese findings at the time of initial evaluation should trigger **same-day cardiology consultation or ED transfer**:\n\n- **Elevated troponin** (any level above the 99th percentile) — reclassifies to NSTEMI [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#253490233)\n- **Dynamic ST-segment changes** — New ST depression ≥1 mm or transient ST elevation during pain\n- **New T-wave inversions** — Especially deep, symmetric inversions in contiguous leads (Wellens' pattern)\n- **Hemodynamic instability** — Hypotension (SBP <90), new tachycardia, or bradycardia during episodes\n- **New heart failure signs** — S3 gallop, pulmonary rales, elevated JVP, new mitral regurgitation murmur\n- **Ventricular arrhythmias** — Sustained VT, frequent PVCs during or after episodes\n- **New wall motion abnormalities on echocardiography** — If point-of-care echo is available\n\nResearch presented at the World Congress of Cardiology highlights that integrating clinical risk scores with objective markers (troponin, ECG changes, echocardiographic findings) significantly improves the accuracy of acute chest pain triage in both emergency and outpatient settings [[EPMC]](https://europepmc.org/article/PMC/PMC10000335).\n\n### Category 4: High-Risk Scoring Systems\n\nSeveral validated tools help formalize the escalation decision:\n\n#### HEART Score (for Acute Chest Pain)\n\n| Component | 0 Points | 1 Point | 2 Points |\n|---|---|---|---|\n| **H**istory | Slightly suspicious | Moderately suspicious | Highly suspicious |\n| **E**CG | Normal | Non-specific changes | Significant ST deviation |\n| **A**ge | <45 | 45–64 | ≥65 |\n| **R**isk factors | None | 1–2 | ≥3 or history of CAD |\n| **T**roponin | Normal | 1–3× normal | >3× normal |\n\n| Score | Risk | Recommended Action |\n|---|---|---|\n| **0–3** | Low (1.6% MACE) | Consider discharge with outpatient follow-up |\n| **4–6** | Intermediate (12% MACE) | Observation, serial troponins, expedited testing |\n| **7–10** | High (65% MACE) | **Urgent admission and cardiology consultation** |\n\n**This patient's estimated HEART score (pending troponin):**\n\n- History: 2 (highly suspicious — classic angina)\n- ECG: 1 (nonspecific ST-T changes)\n- Age: 1 (55 years old)\n- Risk factors: 2 (≥3: smoking, family history, hyperlipidemia, borderline HTN)\n- Troponin: **Pending** (0 if normal, 1–2 if elevated)\n\n> **If troponin is normal: Score = 6 (intermediate-high)** → Expedited outpatient testing is reasonable but with close safety-netting.\n>\n> **If troponin is elevated: Score = 7–8 (high)** → **Urgent admission required.**\n\nAbstracts from the Society of General Internal Medicine annual meeting emphasize the utility of structured risk stratification tools like the HEART score in outpatient and ED settings for reducing both missed ACS diagnoses and unnecessary admissions [[EPMC]](https://europepmc.org/article/PMC/PMC11231130).\n\n---\n\n## Decision Algorithm: Escalate vs. Outpatient Management\n\n```\nEXERTIONAL CHEST PAIN CONCERNING FOR ANGINA\n                    │\n    ┌───────────────┴───────────────┐\n    │                               │\n ANY of the following?          NONE present\n    │                               │\n • Rest pain                   STABLE PATTERN\n • Duration >15-20 min             │\n • Crescendo pattern          Check troponin\n • NTG failure                 and ECG\n • Hemodynamic instability          │\n • Syncope/presyncope        ┌──────┴──────┐\n • Acute HF signs            │             │\n • Ventricular arrhythmia  Troponin ⊕   Troponin ⊖\n    │                         │             │\n    ▼                         ▼        ECG changes?\n ══════════════        ══════════════       │\n ║ CALL 911  ║        ║  URGENT    ║  ┌────┴────┐\n ║ ED NOW    ║        ║  ADMIT     ║  │         │\n ══════════════        ══════════════  Dynamic   Nonspecific\n                                       ST Δ      or normal\n                                       │         │\n                                       ▼         ▼\n                                   URGENT    HEART Score\n                                   CARDIO    Assessment\n                                   CONSULT        │\n                                          ┌───────┴───────┐\n                                        ≥7              4-6\n                                          │               │\n                                       ADMIT      EXPEDITED\n                                                  OUTPATIENT\n                                                  (≤2 weeks)\n```\n\n---\n\n## Specific Escalation Triggers for This Patient\n\nGiven his clinical profile, the following **specific scenarios** should trigger urgent escalation before the stress test is completed:\n\n### Immediate (Call 911)\n\n1. **Troponin returns elevated** — even minimally; this is NSTEMI until proven otherwise\n2. **Chest pain at rest** — any episode occurring without exertion\n3. **Episode lasting >15 minutes** unresponsive to NTG protocol\n4. **Syncope or near-syncope** during or after an episode\n5. **Sudden severe dyspnea** at rest (possible acute pulmonary edema from ischemia)\n\n### Urgent Same-Day Evaluation (Call Clinic → Possible ED)\n\n6. **Increasing episode frequency** — e.g., from once daily to multiple times daily\n7. **Decreasing exertional threshold** — pain now triggered by walking across a room instead of climbing stairs\n8. **New palpitations** or sensation of irregular heartbeat\n9. **Persistent diaphoresis** unrelated to exertion\n10. **NTG providing less relief** than initially experienced\n\n### Expedited Follow-Up (Within 24–48 Hours)\n\n11. **Mild increase in symptom frequency** without other alarming features\n12. **Medication side effects** preventing adherence (e.g., severe headache from NTG, myalgias from statin)\n13. **Anxiety or uncertainty** about symptoms — lower threshold for reassessment\n\n---\n\n## The \"Gray Zone\": New-Onset Angina Dilemma\n\nThis patient falls into a clinically challenging category. His presentation is consistent with **stable angina**, but it is **new-onset** (1 week). This distinction matters:\n\n| Feature | Chronic Stable Angina | New-Onset Angina (This Patient) |\n|---|---|---|\n| Duration of symptoms | Months to years | Days to weeks |\n| Plaque stability | Likely stable, fixed stenosis | Uncertain — may represent recent plaque event |\n| Short-term MACE risk | Low (1–3%/year) | Intermediate (may be 5–15% at 30 days) |\n| Guideline classification | Stable CAD | Some guidelines classify as **unstable** |\n| Appropriate disposition | Outpatient stress test within 2–6 weeks | **Expedited testing within 1–2 weeks**, with low threshold for escalation |\n\n> **Clinical Pearl:** The 2021 AHA/ACC Chest Pain Guidelines recommend that new-onset angina with high-risk features (as in this patient) should undergo **expedited evaluation within 1–2 weeks**, not the standard 4–6 week timeline used for chronic stable symptoms. Some experts argue that new-onset typical angina in a high-risk patient warrants **inpatient observation with early stress testing or angiography**.\n\nIntensive care literature reinforces that delayed recognition of evolving coronary syndromes remains a significant contributor to adverse outcomes, particularly when initial presentations appear stable [[EPMC]](https://europepmc.org/article/MED/37874422)[[EPMC]](https://europepmc.org/article/PMC/PMC12640885).\n\n---\n\n## Pharmacological Considerations During the Waiting Period\n\nWhile awaiting definitive testing, ensure the current medication regimen is optimized to reduce ischemic risk. Topical analgesics such as **lidocaine patches** [[DailyMed]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca35030-958c-8f62-e063-6294a90a4d63)[[DailyMed]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca541b4-7afe-77c5-e063-6294a90ad692) and topical camphor/menthol preparations [[DailyMed]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7855033e-6a12-4cd8-b0a2-c5d69018d117)[[DailyMed]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=116146db-719f-4c48-8a8a-1120ea62b0d5) are sometimes used by patients for chest wall pain but have **no role in cardiac angina** — counsel the patient that these products address musculoskeletal pain only and should not be used as substitutes for nitroglycerin or cardiac medications.\n\nSimilarly, topical lidocaine-containing products [[DailyMed]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9fc71191-4fcd-4d7b-966c-878a1e28d6c1) do not treat ischemic chest pain. If a patient reports using such products for chest discomfort, it may indicate either a musculoskeletal component or inadequate understanding of their cardiac diagnosis.\n\n### Recommended Interim Optimization\n\n| Action | Rationale |\n|---|---|\n| **Add beta-blocker** (e.g., metoprolol succinate 25–50 mg) | Anti-anginal, reduces HR and BP (currently 140/88) |\n| **Uptitrate atorvastatin** to 80 mg | High-intensity statin for high-risk patient |\n| **Confirm aspirin adherence** | Antiplatelet protection during vulnerable period |\n| **Ensure NTG is accessible and not expired** | Acute symptom relief and diagnostic tool |\n\nFDA adverse event surveillance data confirms that **pain, nausea, and fatigue** are among the most commonly reported symptoms in patients with cardiovascular conditions on pharmacotherapy, reinforcing the need for proactive side-effect counseling to maintain adherence during this critical waiting period [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:exertional%20chest%20pain%20urgent%20escalation%20criteria).\n\n---\n\n## Summary: Escalation Decision Matrix for This Patient\n\n| Scenario | Action | Urgency |\n|---|---|---|\n| Troponin elevated | Admit, urgent cardiology consult | **Immediate** |\n| Dynamic ECG changes | ED transfer | **Immediate** |\n| Rest pain or NTG failure | Call 911 | **Immediate** |\n| Crescendo pattern develops | Same-day ED evaluation | **Urgent (hours)** |\n| Syncope or hemodynamic changes | Call 911 | **Immediate** |\n| Stable pattern, troponin negative | Expedited stress test within 1–2 weeks | **Expedited outpatient** |\n| Symptoms resolve completely | Still complete stress test; do not cancel | **Routine outpatient** |\n\n> **Bottom Line for This Consultation:** This patient is currently manageable as expedited outpatient **only if troponin is negative and his symptom pattern remains stable**. Given that this is **new-onset typical angina** in a high-risk individual with ECG changes, the threshold for escalation should be **very low**. Schedule the stress test within **1 week**, provide robust written safety-net instructions, and ensure a reliable system for troponin result callback today.\n\n---\n\n## References\n\n1. \"Abstracts from the World Congress of Cardiology/Brazilian Congress of Cardiology 2022.\" *Glob Heart*, 2023. [[EPMC]](https://europepmc.org/article/PMC/PMC10000335)\n\n2. \"Abstracts from the 2024 Annual Meeting of the Society of General Internal Medicine.\" *J Gen Intern Med*, 2024. [[EPMC]](https://europepmc.org/article/PMC/PMC11231130)\n\n3. \"ESICM LIVES 2023.\" *Intensive Care Med Exp*, 2023. [[EPMC]](https://europepmc.org/article/MED/37874422)\n\n4. \"ESICM LIVES 2025.\" *Intensive Care Med Exp*, 2025. [[EPMC]](https://europepmc.org/article/PMC/PMC12640885)\n\n5. ICD-11: Stable angina (BA40.1). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#216789527)\n\n6. ICD-11: Unstable angina (BA40.0). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#253490233)\n\n7. ICD-11: Angina pectoris, unspecified (BA40.Z). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#unspecified)\n\n8. ICD-11: Other chest pain (MD30.1). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1365807043)\n\n9. ICD-11: Chest pain, unspecified (MD30.Z). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#unspecified)\n\n10. DailyMed: Lidocaine 4% Patch (Rapid Relief). [[DailyMed]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca35030-958c-8f62-e063-6294a90a4d63)\n\n11. DailyMed: Lidocaine 4% Patch (Rapid Relief, alternate). [[DailyMed]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca541b4-7afe-77c5-e063-6294a90ad692)\n\n12. DailyMed: Medicated Chest Rub (Camphor/Eucalyptus/Menthol). [[DailyMed]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7855033e-6a12-4cd8-b0a2-c5d69018d117)\n\n13. DailyMed: Chest Rub (Camphor/Eucalyptus/Menthol — Kroger). [[DailyMed]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=116146db-719f-4c48-8a8a-1120ea62b0d5)\n\n14. DailyMed: Prologel Urgent Care (Lidocaine/Sodium Bicarbonate). [[DailyMed]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9fc71191-4fcd-4d7b-966c-878a1e28d6c1)\n\n15. OpenFDA Drug Adverse Events: Cardiovascular-related reports. [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:exertional%20chest%20pain%20urgent%20escalation%20criteria)",
          "citations": [
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#216789527"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#253490233"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#unspecified"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#1365807043"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/PMC/PMC10000335"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/PMC/PMC11231130"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/37874422"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/PMC/PMC12640885"
            },
            {
              "source": "dailymed",
              "title": "DailyMed",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca35030-958c-8f62-e063-6294a90a4d63"
            },
            {
              "source": "dailymed",
              "title": "DailyMed",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca541b4-7afe-77c5-e063-6294a90ad692"
            },
            {
              "source": "dailymed",
              "title": "DailyMed",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=7855033e-6a12-4cd8-b0a2-c5d69018d117"
            },
            {
              "source": "dailymed",
              "title": "DailyMed",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=116146db-719f-4c48-8a8a-1120ea62b0d5"
            },
            {
              "source": "dailymed",
              "title": "DailyMed",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=9fc71191-4fcd-4d7b-966c-878a1e28d6c1"
            },
            {
              "source": "openfda",
              "title": "FDA",
              "url": "https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:exertional%20chest%20pain%20urgent%20escalation%20criteria"
            }
          ],
          "metadata": {
            "modelId": "claude-opus-4-6",
            "promptFamily": "research",
            "generatedAt": "2026-03-12T12:49:19.350Z"
          }
        }
      ],
      "record": {
        "date": "2026-03-05T09:00:00.000Z",
        "patientName": "Michael Turner",
        "chiefComplaint": "Chest pain",
        "hpiText": "55-year-old male presents with one week of exertional squeezing/heavy pressure in the central chest behind the breastbone, radiating to left arm and jaw, rated 6-7/10, lasting 3-5 minutes, resolving with rest. Triggered by physical activity (walking up stairs, carrying groceries, rushing for bus) and one episode with emotional stress (argument with boss). Associated with shortness of breath and diaphoresis. No pain at rest, nausea, dizziness, or nocturnal symptoms. Recent severe episode prompted visit.",
        "medications": "Aspirin 81 mg daily\nAtorvastatin 40 mg daily\nNitroglycerin sublingual (use as needed for chest pressure)",
        "rosText": "Cardiovascular: exertional chest pressure, dyspnea, diaphoresis. Negative for nausea, dizziness, rest pain.",
        "pmh": "Hyperlipidemia (diagnosed 1 year ago, no prior treatment). Borderline hypertension (self-reported ~135/85). No diabetes.",
        "socialHistory": "Former smoker, 25 pack-years (quit 2 years ago). Works (involves stairs).",
        "familyHistory": "Strong family history of coronary artery disease: father with MI at age 58 requiring stents; brother with CABG at age 62.",
        "vitals": {
          "bp": "140/88",
          "hr": "76",
          "temp": "[Not discussed]",
          "rr": "[Not discussed]",
          "spo2": "[Not discussed]"
        },
        "physicalExam": "BP 140/88, HR 76 regular. Lungs clear bilaterally. Heart: normal sounds, no murmurs. No leg swelling. Strong pulses in both feet.",
        "labsStudies": "ECG: normal sinus rhythm with nonspecific ST-T wave changes in lateral leads\nTroponin\nComplete metabolic panel\nLipid panel\nCBC",
        "assessment": "1. 1. Suspected angina / possible coronary artery disease (classic exertional symptoms with radiation, high-risk features, family history, ECG changes)\n2. 2. Hyperlipidemia\n3. 3. Former heavy smoker\n4. 4. Borderline hypertension",
        "plan": "1. Suspected angina/CAD: Aspirin 81mg daily, atorvastatin 40mg daily, SL NTG prn; labs (troponin, CMP, lipid panel, CBC); stress test within 1 week; if troponin elevated or stress test abnormal, cardiology consult/angiogram. Avoid strenuous activity; 911 for rest pain >10min, severe SOB, lightheadedness. F/U 1 week.\n2. Hyperlipidemia: Atorvastatin 40mg daily.\n3. Lifestyle: Heart-healthy diet (Mediterranean), reduce saturated fats.",
        "metadata": {
          "modelId": "grok-4-1-fast-non-reasoning",
          "promptFamily": "record",
          "generatedAt": "2026-03-12T12:46:53.155Z"
        }
      },
      "patientHandout": {
        "language": "en",
        "conditions": [
          {
            "id": "chest-pain:BA80",
            "icdCode": "BA80",
            "diseaseName": "Chronic ischaemic heart disease - Stable angina pectoris",
            "source": "ddx"
          }
        ],
        "entries": [
          {
            "conditionId": "chest-pain:BA80",
            "sections": {
              "conditionOverview": "Stable angina pectoris is a type of chest pain caused by reduced blood flow to the heart muscle. It happens mostly during physical activity or stress, when your heart needs more oxygen than usual. The pain typically goes away with rest. This is often due to narrowed arteries from plaque buildup (atherosclerosis) in chronic ischaemic heart disease. It's a warning sign that needs medical attention to prevent more serious heart problems.",
              "signsSymptoms": "Common symptoms include squeezing, pressure, or tightness in the center of the chest, often rated 6-7 out of 10 in intensity. It may spread to the left arm, jaw, or back. Episodes last 3-5 minutes and are triggered by exercise, rushing, or emotional stress like arguments. You may also feel short of breath or sweat more than usual. Symptoms improve when you stop and rest.",
              "causesRiskFactors": "The main cause is narrowed coronary arteries from plaque buildup. Risk factors include smoking history (even if quit), family history of heart disease (like heart attacks or bypass surgery in close relatives), high cholesterol, borderline high blood pressure, age over 50, and male gender. In your case, these factors match a high-risk profile.",
              "complications": "If untreated, stable angina can progress to unstable angina, heart attack, heart failure, or irregular heart rhythms. It increases the risk of sudden cardiac events, especially with ongoing risk factors like high cholesterol or uncontrolled blood pressure.",
              "treatmentOptions": "Treatment starts with medications: low-dose aspirin to prevent clots, statins like atorvastatin to lower cholesterol, and nitroglycerin tablets (placed under the tongue) to relieve symptoms quickly. Further tests include a stress test (walking on a treadmill while monitoring your heart) and possibly an angiogram. Lifestyle changes like a heart-healthy Mediterranean diet (more fish, vegetables, nuts, olive oil; less saturated fats), quitting smoking fully, and blood pressure control are key. In some cases, stents or bypass surgery may be needed.",
              "whenToSeekHelp": "Call 911 immediately if chest pain lasts more than 10 minutes at rest, comes with severe shortness of breath, dizziness, lightheadedness, nausea, or feels much worse than usual. Also seek urgent care if nitroglycerin doesn't relieve symptoms after 5 minutes (take a second dose and call). Do not drive yourself.",
              "additionalAdviceFollowUp": "Avoid strenuous exercise, heavy lifting, or climbing stairs until cleared by your doctor—stick to light walking on flat ground. Stop any activity if chest discomfort starts and rest. Follow up with your stress test within a week, blood work review, and a doctor visit in one week. Adopt heart-healthy habits now: eat Mediterranean-style meals, manage weight, and control risks. Your doctor will monitor progress.",
              "disclaimer": "This handout provides general educational information about stable angina pectoris based on your consultation. It is not a personal diagnosis, treatment plan, or substitute for professional medical advice. Always follow your doctor's instructions, complete recommended tests, and seek immediate help for emergencies. Contact your healthcare provider for questions specific to your health."
            }
          }
        ],
        "generatedAt": "2026-03-12T12:46:59.816Z",
        "metadata": {
          "modelId": "grok-4-1-fast-non-reasoning",
          "promptFamily": "patient-handout",
          "generatedAt": "2026-03-12T12:46:59.816Z"
        }
      },
      "documents": [
        {
          "templateId": "after-visit-summary",
          "title": null,
          "contentJson": {
            "type": "doc",
            "content": [
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Visit snapshot"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Visit reason"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Chest pain evaluation"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Today's impression"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "55-year-old male with exertional squeezing chest pressure radiating to left arm and jaw, associated with dyspnea and diaphoresis, resolving with rest. Strong family history of CAD, former smoker, hyperlipidemia, borderline hypertension. Normal exam, ECG with nonspecific ST-T changes. Likely stable angina."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Diagnosis codes"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "BA80"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Medication and orders"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Medication changes"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Start aspirin 81 mg daily"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Start atorvastatin 40 mg daily"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Start sublingual nitroglycerin tablets (use 1 under tongue for chest pressure; repeat once if no relief in 5 min then call 911)"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Tests or procedures ordered"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Blood work: troponin, complete metabolic panel, lipid panel, CBC"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Cardiac stress test (schedule within next week)"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Follow-up and safety"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Scheduled follow-up date"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "1 week"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Follow-up plan"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Return in 1 week to review stress test results and medication tolerance"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Return precautions"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Chest pain at rest >10 minutes"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Chest pain with severe shortness of breath or lightheadedness"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Sudden severe chest pain unlike previous episodes"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Call 911 immediately - do not drive"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Patient action items"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Avoid strenuous activity, heavy lifting, running, climbing multiple stairs"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Stop and rest if chest pressure starts; use nitroglycerin if needed"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Light walking on flat ground okay"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Start heart-healthy diet (e.g., Mediterranean: more fish, olive oil, nuts, vegetables; reduce saturated fats)"
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          "generationInputs": {
            "clinicalContextMode": null,
            "confirmedDiagnoses": [
              {
                "id": "chest-pain:BA80",
                "icdCode": "BA80",
                "diseaseName": "Chronic ischaemic heart disease - Stable angina pectoris",
                "source": "ddx"
              }
            ]
          },
          "metadata": {
            "modelId": "grok-4-1-fast-non-reasoning",
            "promptFamily": "document",
            "generatedAt": "2026-03-12T12:50:59.710Z"
          }
        },
        {
          "templateId": "referral-request-letter",
          "title": null,
          "contentJson": {
            "type": "doc",
            "content": [
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Referral request header"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Referring clinician"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Primary Care Provider"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Receiving clinician or service"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Cardiology"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Urgency"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Routine (within 1 week)"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Referral question"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Does this 55yo male with classic exertional angina symptoms, high CAD risk factors, and nonspecific ECG changes have significant coronary artery disease warranting revascularization?"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Clinical summary"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Reason for referral"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Suspected stable angina pending stress test evaluation"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Diagnosis codes"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "BA80"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Pertinent history and findings"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "55yo male, 1wk exertional central squeezing chest pressure (6-7/10) radiating to L arm/jaw, lasts 3-5min, relieves w rest; also w emotional stress; assoc dyspnea, diaphoresis. Risks: 25pk-yr smoker (quit 2yrs), famhx CAD (father MI@58, brother CABG@62), hyperlipidemia, BP140/88. Exam normal; ECG NSR w lateral nonspecific ST-T changes."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Workup completed"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "ECG: NSR, nonspecific ST-T changes"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Labs ordered: troponin, CMP, lipid panel, CBC (pending)"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Current medications and allergies"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Aspirin 81mg daily, atorvastatin 40mg daily, SL NTG prn. No known allergies."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Requested actions and attachments"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Requested evaluation or service"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Urgent outpatient cardiac stress test (+/- imaging) w/in 1wk; if positive, expedite to cath lab for coronary angiography +/- intervention. Review pending labs."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Target appointment window"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Within 1 week"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Attachments to send"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "ECG"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Pending lab results"
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          "generationInputs": {
            "clinicalContextMode": null,
            "confirmedDiagnoses": [
              {
                "id": "chest-pain:BA80",
                "icdCode": "BA80",
                "diseaseName": "Chronic ischaemic heart disease - Stable angina pectoris",
                "source": "ddx"
              }
            ]
          },
          "metadata": {
            "modelId": "grok-4-1-fast-non-reasoning",
            "promptFamily": "document",
            "generatedAt": "2026-03-12T12:50:59.712Z"
          }
        },
        {
          "templateId": "longitudinal-care-plan",
          "title": null,
          "contentJson": {
            "type": "doc",
            "content": [
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Care plan overview"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Primary condition focus"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Chronic ischaemic heart disease - Stable angina pectoris (BA80)"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Active problems"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Exertional angina with radiation to left arm and jaw"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Nonspecific ST-T wave changes on ECG"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Hyperlipidemia"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Borderline hypertension"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Strong family history of CAD"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Former heavy smoker (25 pack-years, quit 2 years ago)"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Health concerns"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Pending troponin result"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Risk of progression to unstable angina or acute coronary syndrome"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Goals and interventions"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Care goals"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Item 1"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Goal"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Relieve angina symptoms and prevent acute coronary events"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Interventions"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Aspirin 81mg daily"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Atorvastatin 40mg daily"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Sublingual nitroglycerin as needed for episodes (1 tablet, repeat once after 5 min if no relief then call 911)"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Avoid strenuous activity, heavy lifting, multiple stairs; light walking on flat ground permitted"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring metric"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Frequency, duration, and severity of chest pain episodes (target: no episodes or <3/10 severity)"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Target timeframe"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Within 1 week and ongoing"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Item 2"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Goal"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Confirm diagnosis and assess ischemia extent"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Interventions"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Complete pending troponin, lipid panel, CMP, CBC"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Cardiac stress test within 1 week"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Cardiac catheterization if stress test abnormal"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring metric"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Stress test results (target: no significant ischemia)"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Target timeframe"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Within 1-2 weeks"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Item 3"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Goal"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Optimize cardiovascular risk factors"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Interventions"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Adhere to atorvastatin 40mg daily"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Mediterranean diet: increase fish, olive oil, nuts, vegetables; reduce saturated fats"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Blood pressure management if persists >140/90"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Smoking cessation maintenance"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Target LDL <70 mg/dL, BP <130/80"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring metric"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "BP, lipid panel, symptom diary"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Target timeframe"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "3-6 months"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring and escalation"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring plan"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Patient symptom diary: record chest pain episodes, triggers, duration, relief with rest/NTG"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Weekly BP self-monitoring at home"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Labs: troponin (immediate), lipids at 4-6 weeks"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Follow-up ECG if symptoms change"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Stress test results review in 1 week"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Expected outcomes"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Symptom-free with activity, normal stress test or managed ischemia, LDL <70 mg/dL, BP <130/80"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Escalation criteria"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Chest pain at rest >10 minutes"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Chest pain unrelieved by NTG or lasting >10 min"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Chest pain with severe dyspnea, diaphoresis, dizziness, nausea"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Troponin elevated"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Worsening frequency/severity of episodes"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "BP >160/100 or HR irregularity"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Patient or caregiver responsibilities"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Take medications as prescribed"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Use NTG correctly for symptoms"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Avoid triggers: strenuous exercise, heavy meals if noted"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Record symptoms daily"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Attend stress test and follow-up in 1 week"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Call 911 for escalation symptoms; do not drive"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Next review date"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "2026-03-12"
                  }
                ]
              }
            ]
          },
          "generationInputs": {
            "clinicalContextMode": null,
            "confirmedDiagnoses": [
              {
                "id": "chest-pain:BA80",
                "icdCode": "BA80",
                "diseaseName": "Chronic ischaemic heart disease - Stable angina pectoris",
                "source": "ddx"
              }
            ]
          },
          "metadata": {
            "modelId": "grok-4-1-fast-non-reasoning",
            "promptFamily": "document",
            "generatedAt": "2026-03-12T12:50:59.712Z"
          }
        }
      ]
    },
    {
      "key": "diabetes",
      "scenarioId": "diabetes",
      "sessionTitle": "Example · Type 2 Diabetes Management",
      "patientName": "Angela Brooks",
      "startedAt": "2026-03-04T13:30:00.000Z",
      "insights": {
        "summary": "Patient with worsening type 2 diabetes (HbA1c 8.2%, fasting glucose 180 mg/dL) reports poor glycemic control despite metformin, with postprandial spikes, fatigue, thirst, nocturia, bilateral toe tingling, delayed foot wound healing, and blurry vision. Exam confirms early peripheral neuropathy with reduced foot sensation; labs show elevated microalbuminuria. Doctor increases metformin, adds empagliflozin, counsels on diet/exercise, orders eye referral and lipid panel, with follow-up in 6 weeks.",
        "keyFindings": [
          "Worsening glycemic control: HbA1c 8.2% (up from 7.6%), fasting glucose 180 mg/dL, postprandial up to 270 mg/dL",
          "Early peripheral neuropathy: toe tingling, reduced monofilament sensation on right foot, delayed wound healing",
          "Symptoms: fatigue, polydipsia, polyuria (nocturia), blurry vision",
          "Diet: high glycemic load (white rice, sweets, sugary coffee); minimal exercise",
          "Labs: normal creatinine, elevated urine microalbumin; tolerating metformin with mild GI effects",
          "Plan: metformin titration to 1000mg BID, add empagliflozin, diet/exercise counseling, foot care, ophthalmology referral"
        ],
        "redFlags": [
          "Early diabetic complications: neuropathy, microalbuminuria, possible retinopathy",
          "Postprandial hyperglycemia >250 mg/dL",
          "Delayed wound healing on foot"
        ],
        "diagnosticKeywords": [
          {
            "phrase": "sugar numbers are still all over the place",
            "category": "symptom"
          },
          {
            "phrase": "fasting glucose ... one eighty",
            "category": "finding"
          },
          {
            "phrase": "HbA1c is at eight point two percent",
            "category": "finding"
          },
          {
            "phrase": "metformin five hundred milligrams twice daily",
            "category": "medication"
          },
          {
            "phrase": "stomach upset",
            "category": "symptom"
          },
          {
            "phrase": "bloating after a heavy meal",
            "category": "symptom"
          },
          {
            "phrase": "fasting readings ... one sixty and one ninety",
            "category": "finding"
          },
          {
            "phrase": "post-meal ... up to two fifty or even two seventy",
            "category": "finding"
          },
          {
            "phrase": "feel tired and sluggish",
            "category": "symptom"
          },
          {
            "phrase": "very thirsty",
            "category": "symptom"
          },
          {
            "phrase": "going to the bathroom a lot",
            "category": "symptom"
          },
          {
            "phrase": "tingling sensation in my toes",
            "category": "symptom"
          },
          {
            "phrase": "decreased sensation ... right foot",
            "category": "finding"
          },
          {
            "phrase": "early peripheral neuropathy",
            "category": "diagnosis"
          },
          {
            "phrase": "small cut on my foot ... took a long time to heal",
            "category": "finding"
          },
          {
            "phrase": "delayed wound healing",
            "category": "finding"
          },
          {
            "phrase": "vision has been a little blurry",
            "category": "symptom"
          },
          {
            "phrase": "urine microalbumin is slightly elevated",
            "category": "finding"
          },
          {
            "phrase": "diabetic kidney disease",
            "category": "diagnosis"
          },
          {
            "phrase": "empagliflozin, also known as Jardiance",
            "category": "medication"
          },
          {
            "phrase": "SGLT2 inhibitor",
            "category": "medication"
          },
          {
            "phrase": "increased urination",
            "category": "symptom"
          }
        ],
        "checklistItems": [
          {
            "label": "Review blood glucose log (fasting and postprandial)",
            "isChecked": false,
            "isAutoChecked": false,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Assess tolerance to increased metformin and new empagliflozin",
            "isChecked": false,
            "isAutoChecked": false,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Dilated eye exam via ophthalmology referral",
            "isChecked": false,
            "isAutoChecked": false,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Repeat HbA1c in 3 months",
            "isChecked": false,
            "isAutoChecked": false,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Lipid panel",
            "isChecked": false,
            "isAutoChecked": false,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Daily foot inspection and care education reinforced",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Diet modifications: reduce white rice/sweets, lower sugar intake",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Exercise plan: 15-30 min walks post-dinner",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          }
        ],
        "metadata": {
          "modelId": "grok-4-1-fast-non-reasoning",
          "promptFamily": "insights",
          "generatedAt": "2026-03-12T12:51:07.819Z"
        }
      },
      "diagnoses": [
        {
          "icdCode": "5A11",
          "diseaseName": "Type 2 diabetes mellitus, poorly controlled",
          "confidence": "high",
          "evidence": "HbA1c 8.2% (worsened from 7.6%), fasting glucose 180 mg/dL, postprandial glucose up to 270 mg/dL, classic hyperglycemic symptoms (polydipsia, polyuria, nocturia, fatigue), and high glycemic load diet all confirm poorly controlled type 2 diabetes. Plan appropriately includes metformin titration and addition of empagliflozin.",
          "citations": [
            {
              "source": "europe_pmc",
              "title": "New approach to optimize therapy in type 2 diabetes mellitus: the importance of subclassification.",
              "url": "https://europepmc.org/article/MED/41255523",
              "snippet": "Discusses approaches to optimize therapy in type 2 diabetes mellitus through subclassification strategies."
            },
            {
              "source": "europe_pmc",
              "title": "2025 Clinical Practice Guidelines for Diabetes Management in Korea: Recommendation of the Korean Diabetes Association.",
              "url": "https://europepmc.org/article/MED/40631460",
              "snippet": "Clinical practice guidelines for comprehensive diabetes management including glycemic targets and treatment algorithms."
            },
            {
              "source": "europe_pmc",
              "title": "RSSDI Clinical Practice Recommendations for the Management of Type 2 Diabetes Mellitus 2022",
              "url": "https://europepmc.org/article/PMC/PMC9534592",
              "snippet": "Comprehensive clinical practice recommendations for management of type 2 diabetes mellitus."
            },
            {
              "source": "icd11",
              "title": "Albuminuria, Grade A2 [Type 2 diabetes mellitus]",
              "url": "https://icd.who.int/browse/2024-01/mms/en#119724091"
            },
            {
              "source": "icd11",
              "title": "Albuminuria, Grade A2 [Uncontrolled or unstable diabetes mellitus]",
              "url": "https://icd.who.int/browse/2024-01/mms/en#1156295616"
            },
            {
              "source": "openfda",
              "title": "Drug: uncontrolled type 2 diabetes empagliflozin metformin — Top reported reactions: DRUG INEFFECTIVE, OFF LABEL USE, NAUSEA, FATIGUE, DIARRHOEA",
              "url": "https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:uncontrolled%20type%202%20diabetes%20empagliflozin%20metformin"
            },
            {
              "source": "clinical_trials",
              "title": "Impact of Pharmacogenetic-Guided Treatment on Type 2 Diabetes.",
              "url": "https://clinicaltrials.gov/study/NCT06851962"
            },
            {
              "source": "clinical_trials",
              "title": "New Triple Therapy in Newly Diagnosed Type 2 Diabetes",
              "url": "https://clinicaltrials.gov/study/NCT06946628"
            },
            {
              "source": "clinical_trials",
              "title": "Evaluation of the Impact of Intensive Short-Term Drug Therapy in Patients With Type 2 Diabetes Mellitus",
              "url": "https://clinicaltrials.gov/study/NCT04027023"
            },
            {
              "source": "dailymed",
              "title": "JARDIANCE (EMPAGLIFLOZIN) TABLET, FILM COATED [CARDINAL HEALTH 107, LLC]",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=5777b8a8-ada6-4950-8548-43a1de11f075"
            }
          ]
        },
        {
          "icdCode": "8B11.0",
          "diseaseName": "Diabetic peripheral neuropathy",
          "confidence": "high",
          "evidence": "Bilateral toe tingling, reduced monofilament sensation on right foot, and delayed wound healing on foot are classic findings of early diabetic peripheral neuropathy. These findings in the context of poorly controlled diabetes (HbA1c 8.2%) with prolonged hyperglycemia strongly support this diagnosis. Delayed wound healing is a red flag for progressive neuropathic and vascular compromise.",
          "citations": [
            {
              "source": "europe_pmc",
              "title": "Potential Molecular Biomarkers for Predicting and Monitoring Complications in Type 2 Diabetes Mellitus.",
              "url": "https://europepmc.org/article/MED/41302503",
              "snippet": "Discusses molecular biomarkers for predicting and monitoring diabetic complications including neuropathy."
            },
            {
              "source": "europe_pmc",
              "title": "2023 Clinical Practice Guidelines for Diabetes Management in Korea: Full Version Recommendation of the Korean Diabetes Association.",
              "url": "https://europepmc.org/article/MED/39091005",
              "snippet": "Comprehensive guidelines including screening and management of diabetic neuropathy."
            },
            {
              "source": "europe_pmc",
              "title": "RSSDI Clinical Practice Recommendations for the Management of Type 2 Diabetes Mellitus 2022",
              "url": "https://europepmc.org/article/PMC/PMC9534592",
              "snippet": "Includes recommendations for screening and management of diabetic neuropathy complications."
            }
          ]
        },
        {
          "icdCode": "GB42.0",
          "diseaseName": "Diabetic nephropathy (early stage — microalbuminuria)",
          "confidence": "high",
          "evidence": "Elevated urine microalbumin with normal creatinine indicates early diabetic nephropathy (Grade A2 albuminuria). This is a significant red flag for progressive renal disease in the setting of poorly controlled type 2 diabetes. Addition of empagliflozin is appropriate given its demonstrated renal protective benefits.",
          "citations": [
            {
              "source": "icd11",
              "title": "Albuminuria, Grade A2 [Type 2 diabetes mellitus]",
              "url": "https://icd.who.int/browse/2024-01/mms/en#119724091"
            },
            {
              "source": "icd11",
              "title": "Albuminuria, Grade A2 [Diabetic nephropathy]",
              "url": "https://icd.who.int/browse/2024-01/mms/en#unspecified"
            },
            {
              "source": "europe_pmc",
              "title": "Potential Molecular Biomarkers for Predicting and Monitoring Complications in Type 2 Diabetes Mellitus.",
              "url": "https://europepmc.org/article/MED/41302503",
              "snippet": "Discusses biomarkers for monitoring diabetic nephropathy and other microvascular complications."
            },
            {
              "source": "dailymed",
              "title": "JARDIANCE (EMPAGLIFLOZIN) TABLET, FILM COATED [CARDINAL HEALTH 107, LLC]",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=5777b8a8-ada6-4950-8548-43a1de11f075"
            }
          ]
        }
      ],
      "research": [
        {
          "question": "What are current best practices for intensifying therapy in poorly controlled type 2 diabetes in primary care?",
          "answer": "## Intensifying Therapy in Poorly Controlled Type 2 Diabetes: Evidence-Based Best Practices\n\n### Patient Context\n\nThis patient presents with **HbA1c 8.2%** (rising from 7.6%), postprandial glucose spikes to **270 mg/dL**, and early microvascular complications (peripheral neuropathy, microalbuminuria, possible retinopathy). This clinical picture is classified under **ICD-11 5A24/5A11 — Uncontrolled or unstable diabetes mellitus [Type 2 diabetes mellitus]** [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#119724091) and **5A11 — Type 2 diabetes mellitus** [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#119724091). The presence of complications demands timely, evidence-based therapy intensification.\n\n---\n\n## 1. Guiding Principles for Therapy Intensification\n\n### Avoid Clinical Inertia\n\nClinical inertia — the failure to intensify therapy when targets are not met — is a major barrier in primary care. The **INTEGRA Study**, a primary care intervention trial targeting patients with poorly controlled T2DM, demonstrated that structured intensification protocols in primary care significantly improve glycemic outcomes [[TRIALS]](https://clinicaltrials.gov/study/NCT02663245).\n\n### Individualized HbA1c Targets\n\n- For most adults: **< 7.0%** (ADA/EASD consensus)\n- For patients with established complications (as in this case): a target of **< 7.0%** is appropriate, but avoid aggressive lowering that risks hypoglycemia\n- This patient's **HbA1c of 8.2%** is clearly above target and warrants dual or triple therapy\n\n---\n\n## 2. Evaluating the Current Plan: Metformin + Empagliflozin\n\nThe physician's decision to titrate **metformin to 1000 mg BID** and add **empagliflozin** (an SGLT2 inhibitor) is well-supported by current evidence.\n\n### Why SGLT2 Inhibitors Are an Excellent Choice Here\n\n| Factor | Relevance to This Patient |\n|--------|--------------------------|\n| **HbA1c reduction** | 0.5–0.8% additional lowering expected |\n| **Renal protection** | Slows progression of diabetic kidney disease — critical given **elevated microalbuminuria** |\n| **Cardiovascular benefit** | Reduces heart failure hospitalization and major adverse cardiovascular events |\n| **Weight effect** | Modest weight loss (2–3 kg), beneficial if overweight |\n| **Blood pressure** | Mild reduction (~3–5 mmHg systolic) |\n\nReal-world data from the **ADD2Dia study** confirmed the clinical effectiveness of adding an SGLT2 inhibitor to existing oral therapy, showing significant HbA1c reductions and improved metabolic parameters in routine clinical practice [[EPMC]](https://europepmc.org/article/MED/41175321).\n\n> **Important:** SGLT2 inhibitors and GLP-1 receptor agonists provide complementary yet distinct cardiovascular and renal benefits, and their combined use is increasingly supported [[EPMC]](https://europepmc.org/article/MED/41301689).\n\n### Residual Renal Risk\n\nEven with SGLT2 inhibitor therapy, **residual renal risk** persists in diabetic nephropathy. Close monitoring of microalbuminuria and eGFR is essential, and additional agents (e.g., finerenone, a nonsteroidal mineralocorticoid receptor antagonist) may be considered if albuminuria progresses despite optimized therapy [[EPMC]](https://europepmc.org/article/MED/41682601).\n\n---\n\n## 3. Consider Additional Agents if Targets Are Not Met at Follow-Up\n\nIf **HbA1c remains ≥ 7.0%** at the 6-week follow-up (or subsequent 3-month reassessment), further intensification should be considered:\n\n### GLP-1 Receptor Agonists (Strong Recommendation)\n\n- **Semaglutide** (oral or injectable) or **liraglutide** are preferred add-on agents\n- Provide **1.0–1.8% additional HbA1c reduction**\n- Significant cardiovascular risk reduction, complementary to SGLT2 inhibitors [[EPMC]](https://europepmc.org/article/MED/41301689)\n- Address **postprandial hyperglycemia** (a major issue for this patient with spikes to 270 mg/dL) by slowing gastric emptying and enhancing glucose-dependent insulin secretion\n- Promote weight loss (relevant for phenotype-guided obesity/diabetes management) [[EPMC]](https://europepmc.org/article/MED/41212412)\n\n### Insulin Therapy\n\nIf oral/injectable non-insulin agents are insufficient:\n\n- **Basal insulin** (e.g., insulin glargine, degludec) is the standard first step\n- For patients with significant postprandial excursions, **basal-bolus** regimens or **premixed insulin** may be needed\n- A Phase 4 trial comparing **thrice-daily premixed human insulin vs. basal-bolus therapy** in poorly controlled T2DM found both approaches effective, with premixed regimens offering a simpler alternative in primary care [[TRIALS]](https://clinicaltrials.gov/study/NCT06855615)\n\n> **Caution:** Rapid metabolic correction with insulin can rarely cause transient complications such as insulin-induced edema, particularly in severely uncontrolled patients [[EPMC]](https://europepmc.org/article/MED/41640926).\n\n### Stepwise Intensification Summary\n\n| Step | Regimen | Expected Additional HbA1c Reduction |\n|------|---------|-------------------------------------|\n| **Current** | Metformin 1000 mg BID + Empagliflozin | ~0.5–0.8% |\n| **Step 2** | Add GLP-1 RA (e.g., semaglutide) | ~1.0–1.8% |\n| **Step 3** | Add basal insulin | ~1.0–2.0% |\n| **Step 4** | Basal-bolus or premixed insulin | Variable, individualized |\n\n---\n\n## 4. Addressing Postprandial Hyperglycemia\n\nThis patient's postprandial glucose of **270 mg/dL** is a critical target. Strategies include:\n\n- **Dietary modification:** Reduce high-glycemic-load foods (white rice, sweets, sugary coffee) — already counseled\n- **GLP-1 RA addition:** Most effective pharmacologic intervention for postprandial spikes\n- **Continuous glucose monitoring (CGM):** A Saudi Arabian consensus statement supports CGM use even in non-intensively managed T2DM to identify glycemic patterns, improve time-in-range, and guide therapy adjustments [[EPMC]](https://europepmc.org/article/MED/41601933)\n\n---\n\n## 5. Managing Early Complications\n\n### Peripheral Neuropathy & Foot Care\n\n- Optimize glycemic control (most important modifiable factor)\n- Annual comprehensive foot exams; more frequent given current findings (reduced monofilament sensation, delayed wound healing)\n- Patient education on daily foot inspection and appropriate footwear\n\n### Microalbuminuria\n\n- **ACE inhibitor or ARB** should be initiated if not already prescribed — first-line for renoprotection in diabetic nephropathy\n- SGLT2 inhibitor (empagliflozin) provides additive renal benefit\n- Monitor urine albumin-to-creatinine ratio and eGFR every 3–6 months\n\n### Retinopathy Screening\n\n- Ophthalmology referral (already ordered) is appropriate and urgent given visual symptoms\n\n---\n\n## 6. Monitoring and Safety Considerations\n\n### Adverse Event Awareness\n\nOpenFDA adverse event data for diabetes therapy intensification highlights the most commonly reported reactions: **drug ineffective, off-label use, nausea, fatigue, and diarrhea** [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:type%202%20diabetes%20therapy%20intensification%20poorly). This underscores the importance of:\n\n- Monitoring for **GI side effects** (metformin, GLP-1 RAs)\n- Assessing for **genital mycotic infections and UTIs** (SGLT2 inhibitors)\n- Evaluating for **euglycemic DKA** (rare but serious with SGLT2 inhibitors)\n\n### OTC Medication Counseling\n\nPatients with diabetes should be counseled to use **diabetes-appropriate OTC formulations** (sugar-free, alcohol-free) for common illnesses such as cold and flu [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=279e309c-040d-4001-808d-b7d986a9a1d8) [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=16272e93-0062-935a-e063-6294a90a0dda).\n\n---\n\n## 7. Key Recommendations for This Patient\n\n1. **Continue current plan:** Metformin 1000 mg BID + empagliflozin — well-supported\n2. **Initiate ACE inhibitor/ARB** if not already on one (for microalbuminuria)\n3. **At 6-week follow-up:** If HbA1c remains > 7.0%, strongly consider adding a **GLP-1 receptor agonist**\n4. **Consider CGM** to characterize postprandial patterns and guide therapy\n5. **Aggressive lifestyle intervention:** Structured dietary counseling (reduce glycemic load), graduated exercise program\n6. **Complication surveillance:** Ophthalmology (urgent), repeat microalbumin, lipid panel, regular foot exams\n7. **Reassess every 3 months** until at target; avoid clinical inertia\n\n> **Clinical Pearl:** The combination of **metformin + SGLT2 inhibitor + GLP-1 RA** represents the current optimal triple oral/injectable non-insulin regimen for T2DM with established or high-risk cardiovascular/renal disease, addressing glycemia, cardiorenal protection, and weight management simultaneously.\n\n---\n\n## References\n\n1. \"ADD2Dia: Real-World Clinical Effectiveness of Adding an SGLT2 Inhibitor to Gliclazide-Based Therapy in Type 2 Diabetes.\" *Adv Ther*, 2025. [[EPMC]](https://europepmc.org/article/MED/41175321)\n\n2. \"Complementary Yet Distinct Roles of GLP-1 Receptor Agonists and SGLT2 Inhibitors in Cardiovascular Risk Reduction.\" *Biomedicines*, 2025. [[EPMC]](https://europepmc.org/article/MED/41301689)\n\n3. \"Use of continuous glucose monitoring in non-intensively managed type 2 diabetes: a Saudi Arabian consensus.\" *Front Endocrinol*, 2025. [[EPMC]](https://europepmc.org/article/MED/41601933)\n\n4. \"Residual Renal Risk in Diabetic Nephropathy Despite Contemporary Therapies.\" *J Clin Med*, 2026. [[EPMC]](https://europepmc.org/article/MED/41682601)\n\n5. \"Precision obesity medicine: A phenotype-guided framework for pharmacologic therapy across the lifespan.\" *J Endocrinol Invest*, 2025. [[EPMC]](https://europepmc.org/article/MED/41212412)\n\n6. \"Transient Insulin-Induced Edema Following Rapid Metabolic Correction in Poorly Controlled Pediatric Type 1 Diabetes Mellitus.\" *Cureus*, 2026. [[EPMC]](https://europepmc.org/article/MED/41640926)\n\n7. ICD-11: Uncontrolled or unstable diabetes mellitus [Type 2 diabetes mellitus] (5A24/5A11). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#119724091)\n\n8. OpenFDA Drug Adverse Events: Diabetes therapy intensification. [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:type%202%20diabetes%20therapy%20intensification%20poorly)\n\n9. \"Comparison of Thrice-Daily Premixed Human Insulin with Basal-Bolus Therapy Among Patients with Poorly Controlled Type 2 Diabetes Mellitus.\" NCT06855615. [[TRIALS]](https://clinicaltrials.gov/study/NCT06855615)\n\n10. \"INTEGRA Study: Primary Care Intervention in Type 2 Diabetes Patients With Poor Glycaemic Control.\" NCT02663245. [[TRIALS]](https://clinicaltrials.gov/study/NCT02663245)\n\n11. DailyMed: Safetussin High Blood Pressure and Diabetes Cough, Cold and Flu. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=279e309c-040d-4001-808d-b7d986a9a1d8)\n\n12. DailyMed: Vicks DayQuil for People with Diabetes. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=16272e93-0062-935a-e063-6294a90a0dda)",
          "citations": [
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#119724091"
            },
            {
              "source": "clinical_trials",
              "title": "TRIALS",
              "url": "https://clinicaltrials.gov/study/NCT02663245"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41175321"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41301689"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41682601"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41212412"
            },
            {
              "source": "clinical_trials",
              "title": "TRIALS",
              "url": "https://clinicaltrials.gov/study/NCT06855615"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41640926"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41601933"
            },
            {
              "source": "openfda",
              "title": "FDA",
              "url": "https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:type%202%20diabetes%20therapy%20intensification%20poorly"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=279e309c-040d-4001-808d-b7d986a9a1d8"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=16272e93-0062-935a-e063-6294a90a0dda"
            }
          ],
          "metadata": {
            "modelId": "claude-opus-4-6",
            "promptFamily": "research",
            "generatedAt": "2026-03-12T12:52:08.532Z"
          }
        },
        {
          "question": "What evaluation is recommended for diabetic peripheral neuropathy symptoms in an outpatient visit?",
          "answer": "## Evaluation of Diabetic Peripheral Neuropathy in the Outpatient Setting\n\n### Patient-Specific Context\n\nThis patient presents with **bilateral toe tingling**, **reduced monofilament sensation on the right foot**, and **delayed wound healing** — all classic features of early diabetic peripheral neuropathy (DPN). With an **HbA1c of 8.2%** and concurrent microalbuminuria, this is consistent with the ICD-11 classification **8C03.0 — Diabetic polyneuropathy** [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1837670870). Notably, early neuropathy has been shown to be a predictor of subclinical diabetic nephropathy, reinforcing the importance of comprehensive evaluation in this patient who already has elevated microalbuminuria [[EPMC]](https://europepmc.org/article/MED/41255512).\n\n---\n\n## 1. Recommended Clinical Assessment\n\n### History Taking\n\nA thorough neuropathy-focused history should include:\n\n- **Symptom characterization:** Onset, distribution (typically \"stocking-glove\"), quality (tingling, burning, numbness, lancinating pain), and severity\n- **Functional impact:** Difficulty with balance, gait instability, falls, interference with sleep or daily activities\n- **Autonomic symptoms:** Orthostatic dizziness, gastroparesis, erectile dysfunction, sudomotor dysfunction — as autonomic neuropathy frequently coexists with sensorimotor DPN [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1129679469) [[EPMC]](https://europepmc.org/article/MED/41595554)\n- **Risk factor assessment:** Duration of diabetes, glycemic control history, alcohol use, vitamin B12 status (especially with long-term metformin use), renal function, and medication history\n\n### Validated Screening Instruments\n\nStandardized questionnaires improve diagnostic consistency:\n\n- **Michigan Neuropathy Screening Instrument (MNSI)**\n- **Toronto Clinical Neuropathy Score (TCNS)**\n- **DN4 (Douleur Neuropathique 4)** — for neuropathic pain characterization\n\nThese tools are recommended as part of a systematic approach to early DPN diagnosis [[EPMC]](https://europepmc.org/article/MED/41458830).\n\n---\n\n## 2. Bedside Physical Examination\n\nA comprehensive review of current diagnostic tests for DPN highlights the following essential bedside evaluations [[EPMC]](https://europepmc.org/article/MED/41458830) [[EPMC]](https://europepmc.org/article/MED/41364419):\n\n### Sensory Testing\n\n| Modality | Test | What It Assesses |\n|----------|------|-----------------|\n| **Light touch/pressure** | 10-g Semmes-Weinstein monofilament | Large-fiber function; loss predicts ulcer risk |\n| **Vibration** | 128-Hz tuning fork (dorsum of great toe) | Large-fiber function |\n| **Pinprick** | Disposable pin/neurotip | Small-fiber (Aδ) function |\n| **Temperature** | Warm/cool object (e.g., tuning fork handle) | Small-fiber (C-fiber) function |\n| **Proprioception** | Great toe up/down position sense | Large-fiber / posterior column function |\n\n> **ADA Recommendation:** All patients with T2DM should be screened for DPN at diagnosis and annually thereafter using the **10-g monofilament** plus at least one other modality (vibration, pinprick, or temperature).\n\nThis patient already has **reduced monofilament sensation on the right foot** — this alone confers significantly elevated risk for foot ulceration and should trigger enhanced foot surveillance.\n\n### Reflex Testing\n\n- **Ankle reflexes (Achilles tendon):** Diminished or absent ankle jerks are among the earliest objective signs of DPN\n- Compare bilaterally and with reinforcement (Jendrassik maneuver)\n\n### Foot Examination\n\nA cross-sectional study of ambulatory diabetic patients found that sensory loss in the feet was significantly associated with **longer diabetes duration, higher HbA1c, and presence of other microvascular complications** [[EPMC]](https://europepmc.org/article/MED/41026862). The foot exam should include:\n\n- **Skin inspection:** Dryness, calluses, fissures, ulcers, fungal infections\n- **Wound assessment:** This patient's delayed-healing foot wound requires documentation of size, depth, signs of infection, and vascular adequacy — classified under **BD54 — Diabetic foot ulcer** if ulceration is present [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#74527684)\n- **Vascular assessment:** Pedal pulses (dorsalis pedis, posterior tibial), capillary refill time\n- **Musculoskeletal:** Deformities (Charcot foot, hammer toes, bunions) that increase pressure points\n\n> **Clinical Alert:** Adherence to structured clinical practice guidelines for diabetic foot assessment and management has been correlated with improved patient outcomes [[PUBMED]](https://pubmed.ncbi.nlm.nih.gov/24825001/).\n\n---\n\n## 3. Laboratory Evaluation\n\n### Essential Labs for DPN Workup\n\n- **HbA1c:** Already obtained (8.2%) — confirms poor glycemic control as the primary driver\n- **Vitamin B12 level:** **Critical in this patient** — long-term metformin use is associated with B12 deficiency, which can cause or exacerbate peripheral neuropathy. An ongoing Phase 4 trial is evaluating parenteral vitamin B complex (including B12) in symptomatic diabetic polyneuropathy [[TRIALS]](https://clinicaltrials.gov/study/NCT07296354)\n- **Serum creatinine / eGFR:** To assess renal function (already normal in this patient)\n- **Urine albumin-to-creatinine ratio (UACR):** Already elevated — confirms concurrent nephropathy\n- **Thyroid function (TSH):** Hypothyroidism is a treatable cause of neuropathy\n- **Complete blood count:** To exclude anemia or macrocytosis (B12 deficiency marker)\n- **Fasting lipid panel:** Already ordered — dyslipidemia contributes to neuropathy progression\n\n### Consider If Atypical Features Present\n\n- **Serum protein electrophoresis (SPEP):** If asymmetric, rapidly progressive, or predominantly motor neuropathy (to exclude paraproteinemia)\n- **RPR/VDRL, HIV testing:** If risk factors present\n- **Heavy metals, folate:** If clinical suspicion warrants\n\n---\n\n## 4. Advanced Diagnostic Testing\n\nWhen bedside evaluation is inconclusive or atypical features are present, advanced testing may be warranted [[EPMC]](https://europepmc.org/article/MED/41458830) [[EPMC]](https://europepmc.org/article/MED/41364419):\n\n### Electrodiagnostic Studies\n\n| Test | Indication | What It Detects |\n|------|-----------|----------------|\n| **Nerve conduction studies (NCS)** | Gold standard for confirming large-fiber neuropathy | Demyelination vs. axonal loss; severity grading |\n| **Electromyography (EMG)** | If motor involvement suspected | Denervation, reinnervation patterns |\n\n### Small-Fiber Neuropathy Assessment\n\nStandard NCS may be **normal** in early DPN when only small fibers are affected. Newer modalities include:\n\n- **Sudoscan (electrochemical skin conductance):** Non-invasive assessment of sudomotor (sweat gland) function; evaluates small-fiber and autonomic neuropathy. A recent study demonstrated its utility alongside vitamin B12 assessment in T2DM patients with high cardiovascular risk [[EPMC]](https://europepmc.org/article/MED/41595554)\n- **Skin punch biopsy (intraepidermal nerve fiber density — IENFD):** Most sensitive test for small-fiber neuropathy; considered the diagnostic gold standard for early/small-fiber DPN\n- **Corneal confocal microscopy (CCM):** Non-invasive imaging of corneal nerve fibers as a surrogate for systemic small-fiber damage\n- **Quantitative sensory testing (QST):** Standardized assessment of thermal and vibration thresholds\n\n> A completed clinical trial comparing histamine iontophoresis and local heating for evoking the axon-reflex flare response in diabetes explored novel methods for detecting early small-fiber dysfunction [[TRIALS]](https://clinicaltrials.gov/study/NCT05921097).\n\n### Autonomic Neuropathy Screening\n\nGiven the overlap between sensorimotor and autonomic DPN, consider screening for **diabetic cardiovascular autonomic neuropathy (CAN)** [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1129679469):\n\n- **Orthostatic blood pressure measurement**\n- **Heart rate variability testing**\n- **Resting tachycardia assessment**\n\nAn ongoing Phase 2 trial is investigating **finerenone** for diabetic cardiovascular autonomic neuropathy, highlighting the growing recognition of CAN as a treatment target [[TRIALS]](https://clinicaltrials.gov/study/NCT06906081).\n\n---\n\n## 5. Risk Stratification and Foot Risk Classification\n\nBased on the evaluation, classify the patient's foot risk level:\n\n| Risk Category | Findings | Follow-Up Frequency |\n|--------------|----------|---------------------|\n| **Low risk** | Normal sensation, no deformity | Annual |\n| **Moderate risk** | Loss of sensation OR deformity OR vascular disease | Every 3–6 months |\n| **High risk** | Loss of sensation + deformity or vascular disease | Every 1–3 months |\n| **Active problem** | Ulcer, infection, Charcot foot | Immediate specialist referral |\n\n> **This patient is at minimum MODERATE-to-HIGH risk** given reduced monofilament sensation and delayed wound healing. Follow-up should be every **1–3 months** with structured foot care education.\n\n---\n\n## 6. Symptomatic Management Considerations\n\n### Pharmacologic Pain Management\n\nIf neuropathic pain is present or develops, first-line agents include:\n\n- **Duloxetine** (60–120 mg/day)\n- **Pregabalin** (150–600 mg/day)\n- **Gabapentin** (900–3600 mg/day)\n\nAn ongoing trial is also evaluating **piracetam** as a potential treatment for DPN [[TRIALS]](https://clinicaltrials.gov/study/NCT06479629).\n\n> **FDA adverse event data** for drugs used in DPN management show the most commonly reported reactions include **peripheral swelling, peripheral edema, neuropathy progression, fatigue, and pain in extremity** — clinicians should monitor for these during treatment [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:diabetic%20peripheral%20neuropathy%20evaluation%20diabetic%20neuropathy).\n\n### Topical Adjuncts\n\nFor localized neuropathic discomfort, OTC topical options may provide adjunctive relief:\n\n- **Diabetic foot creams** containing emollients (dimethicone, petrolatum) help maintain skin integrity and prevent fissuring [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=49132a75-4a16-cede-e063-6294a90a6217)\n- **Menthol-based neuropathy creams** may offer temporary symptomatic relief [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=48739205-627b-41d0-e063-6394a90a3462)\n- **Homeopathic neuropathy preparations** (e.g., arnica-based) are marketed but lack robust evidence [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4a5c232d-5d29-2504-e063-6394a90ac9de)\n- **Capsaicin 0.075% cream** (prescription) has moderate evidence for neuropathic pain\n\n### Non-Pharmacologic Interventions\n\n- **Structured physical exercise programs** have demonstrated benefit for chronic disease management including DPN — an active trial is evaluating community-based exercise programs [[TRIALS]](https://clinicaltrials.gov/study/NCT06771024)\n- **Patient education** on daily foot inspection, appropriate footwear, and avoidance of thermal injury\n\n---\n\n## 7. Summary: Outpatient DPN Evaluation Checklist for This Patient\n\n| Component | Action | Status |\n|-----------|--------|--------|\n| **Symptom history** | Characterize tingling, assess for pain, autonomic symptoms | ⬜ Complete at visit |\n| **Monofilament test** | 10-g at multiple plantar sites bilaterally | ✅ Done (reduced R foot) |\n| **Vibration testing** | 128-Hz tuning fork at great toes | ⬜ Perform |\n| **Pinprick/temperature** | Assess small-fiber function | ⬜ Perform |\n| **Ankle reflexes** | Bilateral comparison | ⬜ Perform |\n| **Comprehensive foot exam** | Skin, wounds, pulses, deformities | ⬜ Document fully |\n| **Vitamin B12 level** | Essential with chronic metformin use | ⬜ Order |\n| **TSH** | Rule out hypothyroid neuropathy | ⬜ Order |\n| **Foot risk classification** | Stratify and set follow-up interval | ⬜ Classify |\n| **Ophthalmology referral** | Concurrent retinopathy screening | ✅ Ordered |\n| **Patient education** | Foot care, footwear, daily inspection | ⬜ Reinforce |\n\n---\n\n## References\n\n1. \"Correlation of adherence to the 2012 IDSA practice guidelines with patient outcomes in diabetic foot infections.\" *Diabet Med*, 2014. [[PUBMED]](https://pubmed.ncbi.nlm.nih.gov/24825001/)\n\n2. \"Assessment of Autonomic Polyneuropathy Through Sudoscan and Vitamin B12 in T2DM Patients.\" *Biomedicines*, 2025. [[EPMC]](https://europepmc.org/article/MED/41595554)\n\n3. \"Early Diagnosis of Diabetic Neuropathy: A Review of Current Diagnostic Tests.\" *Cureus*, 2025. [[EPMC]](https://europepmc.org/article/MED/41458830)\n\n4. \"Early Neuropathy as a Predictor of Subclinical Diabetic Nephropathy in Well-Controlled T2DM.\" *J Diabetes Res*, 2025. [[EPMC]](https://europepmc.org/article/MED/41255512)\n\n5. \"Diabetic Peripheral Neuropathy: New Diagnostics and Treatment Perspectives.\" *Drugs Aging*, 2026. [[EPMC]](https://europepmc.org/article/MED/41364419)\n\n6. \"Evaluation of sensory loss in the feet and associated factors in ambulatory patients with diabetes.\" *Arch Endocrinol Metab*, 2025. [[EPMC]](https://europepmc.org/article/MED/41026862)\n\n7. \"Prevalence and associated factors of peripheral neuropathy in T2DM: Khartoum State.\" *BMC Endocr Disord*, 2025. [[EPMC]](https://europepmc.org/article/MED/41366350)\n\n8. \"Advanced strategies for management of diabetic foot ulcers.\" *Korean J Intern Med*, 2026. [[EPMC]](https://europepmc.org/article/MED/41531215)\n\n9. ICD-11: 8C03.0 — Diabetic polyneuropathy. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1837670870)\n\n10. ICD-11: 8D88.1 — Autonomic neuropathy due to diabetes mellitus. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1129679469)\n\n11. ICD-11: BD54 — Diabetic foot ulcer. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#74527684)\n\n12. OpenFDA: Drug adverse events — DPN-related medications. [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:diabetic%20peripheral%20neuropathy%20evaluation%20diabetic%20neuropathy)\n\n13. \"Evaluation of ATP-Containing Parenteral Vitamin B Complex in Symptomatic Diabetic Polyneuropathy.\" NCT07296354. [[TRIALS]](https://clinicaltrials.gov/study/NCT07296354)\n\n14. \"Finerenone Treatment for Diabetic Cardiovascular Autonomic Neuropathy (FibroCAN).\" NCT06906081. [[TRIALS]](https://clinicaltrials.gov/study/NCT06906081)\n\n15. \"The Effect of Piracetam on Diabetic Peripheral Neuropathy Patients.\" NCT06479629. [[TRIALS]](https://clinicaltrials.gov/study/NCT06479629)\n\n16. \"Comparison of Histamine and Local Heating for Evoking the Axon-reflex Flare Response in Diabetes.\" NCT05921097. [[TRIALS]](https://clinicaltrials.gov/study/NCT05921097)\n\n17. \"Community Physical Exercise Program in Chronic Disease.\" NCT06771024. [[TRIALS]](https://clinicaltrials.gov/study/NCT06771024)\n\n18. DailyMed: Theracare Diabetic Foot Cream. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=49132a75-4a16-cede-e063-6294a90a6217)\n\n19. DailyMed: Neuropathy Cream (Menthol). [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=48739205-627b-41d0-e063-6394a90a3462)\n\n20. DailyMed: Dermfree Neuropathy Cream. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4a5c232d-5d29-2504-e063-6394a90ac9de)",
          "citations": [
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#1837670870"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41255512"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#1129679469"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41595554"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41458830"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41364419"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41026862"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#74527684"
            },
            {
              "source": "pubmed",
              "title": "PUBMED",
              "url": "https://pubmed.ncbi.nlm.nih.gov/24825001/"
            },
            {
              "source": "clinical_trials",
              "title": "TRIALS",
              "url": "https://clinicaltrials.gov/study/NCT07296354"
            },
            {
              "source": "clinical_trials",
              "title": "TRIALS",
              "url": "https://clinicaltrials.gov/study/NCT05921097"
            },
            {
              "source": "clinical_trials",
              "title": "TRIALS",
              "url": "https://clinicaltrials.gov/study/NCT06906081"
            },
            {
              "source": "clinical_trials",
              "title": "TRIALS",
              "url": "https://clinicaltrials.gov/study/NCT06479629"
            },
            {
              "source": "openfda",
              "title": "FDA",
              "url": "https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:diabetic%20peripheral%20neuropathy%20evaluation%20diabetic%20neuropathy"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=49132a75-4a16-cede-e063-6294a90a6217"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=48739205-627b-41d0-e063-6394a90a3462"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4a5c232d-5d29-2504-e063-6394a90ac9de"
            },
            {
              "source": "clinical_trials",
              "title": "TRIALS",
              "url": "https://clinicaltrials.gov/study/NCT06771024"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41366350"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41531215"
            }
          ],
          "metadata": {
            "modelId": "claude-opus-4-6",
            "promptFamily": "research",
            "generatedAt": "2026-03-12T12:53:06.635Z"
          }
        },
        {
          "question": "What screenings and follow-up priorities should be documented when type 2 diabetes control is worsening?",
          "answer": "## Screenings and Follow-Up Priorities When Type 2 Diabetes Control Is Worsening\n\n### Clinical Context\n\nThis patient exemplifies the critical juncture of **deteriorating glycemic control** — HbA1c rising from 7.6% to **8.2%**, fasting glucose **180 mg/dL**, postprandial spikes to **270 mg/dL** — with emerging microvascular complications. This is appropriately classified as **5A24/5A11 — Uncontrolled or unstable diabetes mellitus [Type 2 diabetes mellitus]** [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#119724091). Documenting a systematic screening and follow-up plan is essential to prevent irreversible end-organ damage.\n\n---\n\n## 1. Glycemic Monitoring and Documentation\n\n### Core Glycemic Metrics\n\n| Parameter | Target | This Patient | Action |\n|-----------|--------|-------------|--------|\n| **HbA1c** | < 7.0% | 8.2% (↑ from 7.6%) | Recheck in **3 months** after therapy change |\n| **Fasting glucose** | 80–130 mg/dL | 180 mg/dL | Document trend; correlate with adherence |\n| **Postprandial glucose** | < 180 mg/dL | 270 mg/dL | Prioritize interventions targeting PPG |\n\n### Continuous Glucose Monitoring (CGM)\n\nAn active clinical trial is evaluating **CGM for outpatient diabetes management** after care transitions, supporting the growing role of CGM in non-insulin-treated T2DM for identifying glycemic patterns, time-in-range, and guiding therapy adjustments [[TRIALS]](https://clinicaltrials.gov/study/NCT06852950).\n\n> **Documentation Priority:** Record the **rate of HbA1c change** (0.6% increase over the interval), not just the absolute value. A rising trajectory signals urgency and justifies intensification.\n\n---\n\n## 2. Comprehensive Complication Screening\n\nWhen glycemic control deteriorates, a systematic organ-by-organ complication screen must be documented. An Egyptian expert consensus on T2DM management in primary care emphasizes that **structured, guideline-driven screening protocols** are the cornerstone of preventing complications in the primary care setting [[EPMC]](https://europepmc.org/article/MED/41299307).\n\n### A. Retinopathy Screening (URGENT for This Patient)\n\nThis patient reports **blurry vision** — a red flag requiring prompt evaluation.\n\n- **Dilated fundoscopic exam or retinal photography:** Should be performed at T2DM diagnosis and **annually** thereafter; more frequently with worsening control\n- **Ophthalmology referral:** Already ordered — document urgency and reason (symptomatic visual change + uncontrolled diabetes)\n- A Norwegian pilot study on implementing systematic diabetic retinopathy screening demonstrated that structured screening programs significantly improve detection rates and reduce sight-threatening complications [[EPMC]](https://europepmc.org/article/PMC/PMC12973592)\n- A Delphi consensus now supports consideration of **fenofibrate as systemic therapy** for prevention of diabetic retinopathy progression, particularly in patients with dyslipidemia and worsening retinal findings [[EPMC]](https://europepmc.org/article/MED/41677041)\n\n> **Document:** Visual symptoms, acuity if measured, referral date, and urgency level. Note that phacoemulsification outcomes are altered in diabetic patients, reinforcing the importance of early detection and glycemic optimization before any surgical intervention [[EPMC]](https://europepmc.org/article/MED/41717158).\n\n### B. Nephropathy Screening\n\n| Test | Frequency | This Patient |\n|------|-----------|-------------|\n| **Urine albumin-to-creatinine ratio (UACR)** | Annually; q3–6 months if abnormal | **Elevated** — confirms microalbuminuria |\n| **Serum creatinine / eGFR** | Annually; more often if declining | Normal — document baseline |\n\n- **Document:** Stage of albuminuria (A2: 30–300 mg/g), eGFR category, and whether **ACE inhibitor or ARB** has been initiated (first-line renoprotection — not yet documented in this patient's plan)\n- Repeat UACR in **3–6 months** to confirm persistence and assess response to therapy\n\n### C. Neuropathy Screening\n\n- **10-g monofilament:** Already abnormal (reduced right foot) — document specific sites tested\n- **Vibration (128-Hz tuning fork), pinprick, ankle reflexes:** Should be performed and documented\n- **Foot risk classification:** This patient is at minimum **moderate-to-high risk** given sensory loss + delayed wound healing\n- **Document:** Wound characteristics (location, size, depth, infection signs), vascular status (pedal pulses), and follow-up interval (every 1–3 months)\n\n### D. Cardiovascular Risk Assessment\n\n| Screening | Rationale | Action |\n|-----------|-----------|--------|\n| **Lipid panel** | Dyslipidemia accelerates macrovascular disease | Already ordered — document and treat to target |\n| **Blood pressure** | Hypertension compounds micro/macrovascular risk | Document at every visit; target < 130/80 mmHg |\n| **10-year CVD risk score** | Guides statin/aspirin therapy | Calculate and document (e.g., ASCVD risk calculator) |\n| **ECG** | Baseline cardiac assessment | Consider if not recently performed |\n\n### E. Sleep Apnea Screening\n\nA recent review highlights the **bidirectional relationship between sleep apnea and diabetes** — obstructive sleep apnea (OSA) worsens insulin resistance and glycemic control, while diabetes increases OSA risk [[EPMC]](https://europepmc.org/article/MED/41342166).\n\n- **Screen with:** STOP-BANG questionnaire or Epworth Sleepiness Scale\n- **Document:** Snoring history, daytime somnolence, BMI, neck circumference\n- **Relevance:** Untreated OSA may be a **hidden contributor** to this patient's worsening glycemic control despite therapy\n\n> An active trial is evaluating the effects of **sleep hygiene education and progressive relaxation** on anxiety, sleep quality, and glycemic control in diabetic patients, underscoring the clinical importance of addressing sleep in diabetes management [[TRIALS]](https://clinicaltrials.gov/study/NCT06960408).\n\n---\n\n## 3. Laboratory Follow-Up Priorities\n\n### Immediate Orders (This Visit)\n\n| Lab | Rationale |\n|-----|-----------|\n| **Lipid panel** | ✅ Already ordered — CVD risk stratification |\n| **Vitamin B12** | Long-term metformin use → risk of deficiency → can worsen neuropathy |\n| **TSH** | Rule out hypothyroidism as contributor to fatigue, neuropathy, dyslipidemia |\n| **CBC** | Baseline; macrocytosis may indicate B12 deficiency |\n| **Comprehensive metabolic panel** | Hepatic/renal function baseline before empagliflozin initiation |\n| **UACR (confirmatory)** | Confirm persistent microalbuminuria if only one prior measurement |\n\n### At 6-Week Follow-Up\n\n- **Fasting glucose and symptom reassessment** — evaluate response to metformin titration + empagliflozin\n- **Renal function (Cr/eGFR)** — monitor after SGLT2 inhibitor initiation (expected mild initial eGFR dip)\n- **Electrolytes** — SGLT2 inhibitors can affect volume status\n- **Foot wound reassessment** — document healing trajectory\n\n### At 3-Month Follow-Up\n\n- **HbA1c** — the definitive measure of therapy response\n- **UACR** — trend microalbuminuria\n- **Ophthalmology report review** — integrate findings into care plan\n\n---\n\n## 4. Screening for Secondary Causes of Worsening Control\n\nWhen glycemic control deteriorates despite adherence, document evaluation for secondary contributors:\n\n- **Medication adherence assessment:** Use structured tools (e.g., Morisky scale); document barriers\n- **Dietary review:** This patient has identified high-glycemic-load dietary patterns — document specific counseling provided\n- **Pancreatic pathology:** In atypical cases, consider pancreatogenic (Type 3c) diabetes. A recent review highlights the importance of distinguishing pancreatogenic diabetes through molecular and imaging evidence, particularly when glycemic deterioration is unexplained [[EPMC]](https://europepmc.org/article/MED/41675641) [[EPMC]](https://europepmc.org/article/MED/41252284)\n- **Intercurrent illness or medications:** Corticosteroids, antipsychotics, and other diabetogenic drugs\n- **Coagulation and hematologic changes:** Altered coagulation and platelet indices have been documented in T2DM patients, which may be relevant in patients with vascular complications [[EPMC]](https://europepmc.org/article/MED/41563951)\n\n---\n\n## 5. Social Determinants and Health-Related Social Needs\n\nWorsening diabetes control frequently has **non-medical drivers**. An active trial is evaluating a multi-level health-related social needs initiative to address barriers such as food insecurity, transportation, and health literacy that directly impact diabetes outcomes [[TRIALS]](https://clinicaltrials.gov/study/NCT06831162).\n\n### Document Assessment Of:\n\n- **Food security:** Access to affordable, diabetes-appropriate foods\n- **Health literacy:** Understanding of medication regimen, glucose monitoring, dietary recommendations\n- **Financial barriers:** Medication costs, insurance coverage for empagliflozin, glucose monitoring supplies\n- **Mental health:** Depression screening (PHQ-2/PHQ-9) — depression is highly prevalent in poorly controlled diabetes and impairs self-management\n\n---\n\n## 6. Medication Safety Documentation\n\n### Adverse Event Monitoring\n\nOpenFDA data for diabetes medications in the context of worsening glycemic control show the most commonly reported adverse events are **drug ineffective, off-label use, nausea, fatigue, and diarrhea** [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:type%202%20diabetes%20worsening%20glycemic%20control).\n\n**Document at each visit:**\n\n- GI tolerance of metformin (this patient reports mild GI effects — acceptable)\n- SGLT2 inhibitor-specific monitoring: genital mycotic infections, UTI symptoms, volume depletion, euglycemic DKA risk\n- Any new symptoms that may represent adverse drug reactions\n\n### OTC Medication Counseling\n\nPatients with diabetes should be counseled to use **diabetes-specific OTC formulations** that are sugar-free and alcohol-free for common illnesses:\n\n- **Safetussin** products are specifically formulated for patients with diabetes and high blood pressure [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=279e309c-040d-4001-808d-b7d986a9a1d8)\n- **Vicks DayQuil for People with Diabetes** provides cold/flu relief without sugar or alcohol [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=16272e93-0062-935a-e063-6294a90a0dda)\n- **OTC acid controllers** (e.g., famotidine) may be relevant if GI side effects from metformin require symptomatic management [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=98c6ddc9-8103-40b3-a145-ffbe3374ab6c)\n\n> **Document:** All OTC medications the patient is taking, and counsel to avoid sugar-containing syrups, NSAIDs (renal risk), and decongestants (cardiovascular risk).\n\n---\n\n## 7. Structured Follow-Up Schedule\n\n| Timeframe | Priority Actions | Documentation Focus |\n|-----------|-----------------|---------------------|\n| **This visit** | Therapy intensification, lab orders, referrals, foot exam | Baseline complication status, medication changes, patient education |\n| **2 weeks (phone/portal)** | Empagliflozin tolerance check, home glucose review | Adherence, side effects, glucose trends |\n| **6 weeks** | In-person follow-up (already planned) | Fasting glucose, symptoms, wound healing, renal function, medication tolerance |\n| **3 months** | HbA1c recheck, ophthalmology report, UACR | Therapy response; decide on further intensification (GLP-1 RA if HbA1c still > 7%) |\n| **6 months** | Comprehensive reassessment | All complication screens, lipid panel, foot risk reclassification |\n| **Annually** | Full diabetes screening exam per ICD-11 **QA0A.10** | Retinal, renal, neuropathy, cardiovascular, dental, mental health screening |\n\nThe ICD-11 code **QA0A.10 — Special screening examination for diabetes mellitus** should be documented to support the systematic screening approach [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#44311883).\n\n---\n\n## 8. Documentation Checklist Summary\n\n> **Best Practice:** Every visit for worsening T2DM should include documentation of the following domains:\n\n- ☐ **Glycemic data:** HbA1c, fasting/postprandial glucose, glucose diary or CGM data\n- ☐ **Complication screening status:** Eyes, kidneys, nerves, feet, cardiovascular\n- ☐ **Medication reconciliation:** Current regimen, changes made, rationale, adverse effects\n- ☐ **Adherence assessment:** Medications, diet, exercise, self-monitoring\n- ☐ **Risk factor management:** BP, lipids, smoking status, weight/BMI\n- ☐ **Referrals placed:** Ophthalmology, podiatry, endocrinology, dietitian, mental health\n- ☐ **Patient education provided:** Foot care, hypoglycemia awareness, sick-day rules, OTC medication safety\n- ☐ **Social determinants:** Food security, financial barriers, mental health screening\n- ☐ **Follow-up plan:** Specific dates, labs to obtain, escalation criteria\n- ☐ **ICD-11 coding:** Accurate diagnostic codes reflecting current status and complications\n\n---\n\n## References\n\n1. \"From guidelines to practice: an Egyptian expert opinion on type 2 diabetes mellitus management in primary care settings.\" *BMC Prim Care*, 2025. [[EPMC]](https://europepmc.org/article/MED/41299307)\n\n2. \"Implementation of diabetic retinopathy screening in the Oslo region, Norway: a 3-year pilot study.\" *Front Med (Lausanne)*, 2025. [[EPMC]](https://europepmc.org/article/PMC/PMC12973592)\n\n3. \"Delphi Consensus on the Use of Fenofibrate as Systemic Therapy for the Prevention of Diabetic Retinopathy Progression.\" *J Diabetes*, 2026. [[EPMC]](https://europepmc.org/article/MED/41677041)\n\n4. \"Visual Outcomes and Complication Profiles of Phacoemulsification in Diabetic Versus Non-diabetic Patients.\" *Cureus*, 2026. [[EPMC]](https://europepmc.org/article/MED/41717158)\n\n5. \"Sleep apnea and diabetes.\" *Chin Med J (Engl)*, 2025. [[EPMC]](https://europepmc.org/article/MED/41342166)\n\n6. \"Type 5 diabetes mellitus: redefining pancreatogenic diabetes through molecular, imaging, and AI-driven evidence.\" *Front Endocrinol (Lausanne)*, 2025. [[EPMC]](https://europepmc.org/article/MED/41675641)\n\n7. \"Approach to the Patient With Pancreatogenic Diabetes.\" *J Clin Endocrinol Metab*, 2026. [[EPMC]](https://europepmc.org/article/MED/41252284)\n\n8. \"Altered coagulation and platelet indices in Yemeni patients with type 2 diabetes mellitus.\" *PLOS Glob Public Health*, 2026. [[EPMC]](https://europepmc.org/article/MED/41563951)\n\n9. ICD-11: 5A24/5A11 — Uncontrolled or unstable diabetes mellitus [Type 2 diabetes mellitus]. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#119724091)\n\n10. ICD-11: QA0A.10 — Special screening examination for diabetes mellitus. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#44311883)\n\n11. OpenFDA: Drug adverse events — worsening glycemic control. [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:type%202%20diabetes%20worsening%20glycemic%20control)\n\n12. \"Continuous Glucose Monitoring for Outpatient Diabetes Management After Hospital Discharge.\" NCT06852950. [[TRIALS]](https://clinicaltrials.gov/study/NCT06852950)\n\n13. \"Effects of Sleep Hygiene Education and Progressive Relaxation Exercise on Anxiety, Sleep Quality and Glycemic Control in Diabetic Patients.\" NCT06960408. [[TRIALS]](https://clinicaltrials.gov/study/NCT06960408)\n\n14. \"Evaluating the Effectiveness of a Multi-level Health-Related Social Needs Initiative.\" NCT06831162. [[TRIALS]](https://clinicaltrials.gov/study/NCT06831162)\n\n15. DailyMed: Safetussin High Blood Pressure and Diabetes Cough, Cold and Flu. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=279e309c-040d-4001-808d-b7d986a9a1d8)\n\n16. DailyMed: Vicks DayQuil for People with Diabetes. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=16272e93-0062-935a-e063-6294a90a0dda)\n\n17. DailyMed: Acid Controller Original Strength (Famotidine). [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=98c6ddc9-8103-40b3-a145-ffbe3374ab6c)",
          "citations": [
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#119724091"
            },
            {
              "source": "clinical_trials",
              "title": "TRIALS",
              "url": "https://clinicaltrials.gov/study/NCT06852950"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41299307"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/PMC/PMC12973592"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41677041"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41717158"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41342166"
            },
            {
              "source": "clinical_trials",
              "title": "TRIALS",
              "url": "https://clinicaltrials.gov/study/NCT06960408"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41675641"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41252284"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41563951"
            },
            {
              "source": "clinical_trials",
              "title": "TRIALS",
              "url": "https://clinicaltrials.gov/study/NCT06831162"
            },
            {
              "source": "openfda",
              "title": "FDA",
              "url": "https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:type%202%20diabetes%20worsening%20glycemic%20control"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=279e309c-040d-4001-808d-b7d986a9a1d8"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=16272e93-0062-935a-e063-6294a90a0dda"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=98c6ddc9-8103-40b3-a145-ffbe3374ab6c"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#44311883"
            }
          ],
          "metadata": {
            "modelId": "claude-opus-4-6",
            "promptFamily": "research",
            "generatedAt": "2026-03-12T12:54:26.036Z"
          }
        }
      ],
      "record": {
        "date": "2026-03-04T13:30:00.000Z",
        "patientName": "Angela Brooks",
        "chiefComplaint": "Sugar numbers are still all over the place",
        "hpiText": "Patient with known type 2 diabetes returns for follow-up 3 months after last visit. Reports poor glycemic control despite adherence to metformin 500 mg BID (occasional missed doses), with home fasting glucose 160-190 mg/dL and postprandial up to 250-270 mg/dL especially after dinner. Symptoms include fatigue, sluggishness when hyperglycemic, polydipsia, polyuria with nocturia. Diet includes toast with butter and coffee with 2 spoonfuls sugar for breakfast, variable lunch often fast food/sandwich, dinner with white rice, meat, vegetables, and desserts like cookies/ice cream. Minimal exercise due to desk job. New symptoms: bilateral toe tingling x couple months (worse at night), recent small foot cut with delayed healing 2-3 weeks, intermittent blurry vision. No hypoglycemia.",
        "medications": "Metformin 500 mg twice daily (titrate to 750 mg BID x 2 weeks, then 1000 mg BID)\nEmpagliflozin (Jardiance) - dose not specified, new prescription",
        "rosText": "Neurological: bilateral toe tingling especially at night. Eyes: blurry vision on and off. Genitourinary: polyuria with nocturia. Constitutional: fatigue, sluggishness with hyperglycemia. No hypoglycemia symptoms.",
        "pmh": "Type 2 diabetes mellitus. No other history discussed.",
        "socialHistory": "Desk job. Minimal physical activity. Lives with wife who cooks meals.",
        "familyHistory": "[Not discussed]",
        "vitals": {
          "bp": "[Not discussed]",
          "hr": "[Not discussed]",
          "temp": "[Not discussed]",
          "rr": "[Not discussed]",
          "spo2": "[Not discussed]"
        },
        "physicalExam": "Feet: decreased monofilament sensation at a couple points on right foot, consistent with early peripheral neuropathy.",
        "labsStudies": "Fasting glucose 180 mg/dL\nHbA1c 8.2% (previously 7.6%)\nCreatinine normal\nUrine microalbumin slightly elevated\nLipid panel (ordered)\nOphthalmology referral for dilated eye exam",
        "assessment": "1. 1. Worsening type 2 diabetes mellitus, poorly controlled (HbA1c 8.2%, fasting glucose 180 mg/dL, postprandial hyperglycemia to 270 mg/dL)\n2. 2. Early peripheral neuropathy (toe tingling, reduced foot sensation, delayed wound healing)\n3. 3. Early diabetic nephropathy (elevated urine microalbumin)\n4. 4. Possible diabetic retinopathy (blurry vision)\n5. 5. Poor diet and inactivity contributing to glycemic control",
        "plan": "1. Type 2 DM: Increase metformin to 750 mg BID x 2 weeks then 1000 mg BID with food; add empagliflozin (Jardiance); monitor fasting and 2-hour postprandial glucose daily and log; repeat fasting glucose in 6 weeks, HbA1c in 3 months. Diet: reduce white rice portions, eliminate after-dinner sweets, switch to brown rice/cauliflower rice, reduce coffee sugar, prefer fresh fruit/water. Exercise: 15-min walk after dinner, increase to 30 min moderate activity most days. 2. Neuropathy/Foot care: daily foot inspections, proper shoes, no barefoot walking. 3. Nephropathy: empagliflozin for renoprotection, hydration. 4. Retinopathy: ophthalmology referral for dilated exam. 5. Lipid panel ordered. Follow-up in 6 weeks.",
        "metadata": {
          "modelId": "grok-4-1-fast-non-reasoning",
          "promptFamily": "record",
          "generatedAt": "2026-03-12T12:51:50.705Z"
        }
      },
      "patientHandout": {
        "language": "en",
        "conditions": [
          {
            "id": "diabetes:5A11",
            "icdCode": "5A11",
            "diseaseName": "Type 2 diabetes mellitus, poorly controlled",
            "source": "ddx"
          }
        ],
        "entries": [
          {
            "conditionId": "diabetes:5A11",
            "sections": {
              "conditionOverview": "Type 2 diabetes mellitus, poorly controlled, means your body has trouble using insulin properly, leading to high blood sugar levels that aren't well managed. This can cause symptoms and increase risks for health problems. In your case, blood tests show high average sugar (HbA1c 8.2%) and fasting/post-meal levels above target, but with lifestyle and medicine changes, it can be better controlled.",
              "signsSymptoms": "Common signs include feeling very thirsty, urinating a lot (especially at night), feeling tired or sluggish, blurry vision, and high tiredness when sugars are elevated. You mentioned no low sugar episodes, which is good.",
              "causesRiskFactors": "Main causes are high-sugar and high-carb diets (like white rice every meal, sugary coffee, desserts), lack of regular exercise, and needing stronger medicine. Desk job and big dinners contribute. Long-term high sugars damage nerves, eyes, and kidneys.",
              "complications": "Early issues seen include nerve tingling in toes (neuropathy), slower-healing cuts on feet, blurry vision (possible eye damage), and slightly high protein in urine (early kidney changes). These can worsen without control but may improve with better management.",
              "treatmentOptions": "Your doctor increased metformin (to 1000 mg twice daily, start slow with food to avoid stomach upset) and added empagliflozin (Jardiance), which helps kidneys remove extra sugar in urine and protects heart/kidneys. Check sugars fasting and 2 hours after main meal; log them. Diet: cut white rice/sweets, try brown rice, less sugar in coffee, fresh fruit instead of ice cream. Exercise: 15-30 min walk after dinner.",
              "whenToSeekHelp": "Seek help right away if very sick, nauseated, trouble breathing (rare medicine risk), signs of low sugar (shaky, sweaty, faint), foot cuts/sores that don't heal, worsening vision, or blood sugars over 250 after meals or under 70.",
              "additionalAdviceFollowUp": "Inspect feet daily for cuts/blisters (you have less feeling), wear well-fitting shoes, never go barefoot. Drink water, stay hydrated to avoid urine infections from new medicine. Walk evenings with family. Follow-up in 6 weeks for sugars/meds, eye exam soon, cholesterol check. Small consistent changes matter.",
              "disclaimer": "This is general educational information based on your visit, not a personal diagnosis or treatment plan. Always follow your doctor's specific instructions. This is not a substitute for professional medical advice, emergency care, or your prescribed care plan. Contact your doctor for any concerns."
            }
          }
        ],
        "generatedAt": "2026-03-12T12:51:59.499Z",
        "metadata": {
          "modelId": "grok-4-1-fast-non-reasoning",
          "promptFamily": "patient-handout",
          "generatedAt": "2026-03-12T12:51:59.499Z"
        }
      },
      "documents": [
        {
          "templateId": "after-visit-summary",
          "title": null,
          "contentJson": {
            "type": "doc",
            "content": [
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Visit snapshot"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Visit reason"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Follow-up for type 2 diabetes with poor glycemic control (HbA1c 8.2%, fasting glucose 180 mg/dL, postprandial spikes to 270 mg/dL), early peripheral neuropathy, blurry vision, and elevated microalbuminuria"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Today's impression"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Worsening type 2 diabetes mellitus poorly controlled with early complications including peripheral neuropathy, possible retinopathy, and microalbuminuria. Tolerating metformin with mild GI effects. Diet high in glycemic load, low exercise."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Diagnosis codes"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "5A11"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Medication and orders"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Medication changes"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Increase metformin: start 750 mg twice daily for 2 weeks, then 1000 mg twice daily with food"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Add empagliflozin (Jardiance): follow prescribed dosing; stay hydrated to reduce UTI/yeast infection risk"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Tests or procedures ordered"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Lipid panel"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Repeat fasting glucose in 6 weeks"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Repeat HbA1c in 3 months"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Referrals ordered"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Ophthalmology for dilated eye exam (assess for diabetic retinopathy)"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Follow-up and safety"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Scheduled follow-up date"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "6 weeks"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Follow-up plan"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Return in 6 weeks to review blood sugar log, medication tolerance, and labs"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Return precautions"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Seek immediate care if very sick, nauseated, difficulty breathing (possible diabetic ketoacidosis from empagliflozin)"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Return sooner if severe GI upset from metformin, low blood sugar symptoms (shakiness, sweating, faintness), foot sores/cuts, or worsening vision/tingling"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Patient action items"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Check blood sugar: fasting daily + 2 hours after biggest meal; log and bring to visit"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Diet: reduce white rice/sweets/sugary drinks; try brown rice, fresh fruit instead of desserts"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Exercise: 15-min walk after dinner, increase to 30 min most days"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Foot care: daily inspection for cuts/blisters, wear proper shoes, no barefoot walking"
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          "generationInputs": {
            "clinicalContextMode": null,
            "confirmedDiagnoses": [
              {
                "id": "diabetes:5A11",
                "icdCode": "5A11",
                "diseaseName": "Type 2 diabetes mellitus, poorly controlled",
                "source": "ddx"
              }
            ]
          },
          "metadata": {
            "modelId": "grok-4-1-fast-non-reasoning",
            "promptFamily": "document",
            "generatedAt": "2026-03-12T12:55:52.288Z"
          }
        },
        {
          "templateId": "referral-request-letter",
          "title": null,
          "contentJson": {
            "type": "doc",
            "content": [
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Referral request header"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Referring clinician"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Primary Care Provider"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Receiving clinician or service"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Ophthalmology"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Urgency"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Routine"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Referral question"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Assess for diabetic retinopathy given blurry vision and type 2 diabetes with poor glycemic control (HbA1c 8.2%)"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Clinical summary"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Reason for referral"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Dilated eye exam to evaluate for diabetic retinopathy in patient with worsening type 2 diabetes, blurry vision, and early complications including neuropathy and microalbuminuria."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Diagnosis codes"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "5A11"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Pertinent history and findings"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Type 2 diabetes poorly controlled (HbA1c 8.2% up from 7.6%, fasting glucose 180 mg/dL, postprandial up to 270 mg/dL). Symptoms: polydipsia, polyuria, fatigue, blurry vision, bilateral toe tingling. Exam: reduced monofilament sensation right foot consistent with early peripheral neuropathy, delayed foot wound healing. Labs: elevated urine microalbumin, normal creatinine."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Workup completed"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Recent HbA1c 8.2%"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Fasting glucose 180 mg/dL"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Urine microalbumin (elevated)"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Monofilament foot exam"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Current medications and allergies"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Metformin 500 mg BID (titrating to 1000 mg BID), starting empagliflozin (Jardiance). No allergies reported. Mild GI tolerance to metformin."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Requested actions and attachments"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Requested evaluation or service"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Dilated fundus exam to screen for diabetic retinopathy and other ocular complications. Provide recommendations for management."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Target appointment window"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Within 1 month"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Attachments to send"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Recent labs (HbA1c, glucose, microalbumin)"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Clinical notes"
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          "generationInputs": {
            "clinicalContextMode": null,
            "confirmedDiagnoses": [
              {
                "id": "diabetes:5A11",
                "icdCode": "5A11",
                "diseaseName": "Type 2 diabetes mellitus, poorly controlled",
                "source": "ddx"
              }
            ]
          },
          "metadata": {
            "modelId": "grok-4-1-fast-non-reasoning",
            "promptFamily": "document",
            "generatedAt": "2026-03-12T12:55:52.290Z"
          }
        },
        {
          "templateId": "longitudinal-care-plan",
          "title": null,
          "contentJson": {
            "type": "doc",
            "content": [
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Care plan overview"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Primary condition focus"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Type 2 diabetes mellitus, poorly controlled"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Active problems"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Early peripheral neuropathy"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Diabetic kidney disease (microalbuminuria)"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Postprandial hyperglycemia"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Delayed wound healing"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Health concerns"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Blurry vision (possible retinopathy)"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "High glycemic load diet"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Sedentary lifestyle"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Polydipsia, polyuria, fatigue"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Goals and interventions"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Care goals"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Item 1"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Goal"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Improve glycemic control (target HbA1c <7%, fasting glucose <130 mg/dL, postprandial <180 mg/dL)"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Interventions"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Titrate metformin to 1000 mg BID (start 750 mg BID x 2 weeks)"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Add empagliflozin (Jardiance) for glycemic control and renoprotection"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Reduce high glycemic foods (white rice, sweets, sugary coffee)"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "15-30 min post-dinner walk most days"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring metric"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Fasting and 2-hour postprandial blood glucose logs; HbA1c"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Target timeframe"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "3 months"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Item 2"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Goal"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Prevent progression of peripheral neuropathy and foot complications"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Interventions"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Daily foot inspection for cuts/sores"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Wear proper fitting shoes, avoid barefoot walking"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Optimize glycemic control"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring metric"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Foot sensation (monofilament testing), wound healing"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Target timeframe"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Ongoing, assess at each visit"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Item 3"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Goal"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Protect kidney function and screen for retinopathy"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Interventions"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Ophthalmology referral for dilated eye exam"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Monitor microalbuminuria; lipid panel"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Empagliflozin for renoprotection"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring metric"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Urine microalbumin, serum creatinine, eye exam results"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Target timeframe"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Within 1 month for eye exam; 3 months for labs"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring and escalation"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring plan"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Daily fasting and 2-hour post-meal blood glucose logging"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Weekly foot inspections and symptom reporting"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Monthly weight and blood pressure checks"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Expected outcomes"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Stabilized HbA1c ≤7.5% at 3 months, resolution of hyperglycemia symptoms, no new foot injuries, normal eye/kidney screening"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Escalation criteria"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Blood glucose >300 mg/dL or <70 mg/dL with symptoms"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Signs of diabetic ketoacidosis (nausea, vomiting, dyspnea)"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "New or non-healing foot wounds/ulcers"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Worsening neuropathy symptoms (numbness, pain)"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Patient or caregiver responsibilities"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Adhere to medication titration and report GI/UTI symptoms"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Log blood sugars and bring to visits"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Implement diet/exercise changes; daily foot care"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Next review date"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "6 weeks"
                  }
                ]
              }
            ]
          },
          "generationInputs": {
            "clinicalContextMode": null,
            "confirmedDiagnoses": [
              {
                "id": "diabetes:5A11",
                "icdCode": "5A11",
                "diseaseName": "Type 2 diabetes mellitus, poorly controlled",
                "source": "ddx"
              }
            ]
          },
          "metadata": {
            "modelId": "grok-4-1-fast-non-reasoning",
            "promptFamily": "document",
            "generatedAt": "2026-03-12T12:55:52.292Z"
          }
        }
      ]
    },
    {
      "key": "low-back-pain",
      "scenarioId": "low-back-pain",
      "sessionTitle": "Example · Acute Low Back Pain",
      "patientName": "Jason Miller",
      "startedAt": "2026-03-03T08:15:00.000Z",
      "insights": {
        "summary": "Patient presents with acute lower back pain after lifting a heavy box with twisting at work two days ago. Exam reveals right paraspinal muscle spasm at L4-L5, reduced flexion, negative straight leg raise, and normal neurological exam, confirming lumbar muscle strain without radiculopathy or red flags. Treatment plan includes naproxen, cyclobenzaprine, ice/heat, activity as tolerated, PT referral, work note, and 2-week follow-up.",
        "keyFindings": [
          "Sudden onset sharp pain in right lower back (L4-L5) after lifting 50-60 lb box with twist",
          "Pain: ache 4-5/10 at rest, 8-9/10 with movement; no radiation below knee, mild right buttock soreness",
          "Significant right paraspinal muscle spasm, 30% flexion, negative SLR, normal neuro exam (strength, sensation, reflexes)",
          "No red flags: no saddle numbness, bowel/bladder changes, weakness, fever, cancer history",
          "Prescribed naproxen 500mg BID, cyclobenzaprine 5mg QHS, PT referral, modified work duty"
        ],
        "redFlags": [],
        "diagnosticKeywords": [
          {
            "phrase": "threw my back out",
            "category": "symptom"
          },
          {
            "phrase": "sharp pain",
            "category": "symptom"
          },
          {
            "phrase": "lower back",
            "category": "symptom"
          },
          {
            "phrase": "right side",
            "category": "symptom"
          },
          {
            "phrase": "muscle spasm",
            "category": "finding"
          },
          {
            "phrase": "deep ache",
            "category": "symptom"
          },
          {
            "phrase": "tightness",
            "category": "symptom"
          },
          {
            "phrase": "pain 8 or 9",
            "category": "symptom"
          },
          {
            "phrase": "soreness in right buttock",
            "category": "symptom"
          },
          {
            "phrase": "bending forward",
            "category": "symptom"
          },
          {
            "phrase": "Advil",
            "category": "medication"
          },
          {
            "phrase": "no numbness",
            "category": "finding"
          },
          {
            "phrase": "no weakness",
            "category": "finding"
          },
          {
            "phrase": "no fever",
            "category": "finding"
          },
          {
            "phrase": "antalgic posture",
            "category": "finding"
          },
          {
            "phrase": "blood pressure 126/78",
            "category": "vital"
          },
          {
            "phrase": "heart rate 72",
            "category": "vital"
          },
          {
            "phrase": "temperature 98.4",
            "category": "vital"
          },
          {
            "phrase": "right paraspinal muscles",
            "category": "finding"
          },
          {
            "phrase": "L4 to L5 level",
            "category": "finding"
          },
          {
            "phrase": "30% normal flexion",
            "category": "finding"
          },
          {
            "phrase": "straight leg raise negative",
            "category": "finding"
          },
          {
            "phrase": "strength 5/5",
            "category": "finding"
          },
          {
            "phrase": "sensation intact",
            "category": "finding"
          },
          {
            "phrase": "reflexes normal",
            "category": "finding"
          },
          {
            "phrase": "acute lumbar muscle strain",
            "category": "diagnosis"
          },
          {
            "phrase": "naproxen 500 mg",
            "category": "medication"
          },
          {
            "phrase": "cyclobenzaprine 5 mg",
            "category": "medication"
          },
          {
            "phrase": "NSAIDs",
            "category": "medication"
          }
        ],
        "checklistItems": [
          {
            "label": "Obtain detailed history of injury mechanism and pain characteristics",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Assess pain location, severity, aggravating/alleviating factors, radiation",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Screen for red flag symptoms (cauda equina, infection, malignancy, fracture)",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Perform physical exam: palpation, ROM, straight leg raise, neurological testing",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Check vital signs",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Formulate diagnosis and explain to patient",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Prescribe naproxen 500mg twice daily with food for 10-14 days",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Prescribe cyclobenzaprine 5mg at bedtime for 1 week",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Counsel on ice/heat therapy, activity modification, avoid bed rest",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Refer to physical therapy within 1 week for spasm release, core strengthening, body mechanics",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Provide work note for modified duty (no lifting >10lbs, no bending/twisting x2 weeks)",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Educate on red flags warranting ER visit or early return",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Schedule 2-week follow-up to assess progress",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          },
          {
            "label": "Counsel on prevention: proper lifting technique, ergonomics, core exercises, walking",
            "isChecked": true,
            "isAutoChecked": true,
            "doctorNote": null,
            "source": "AI"
          }
        ],
        "metadata": {
          "modelId": "grok-4-1-fast-non-reasoning",
          "promptFamily": "insights",
          "generatedAt": "2026-03-12T12:55:57.826Z"
        }
      },
      "diagnoses": [
        {
          "icdCode": "ME84.2Y",
          "diseaseName": "Acute lumbar muscle strain (Other specified low back pain)",
          "confidence": "high",
          "evidence": "Patient reports sudden onset sharp pain in right lower back at L4-L5 level after lifting a 50-60 lb box with a twisting motion two days ago. Examination reveals significant right paraspinal muscle spasm, reduced flexion to 30%, negative straight leg raise, and normal neurological exam. No red flags identified. Mechanism of injury (heavy lifting with twist), localized paraspinal spasm, and absence of radiculopathy are classic for acute lumbar muscle strain.",
          "citations": [
            {
              "source": "icd11",
              "title": "ME84.2Y - Other specified low back pain",
              "url": "https://icd.who.int/browse/2024-01/mms/en#other"
            },
            {
              "source": "icd11",
              "title": "MB47.3 - Cramp or spasm",
              "url": "https://icd.who.int/browse/2024-01/mms/en#157838476"
            },
            {
              "source": "europe_pmc",
              "title": "Abstracts from the 2024 Annual Meeting of the Society of General Internal Medicine",
              "url": "https://europepmc.org/article/PMC/PMC11231130",
              "snippet": "General internal medicine research including management of acute musculoskeletal conditions and low back pain"
            },
            {
              "source": "europe_pmc",
              "title": "Abstracts from the 2022 Annual Meeting of the Society of General Internal Medicine",
              "url": "https://europepmc.org/article/PMC/PMC9205280",
              "snippet": "Research abstracts covering primary care management of musculoskeletal complaints including low back pain"
            },
            {
              "source": "openfda",
              "title": "Drug adverse event reports — Top reactions: MUSCLE SPASMS, FATIGUE, PAIN, NAUSEA, DRUG INEFFECTIVE",
              "url": "https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:acute%20lumbar%20muscle%20strain%20L4-L5%20lifting"
            },
            {
              "source": "dailymed",
              "title": "NAPROXEN BACK AND MUSCLE PAIN (NAPROXEN SODIUM) TABLET, FILM COATED [L.N.K. INTERNATIONAL, INC.]",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=68944663-0dc0-4d3a-a36b-019061bdbfa0"
            },
            {
              "source": "dailymed",
              "title": "LUMBAR DROPS 5013 (LUMBAR DROPS) LIQUID [PROFESSIONAL COMPLEMENTARY HEALTH FORMULAS]",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=ee6b54ea-fb6a-4723-8a0f-970aa82fea80"
            }
          ]
        },
        {
          "icdCode": "ME84.2Z",
          "diseaseName": "Low back pain, unspecified (mechanical)",
          "confidence": "moderate",
          "evidence": "Acute onset low back pain following occupational lifting injury with pain rated 4-5/10 at rest and 8-9/10 with movement. While clinical presentation is most consistent with muscular strain, mechanical low back pain from facet joint irritation or ligamentous injury at L4-L5 remains a consideration given the twisting mechanism and localized tenderness. Negative SLR and normal neurological exam support a non-neurogenic mechanical etiology.",
          "citations": [
            {
              "source": "icd11",
              "title": "ME84.2Z - Low back pain, unspecified",
              "url": "https://icd.who.int/browse/2024-01/mms/en#unspecified"
            },
            {
              "source": "europe_pmc",
              "title": "Abstracts from the 2019 Annual Meeting of the Society of General Internal Medicine.",
              "url": "https://europepmc.org/article/MED/31090026",
              "snippet": "Research on low back pain classification and management in general internal medicine practice"
            },
            {
              "source": "europe_pmc",
              "title": "SCIENTIFIC ABSTRACTS",
              "url": "https://europepmc.org/article/PMC/PMC5913041",
              "snippet": "General internal medicine abstracts including musculoskeletal pain management approaches"
            },
            {
              "source": "dailymed",
              "title": "MUGWORT PATCH (LUMBAR SPINE USE) (2%MENTHOL) PATCH [YIYANGYUAN LIFE SCIENCES (HONG KONG) CO., LIMITED]",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=478e4b21-6d81-4cd3-e063-6394a90a18fe"
            }
          ]
        },
        {
          "icdCode": "8B93.Y",
          "diseaseName": "Lumbar radiculopathy (L4-L5 disc herniation)",
          "confidence": "low",
          "evidence": "Although currently ruled out by negative straight leg raise, normal strength, intact sensation, and preserved reflexes, the mechanism of injury (heavy lifting with twist) and mild right buttock soreness raise the possibility of early or developing L4-L5 disc herniation with radiculopathy. This diagnosis should be reconsidered if symptoms progress, pain radiates below the knee, or neurological deficits develop at the 2-week follow-up.",
          "citations": [
            {
              "source": "icd11",
              "title": "8B93.Y - Other specified radiculopathy",
              "url": "https://icd.who.int/browse/2024-01/mms/en#other"
            },
            {
              "source": "icd11",
              "title": "8B93.Z - Radiculopathy, unspecified",
              "url": "https://icd.who.int/browse/2024-01/mms/en#unspecified"
            },
            {
              "source": "europe_pmc",
              "title": "Abstracts from the 2016 Society of General Internal Medicine Annual Meeting.",
              "url": "https://europepmc.org/article/MED/27114361",
              "snippet": "Research abstracts covering diagnostic evaluation of low back pain and radiculopathy"
            },
            {
              "source": "europe_pmc",
              "title": "Abstracts from the 37th Annual Meeting of the Society of General Internal Medicine, 2014, San Diego, CA, USA.",
              "url": "https://europepmc.org/article/MED/24737224",
              "snippet": "General internal medicine research including lumbar spine pathology evaluation"
            }
          ]
        }
      ],
      "research": [
        {
          "question": "What red flags require urgent escalation when evaluating acute low back pain in clinic?",
          "answer": "## Red Flags Requiring Urgent Escalation in Acute Low Back Pain\n\nYour current patient has been appropriately assessed and shows **no red flags**, with a clear mechanical mechanism and normal neurological examination. However, a systematic understanding of red flag indicators is essential for every low back pain evaluation. Below is a comprehensive review of the warning signs that should prompt urgent workup or immediate referral.\n\n---\n\n## Cauda Equina Syndrome (CES) — Surgical Emergency\n\n**Cauda equina syndrome** is the most time-critical diagnosis to exclude. It is classified under ICD-11 as a distinct neurological emergency requiring decompression, ideally within **48 hours** of symptom onset to preserve function. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1490265028)\n\nKey features demanding **immediate** escalation:\n\n- **Saddle anesthesia** — numbness or altered sensation in the perineal/perianal region\n- **Bladder dysfunction** — urinary retention, incontinence, or loss of awareness of bladder fullness\n- **Bowel dysfunction** — fecal incontinence or loss of anal sphincter tone\n- **Progressive bilateral lower extremity weakness or numbness**\n- **Sexual dysfunction** of acute onset\n\nTraumatic injury to the cauda equina (ICD-11: NB72) should also be considered in high-energy mechanisms. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#83569782)\n\n> **Clinical Pearl:** Always ask directly about saddle numbness and bladder/bowel changes — patients may not volunteer these symptoms due to embarrassment.\n\n---\n\n## Comprehensive Red Flag Categories\n\nA 2025 comprehensive review of clinical practice guidelines identified standardized red flags across musculoskeletal care, emphasizing that red flags should be assessed systematically in every patient presenting with back pain. [[EPMC]](https://europepmc.org/article/MED/40572690)\n\n### Malignancy\n\n| Red Flag Finding | Clinical Significance |\n|---|---|\n| **History of cancer** (especially breast, lung, prostate, renal, thyroid) | Spinal metastasis risk |\n| **Unexplained weight loss** (>10 lbs / 4.5 kg over 6 months) | Systemic malignancy |\n| **Age >50 with new-onset back pain** and no improvement after 4–6 weeks | Higher pre-test probability |\n| **Pain worse at night / rest**, unrelieved by position change | Suggests non-mechanical etiology |\n| **Failure to improve** with conservative therapy over 4–6 weeks | Warrants imaging |\n\nSpinal cord neoplasms, whether primary or benign, can present insidiously with progressive back pain and neurological deficits. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#783234001) [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1588169218)\n\n### Spinal Infection (Discitis, Osteomyelitis, Epidural Abscess)\n\n- **Fever** (temperature ≥38.0°C / 100.4°F) with back pain\n- **Recent bacteremia**, UTI, skin infection, or endocarditis\n- **IV drug use**\n- **Immunosuppression** (HIV, chronic corticosteroids, diabetes, transplant recipients)\n- **Recent spinal procedure** or injection\n- **Unrelenting pain** not improved with rest\n\n### Fracture\n\n- **Significant trauma** (fall from height, motor vehicle accident) — or **minor trauma in the elderly**\n- **Prolonged corticosteroid use** (e.g., prednisone >5 mg/day for ≥3 months)\n- **Known osteoporosis** or history of fragility fracture\n- **Age >70** with new acute back pain\n- **Point tenderness over spinous process** on palpation\n\n### Vascular Emergency — Abdominal Aortic Aneurysm (AAA)\n\nExtravertebral causes of low back pain, including vascular emergencies, must be considered in the differential. [[EPMC]](https://europepmc.org/article/MED/38714994)\n\n- **Age >60** with acute-onset tearing or pulsating back/abdominal pain\n- **Hypotension or hemodynamic instability**\n- **Pulsatile abdominal mass**\n- **Known AAA history** or significant atherosclerotic risk factors\n- **Pain disproportionate** to examination findings\n\n---\n\n## Progressive Neurological Deficit (Non-CES)\n\nEven without full cauda equina syndrome, the following warrant **urgent evaluation**:\n\n- **Progressive motor weakness** (e.g., foot drop, inability to heel/toe walk)\n- **Rapidly worsening radiculopathy** despite treatment\n- **Multilevel neurological signs** suggesting myelopathy or conus medullaris syndrome\n- **Gait instability** of new onset\n\nInternational guidelines for low back pain diagnosis consistently recommend that progressive neurological deficits should trigger urgent advanced imaging (MRI) and specialist referral. [[EPMC]](https://europepmc.org/article/MED/36836220)\n\n---\n\n## Systematic Red Flag Screening Checklist\n\nModels of care for non-specific low back pain emphasize that structured triage using red flag screening is a foundational step in all evidence-based care pathways. [[EPMC]](https://europepmc.org/article/MED/40052535)\n\n| Category | Key Questions to Ask |\n|---|---|\n| **CES** | Saddle numbness? Bladder retention/incontinence? Bowel incontinence? |\n| **Malignancy** | Cancer history? Weight loss? Night pain? Age >50 with no improvement? |\n| **Infection** | Fever? IVDU? Immunosuppression? Recent procedure? |\n| **Fracture** | Trauma? Steroid use? Osteoporosis? Age >70? |\n| **Vascular** | Age >60? Tearing pain? Hemodynamic instability? |\n| **Neurological** | Progressive weakness? Gait change? Bilateral symptoms? |\n\n---\n\n## Relevance to Your Current Patient\n\nYour patient's evaluation appropriately ruled out all major red flag categories:\n\n- **No saddle anesthesia, bowel/bladder changes** → CES excluded clinically\n- **No fever, immunosuppression, or IVDU** → Infection unlikely\n- **Clear mechanical mechanism** (lifting with twist) with **no cancer history or weight loss** → Malignancy not suspected\n- **Normal neurological exam** (strength, sensation, reflexes intact; negative SLR) → No progressive deficit\n- **Age and mechanism** do not suggest pathological fracture\n\nThe diagnosis of **low back pain** (ICD-11: ME84.2Z) with mechanical strain is well-supported. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#unspecified)\n\n### Counseling Point for Follow-Up\n\nAdvise the patient to **seek immediate care** before the 2-week follow-up if any of the following develop:\n\n- New numbness in the groin or \"saddle\" area\n- Loss of bladder or bowel control\n- Progressive leg weakness or difficulty walking\n- Fever or chills\n- Pain that becomes severe and unremitting, especially at night\n\nRegarding the prescribed medications, **naproxen** and other NSAIDs are among the most commonly reported drugs in adverse event databases, with pain and gastrointestinal symptoms being frequent reports. Standard GI precautions and monitoring are appropriate. [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:acute%20low%20back%20pain%20red%20flags)\n\nTopical analgesics (e.g., lidocaine patches) may serve as adjunctive options if oral medications are poorly tolerated. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca35030-958c-8f62-e063-6294a90a4d63)\n\n---\n\n## References\n\n1. \"Standardized Definition of Red Flags in Musculoskeletal Care: A Comprehensive Review of Clinical Practice Guidelines.\" *Medicina (Kaunas)*, 2025. [[EPMC]](https://europepmc.org/article/MED/40572690)\n\n2. \"Models of care for managing non-specific low back pain.\" *Cochrane Database Syst Rev*, 2025. [[EPMC]](https://europepmc.org/article/MED/40052535)\n\n3. \"Extravertebral low back pain: a scoping review.\" *BMC Musculoskelet Disord*, 2024. [[EPMC]](https://europepmc.org/article/MED/38714994)\n\n4. \"Chronic Low Back Pain: A Narrative Review of Recent International Guidelines for Diagnosis and Conservative Treatment.\" *J Clin Med*, 2023. [[EPMC]](https://europepmc.org/article/MED/36836220)\n\n5. ICD-11: Cauda equina syndrome (8B40). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1490265028)\n\n6. ICD-11: Injury of cauda equina (NB72). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#83569782)\n\n7. ICD-11: Primary neoplasm of spinal cord (2A02.2). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#783234001)\n\n8. ICD-11: Benign neoplasm of spinal cord (2A02.4). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1588169218)\n\n9. ICD-11: Low back pain, unspecified (ME84.2Z). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#unspecified)\n\n10. OpenFDA Drug Adverse Events. [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:acute%20low%20back%20pain%20red%20flags)\n\n11. DailyMed: Rapid Relief Lidocaine 4% Patch. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca35030-958c-8f62-e063-6294a90a4d63)",
          "citations": [
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#1490265028"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#83569782"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/40572690"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#783234001"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#1588169218"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/38714994"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/36836220"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/40052535"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#unspecified"
            },
            {
              "source": "openfda",
              "title": "FDA",
              "url": "https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:acute%20low%20back%20pain%20red%20flags"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca35030-958c-8f62-e063-6294a90a4d63"
            }
          ],
          "metadata": {
            "modelId": "claude-opus-4-6",
            "promptFamily": "research",
            "generatedAt": "2026-03-12T12:56:50.355Z"
          }
        },
        {
          "question": "What conservative treatment and activity guidance are best practice for uncomplicated acute mechanical low back pain?",
          "answer": "## Conservative Treatment and Activity Guidance for Uncomplicated Acute Mechanical Low Back Pain\n\nYour patient's presentation — acute lumbar muscle strain from a lifting/twisting mechanism with no red flags, no radiculopathy, and normal neurological exam — is the classic scenario for evidence-based conservative management. Your current treatment plan aligns well with best practice. Below is a comprehensive review to support and refine your approach.\n\n---\n\n## Diagnostic Classification\n\nThis patient's condition is appropriately classified under **ICD-11 ME84.2Z — Low back pain, unspecified**, which encompasses acute non-specific low back pain without identifiable structural pathology. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#unspecified)\n\nGiven the clear mechanical mechanism and acute timeline, the pain also fits within **ICD-11 MG31.Y — Other specified acute pain**, reinforcing that the management goal is symptom control and functional restoration during the expected self-limited course. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#other)\n\n> **Key Prognostic Point:** The majority of acute mechanical low back pain episodes improve significantly within **2–4 weeks**, with ~90% of patients recovering within **6 weeks**. However, recurrence rates are high (up to 33% within 1 year), making activity guidance and prevention education critical.\n\n---\n\n## Pharmacological Management\n\n### First-Line: NSAIDs\n\n**Naproxen 500 mg BID** is an excellent first-line choice and is strongly recommended by all major guidelines (ACP, ACS, NICE) for acute low back pain.\n\n| Parameter | Recommendation |\n|---|---|\n| **Drug** | **Naproxen** 500 mg |\n| **Frequency** | Twice daily with food |\n| **Duration** | 7–14 days (shortest effective course) |\n| **GI Protection** | Consider PPI if age >65, history of GI disease, or concurrent corticosteroids |\n| **Monitoring** | Renal function, GI symptoms, blood pressure |\n\nAdverse event data from the FDA database confirms that **pain**, **nausea**, and **fatigue** are among the most commonly reported reactions with analgesic medications used for musculoskeletal conditions, underscoring the importance of limiting NSAID duration. [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:acute%20mechanical%20low%20back%20pain%20conservative)\n\n### Second-Line Adjunct: Skeletal Muscle Relaxant\n\n**Cyclobenzaprine 5 mg QHS** is appropriately prescribed as a short-term adjunct.\n\n- **Best evidence** supports use for **7–14 days maximum**\n- Sedation is the primary side effect — QHS dosing (as you've prescribed) leverages this therapeutically for sleep disruption from pain\n- **Avoid** in elderly patients (Beers Criteria), those on serotonergic drugs, or patients with cardiac conduction abnormalities\n- Counsel patient about **drowsiness** and to avoid driving/operating machinery if affected\n\n### Topical Adjuncts\n\nFor patients who prefer to minimize systemic medications or need additional localized relief, topical options can be considered:\n\n- **Lidocaine 4% patches** applied to the affected paraspinal area can provide localized analgesic relief with minimal systemic absorption. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca35030-958c-8f62-e063-6294a90a4d63)\n\n- **Camphor/menthol-based topical patches** are available as OTC counterirritant options for back pain and may provide symptomatic relief through cutaneous stimulation. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca7d0ca-6407-1fed-e063-6394a90aaccc)\n\n- **Topical arnica-based preparations** are marketed for musculoskeletal pain, though evidence for efficacy is limited compared to NSAIDs. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4c923afa-4d1e-0776-e063-6294a90a2f54)\n\n### What to Avoid\n\n> **Guideline Consensus:** Opioids are **NOT recommended** for uncomplicated acute mechanical low back pain. Systemic corticosteroids have also shown no benefit and should not be prescribed.\n\n- **No opioids** — no evidence of superiority over NSAIDs; significant harm potential\n- **No systemic corticosteroids** — ineffective for non-radicular mechanical LBP\n- **No benzodiazepines** — risk of dependence without proven benefit over cyclobenzaprine\n\n---\n\n## Activity Guidance — The Most Important Intervention\n\n### Stay Active: The Core Message\n\nThis is arguably the **single most important recommendation** and the area where patient education has the greatest impact.\n\n| Outdated Advice | Current Best Practice |\n|---|---|\n| Bed rest for 1–2 weeks | **Avoid bed rest**; resume normal activities ASAP |\n| \"Rest until pain-free\" | **Stay active as tolerated**; some discomfort is expected and acceptable |\n| Avoid all bending/lifting | **Gradual return** to normal movement patterns |\n| Brace/corset for support | **Not recommended** for routine acute LBP |\n\n### Specific Activity Recommendations for Your Patient\n\n**Days 1–3 (Current Phase):**\n\n- **Relative rest**, not absolute rest — brief periods of lying down are acceptable but should not exceed 20–30 minutes at a time\n- **Gentle walking** — start with 10–15 minute walks, 2–3 times daily\n- **Avoid prolonged sitting** (>30 minutes without position change)\n- **Ice** for 15–20 minutes every 2–3 hours during the first 48–72 hours to reduce inflammation and spasm\n\n**Days 4–14:**\n\n- **Transition to heat** (heating pad, warm shower) for 15–20 minutes to promote blood flow and muscle relaxation\n- **Progressively increase walking** duration and pace\n- **Gentle stretching**: pelvic tilts, knee-to-chest stretches, cat-cow movements\n- **Avoid heavy lifting** (>15–20 lbs), repetitive bending, and twisting until seen at follow-up\n- **Resume light ADLs** — cooking, light housework, driving short distances if comfortable\n\n**Weeks 2–6:**\n\n- **Gradual return to full activity** guided by physical therapy\n- **Core stabilization exercises** introduced by PT\n- **Progressive loading** — incrementally increase lifting capacity under PT supervision\n\n### Work Modification\n\nYour decision to provide a **modified duty work note** is appropriate and evidence-based:\n\n- **Modified duty** is strongly preferred over complete work absence\n- Recommend: **no lifting >10–15 lbs**, ability to alternate sitting/standing, no repetitive bending/twisting\n- **Duration**: 1–2 weeks, reassess at follow-up\n- **Goal**: Return to full duty within 2–4 weeks with proper body mechanics training\n\n> Prolonged work absence (>4–6 weeks) is a strong predictor of chronic disability and should be actively avoided.\n\n---\n\n## Physical Therapy Referral\n\nYour PT referral is well-supported by evidence. Chiropractic and physical therapy approaches for acute low back pain emphasize active rehabilitation strategies over passive modalities. [[EPMC]](https://europepmc.org/article/MED/38426548)\n\n### Recommended PT Focus Areas\n\n1. **Pain-modulating modalities** (short-term): TENS, manual therapy, soft tissue mobilization\n2. **Motor control exercises**: Targeting transversus abdominis and multifidus activation\n3. **Progressive core stabilization**: Planks, bridges, bird-dogs\n4. **Flexibility training**: Hamstring stretching, hip flexor mobility, lumbar extension exercises\n5. **Body mechanics education**: Proper lifting technique (hip hinge), ergonomic workstation setup\n6. **Graded activity program**: Systematic return to occupational demands\n\n### PT Timing\n\n- **Ideal initiation**: Within the first **1–2 weeks** of symptom onset\n- Early PT engagement has been associated with reduced opioid use, fewer advanced imaging orders, and lower overall healthcare costs\n\n---\n\n## Ice vs. Heat Protocol\n\n| Modality | Timing | Application | Mechanism |\n|---|---|---|---|\n| **Ice/Cold** | First 48–72 hours | 15–20 min on / 40 min off, with barrier | Reduces inflammation, numbs acute pain, decreases spasm |\n| **Heat** | After 72 hours | 15–20 min, moist heat preferred | Increases blood flow, relaxes muscles, improves tissue extensibility |\n| **Alternating** | After day 3–5 | Ice after activity, heat before stretching | Combines anti-inflammatory and relaxation benefits |\n\n> Always use a cloth barrier between ice/heat source and skin to prevent thermal injury.\n\n---\n\n## Preventing Chronification — Critical Considerations\n\nThe transition from acute to **chronic primary musculoskeletal pain** (ICD-11: MG30.02) occurs in approximately 10–20% of acute LBP cases and represents a significant clinical concern. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1236923870)\n\n### Yellow Flags to Monitor (Psychosocial Risk Factors)\n\n- **Catastrophizing** — belief that pain indicates serious damage\n- **Fear-avoidance behavior** — avoiding all movement due to pain fear\n- **Low mood / anxiety / depression**\n- **Passive coping** — expectation that treatment alone (not self-management) will resolve pain\n- **Workplace dissatisfaction** or compensation/litigation involvement\n- **Social isolation**\n\n### Prevention Strategies\n\n- **Reassurance**: Educate that acute mechanical LBP has an excellent prognosis\n- **Self-efficacy**: Empower the patient to take an active role in recovery\n- **Avoid over-medicalization**: Limit unnecessary imaging and specialist referrals in the absence of red flags\n- **Set expectations**: Some residual discomfort for 4–6 weeks is normal and does not indicate worsening pathology\n\n---\n\n## Summary: Evaluation of Your Current Treatment Plan\n\n| Your Prescription | Evidence Assessment | Comment |\n|---|---|---|\n| **Naproxen 500 mg BID** | ✅ Strongly recommended | First-line; limit to shortest effective duration |\n| **Cyclobenzaprine 5 mg QHS** | ✅ Appropriate adjunct | Limit to 7–14 days; good QHS dosing choice |\n| **Ice/Heat** | ✅ Recommended | Ice first 72h → transition to heat |\n| **Activity as tolerated** | ✅ Strongly recommended | The most important intervention |\n| **PT referral** | ✅ Strongly recommended | Initiate within 1–2 weeks |\n| **Modified work duty** | ✅ Best practice | Preferable to complete absence |\n| **2-week follow-up** | ✅ Appropriate | Reassess progress, adjust plan, screen for yellow flags |\n\n> **Overall Assessment:** Your treatment plan is comprehensive, evidence-based, and well-aligned with current international guideline recommendations. No modifications are necessary. At the 2-week follow-up, screen for psychosocial yellow flags and confirm progressive functional improvement.\n\n---\n\n## References\n\n1. Association of Chiropractic Colleges Educational Conference and Research Agenda Conference 2024. *J Chiropr Educ*, 2024. [[EPMC]](https://europepmc.org/article/MED/38426548)\n\n2. ICD-11: Low back pain, unspecified (ME84.2Z). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#unspecified)\n\n3. ICD-11: Other specified acute pain (MG31.Y). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#other)\n\n4. ICD-11: Chronic primary musculoskeletal pain (MG30.02). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1236923870)\n\n5. ICD-11: Spinal pain, unspecified (ME84.Z). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#unspecified)\n\n6. OpenFDA Drug Adverse Events — Analgesic medications. [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:acute%20mechanical%20low%20back%20pain%20conservative)\n\n7. DailyMed: Rapid Relief Lidocaine 4% Patch. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca35030-958c-8f62-e063-6294a90a4d63)\n\n8. DailyMed: Reinreude Back Pain Therapy Patch (Camphor/Menthol/Capsicum). [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca7d0ca-6407-1fed-e063-6394a90aaccc)\n\n9. DailyMed: Natuheal Joint Back Pain Relief Cream (Arnica). [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4c923afa-4d1e-0776-e063-6294a90a2f54)",
          "citations": [
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#unspecified"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#other"
            },
            {
              "source": "openfda",
              "title": "FDA",
              "url": "https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:acute%20mechanical%20low%20back%20pain%20conservative"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca35030-958c-8f62-e063-6294a90a4d63"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca7d0ca-6407-1fed-e063-6394a90aaccc"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4c923afa-4d1e-0776-e063-6294a90a2f54"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/38426548"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#1236923870"
            }
          ],
          "metadata": {
            "modelId": "claude-opus-4-6",
            "promptFamily": "research",
            "generatedAt": "2026-03-12T12:57:40.904Z"
          }
        },
        {
          "question": "What should be included in return-to-work or modified-duty planning for acute low back pain?",
          "answer": "## Return-to-Work and Modified-Duty Planning for Acute Low Back Pain\n\nYour patient — a worker who sustained an **acute lumbar muscle strain (L4-L5)** lifting a 50–60 lb box with a twisting mechanism — is an ideal candidate for structured return-to-work (RTW) planning. Evidence consistently shows that **early, planned return to modified duty** produces superior outcomes compared to complete work absence. Below is a comprehensive framework for your work note and RTW plan.\n\n---\n\n## Why Modified Duty Matters: The Evidence Base\n\nProlonged work absence after acute mechanical low back pain is one of the strongest predictors of **chronic disability and pain chronification**. Psychosocial factors, including the patient's own recovery expectations, play a pivotal role. A systematic review and meta-analysis found that **patient recovery expectations are a significant, independent predictor of RTW outcomes** after musculoskeletal pain conditions — patients who expect to recover and return to work do so more reliably. [[EPMC]](https://europepmc.org/article/MED/36155605)\n\n> **Key Principle:** The goal is not to return the patient to full duty while still symptomatic, but to maintain workplace engagement at a safe, tolerable level that promotes recovery and prevents deconditioning.\n\nFailure to manage this transition effectively increases the risk of progression to **chronic primary musculoskeletal pain** (ICD-11: MG30.02), a condition with far greater treatment complexity and poorer prognosis. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1236923870)\n\n---\n\n## Core Components of a Modified-Duty Work Note\n\n### Essential Elements to Include\n\nEvery modified-duty work note should contain the following structured components:\n\n| Component | Details for This Patient |\n|---|---|\n| **Diagnosis** | Acute lumbar muscle strain (ICD-11: ME84.2Z) [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#unspecified) |\n| **Date of injury** | 2 days prior to visit (workplace lifting injury) |\n| **Work status** | Modified duty — **NOT** full restriction |\n| **Duration** | Initial 2 weeks, to be reassessed at follow-up |\n| **Specific restrictions** | Itemized (see below) |\n| **Reassessment date** | 2-week follow-up appointment |\n| **Goal** | Progressive return to full duty within 2–6 weeks |\n\n---\n\n## Specific Physical Restrictions — Phased Approach\n\n### Phase 1: Weeks 1–2 (Current Period)\n\nThese restrictions should be clearly documented on the work note:\n\n**Lifting and Carrying:**\n\n- **Maximum lift: 10 lbs** (from waist height)\n- **No lifting from floor level**\n- No carrying objects >10 lbs for more than 50 feet\n- **No overhead lifting**\n\n**Positional Restrictions:**\n\n- No prolonged sitting >30 minutes without a position change\n- No prolonged standing >30 minutes without a position change\n- **Ability to alternate sit/stand** at will (sit-stand workstation if available)\n- No sustained bending or stooping\n\n**Movement Restrictions:**\n\n- **No repetitive twisting** at the waist\n- No repetitive bending (>10 times per hour)\n- No climbing ladders or working at heights\n- No pushing/pulling >20 lbs force\n\n**Work Schedule:**\n\n- May work **full shift** (8 hours) with restrictions\n- Alternatively, consider **6-hour shifts** for the first 3–5 days if pain is limiting\n- Allow **two additional 10-minute rest breaks** per shift for stretching and position changes\n\n### Phase 2: Weeks 3–4 (Reassess at Follow-Up)\n\nIf progressing well at the 2-week visit:\n\n- Increase maximum lift to **20–25 lbs**\n- Allow occasional floor-to-waist lifting with proper body mechanics\n- Reduce positional change frequency to every 45–60 minutes\n- Allow moderate bending and twisting with controlled technique\n- Maintain restriction on repetitive heavy lifting\n\n### Phase 3: Weeks 5–6 (Target Full Duty)\n\n- Progressive return to **full occupational demands**\n- Lifting capacity approaching job-specific requirements\n- Full bending, twisting, and positional tolerance\n- Clearance for full duty contingent on functional assessment\n\n---\n\n## Functional Capacity Considerations\n\n### Job-Specific Task Analysis\n\nFor optimal RTW planning, understanding the patient's **specific occupational demands** is critical. Key questions to clarify:\n\n- **Job title and primary duties** — warehouse, office, construction, etc.?\n- **Typical lifting requirements** — frequency and weight\n- **Availability of modified duty** at the employer\n- **Ergonomic accommodations** possible (sit-stand desk, lifting aids, job rotation)\n\nResearch into functional biomarkers associated with low back pain risk in physically demanding occupations (e.g., firefighters) demonstrates that **trunk flexion endurance, hip mobility, and core stability** are key modifiable factors that predict both injury risk and recovery trajectory. [[EPMC]](https://europepmc.org/article/MED/41283548)\n\n### Physical Rehabilitation Integration\n\nYour PT referral is a critical component of the RTW plan. Physical rehabilitation (ICD-11: QB95.1) should be explicitly coordinated with workplace demands. [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1128991153)\n\n**PT goals aligned with RTW:**\n\n1. **Week 1–2:** Pain modulation, gentle mobility, motor control activation\n2. **Week 2–4:** Core stabilization, progressive loading, simulated work tasks\n3. **Week 4–6:** Work-specific functional conditioning, lifting mechanics retraining\n4. **Ongoing:** Injury prevention program, maintenance exercises\n\nActive rehabilitation programs are being studied for their predictive factors of success in back pain recovery, reinforcing the importance of individualized, goal-directed PT. [[TRIALS]](https://clinicaltrials.gov/study/NCT07051772)\n\n---\n\n## Medication Management During RTW\n\n### Workplace Safety Considerations\n\n| Medication | Workplace Implication | Recommendation |\n|---|---|---|\n| **Naproxen 500 mg BID** | No cognitive impairment; safe for all work tasks | ✅ Continue during work hours |\n| **Cyclobenzaprine 5 mg QHS** | Causes drowsiness; may have residual AM sedation | ⚠️ **QHS-only dosing** is appropriate; warn about AM grogginess |\n| **Topical lidocaine 4% patch** | No systemic effects; can be worn at work | ✅ Good workplace-compatible adjunct [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca35030-958c-8f62-e063-6294a90a4d63) |\n| **Topical counterirritants** (camphor/menthol) | No cognitive effects; may have odor | ✅ Acceptable at work [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca7d0ca-6407-1fed-e063-6394a90aaccc) |\n\nFDA adverse event data for analgesic medications used in musculoskeletal conditions shows that **pain, nausea, and fatigue** are among the most commonly reported reactions — all of which can impact work performance and should be monitored. [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:acute%20low%20back%20pain%20return%20to)\n\n> **Important:** If the patient operates heavy machinery or drives commercially, document that **cyclobenzaprine** is taken only at bedtime and assess for residual sedation. Consider discontinuing it before full-duty return if sedation persists.\n\n---\n\n## Psychosocial Factors in RTW Planning\n\n### Addressing Recovery Expectations\n\nThe strongest modifiable predictor of successful RTW is the **patient's own expectation of recovery**. A meta-analysis demonstrated that recovery expectations can be reliably assessed with single-item measures (e.g., \"Do you expect to return to your usual work within the next few weeks?\") and that positive expectations are significantly associated with faster RTW. [[EPMC]](https://europepmc.org/article/MED/36155605)\n\n### Recommended Counseling Points at This Visit\n\n- **\"This is a muscle strain that will heal. Most people with this injury return to full activity within 4–6 weeks.\"**\n- **\"Staying active and returning to modified work actually helps you recover faster than staying home.\"**\n- **\"Some discomfort during activity is normal and expected — it does not mean you are causing damage.\"**\n- **\"We will increase your activity level gradually and safely.\"**\n\n### Yellow Flags to Screen for at Follow-Up\n\n- Fear-avoidance beliefs (\"If I go back to work, I'll make it worse\")\n- Catastrophizing (\"This pain will never go away\")\n- Workplace conflict or dissatisfaction\n- Desire for prolonged complete absence from work\n- Depression or anxiety symptoms\n\nOngoing research into pain chronification predictors emphasizes that early identification of these psychosocial risk factors is essential to prevent the transition from acute to chronic pain. [[EPMC]](https://europepmc.org/article/MED/40027208)\n\n---\n\n## Occupational Health Coordination\n\n### Communication with Employer\n\nProvide the employer with:\n\n1. **Clear, specific restrictions** (not vague language like \"light duty\")\n2. **Expected duration** of each restriction phase\n3. **Reassessment timeline** — avoids open-ended restrictions\n4. **Accommodation suggestions** — sit-stand option, lifting aids, task rotation\n\nOccupational and environmental medicine conferences continue to emphasize the importance of structured workplace communication in managing musculoskeletal injuries. [[EPMC]](https://europepmc.org/article/PMC/PMC11994198) [[EPMC]](https://europepmc.org/article/PMC/PMC12875526)\n\n### Workers' Compensation Documentation\n\nIf this is a workers' compensation claim, ensure documentation includes:\n\n- **Mechanism of injury** with specific details (lifting 50–60 lb box with twist)\n- **Objective findings** (right paraspinal spasm at L4-L5, reduced flexion, negative SLR)\n- **Diagnosis** with ICD-11 code: ME84.2Z [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#unspecified)\n- **Causation statement** linking the workplace event to the diagnosis\n- **Treatment plan** including medications, PT, and follow-up schedule\n- **Work capacity** with specific, measurable restrictions\n- **Prognosis**: Expected full recovery within 4–6 weeks\n\n---\n\n## Sample Modified-Duty Work Note Template\n\n> **WORK STATUS REPORT**\n>\n> **Patient:** [Name] | **Date:** [Today] | **DOI:** [2 days ago]\n>\n> **Diagnosis:** Acute lumbar muscle strain (ME84.2Z)\n>\n> **Work Status:** MODIFIED DUTY effective immediately\n>\n> **Restrictions (2 weeks):**\n> - Lift/carry maximum 10 lbs\n> - No floor-to-waist lifting\n> - No repetitive bending or twisting\n> - Alternate sit/stand every 30 minutes\n> - No climbing, pushing/pulling >20 lbs\n> - Two additional 10-minute stretch breaks per shift\n>\n> **Duration:** 2 weeks | **Reassessment:** [Follow-up date]\n>\n> **Prognosis:** Expected full recovery and return to unrestricted duty within 4–6 weeks with adherence to treatment plan.\n\n---\n\n## Emerging Research Relevant to RTW\n\nSeveral active clinical trials are investigating treatments and rehabilitation strategies that may further inform RTW planning for low back pain:\n\n- A trial evaluating **erector spinae plane blocks** for acute low back pain may offer future options for rapid pain control facilitating earlier RTW. [[TRIALS]](https://clinicaltrials.gov/study/NCT07434024)\n\n- Research into **non-specific chronic low back pain treatment methods** aims to identify optimal interventions to prevent the acute-to-chronic transition that derails RTW. [[TRIALS]](https://clinicaltrials.gov/study/NCT07057687)\n\n---\n\n## Summary: RTW Planning Checklist for This Patient\n\n| Element | Status | Action |\n|---|---|---|\n| **Modified-duty work note** | ✅ Planned | Issue today with specific restrictions |\n| **Phased restriction schedule** | ✅ Outlined | Phase 1 (weeks 1–2) → Phase 2 (weeks 3–4) → Full duty |\n| **PT referral** | ✅ Ordered | Coordinate PT goals with occupational demands |\n| **Medication safety for work** | ✅ Reviewed | Naproxen safe at work; cyclobenzaprine QHS only |\n| **Recovery expectation counseling** | 🔲 To do | Deliver positive, evidence-based reassurance today |\n| **Yellow flag screening** | 🔲 At follow-up | Assess psychosocial barriers at 2-week visit |\n| **Employer communication** | 🔲 To do | Provide specific, time-limited restrictions |\n| **Workers' comp documentation** | 🔲 If applicable | Ensure causation, objective findings, and prognosis documented |\n| **Ergonomic/body mechanics education** | 🔲 Via PT | Hip hinge technique, workstation setup |\n| **Follow-up reassessment** | ✅ Scheduled | 2 weeks — advance restrictions or investigate if not improving |\n\n---\n\n## References\n\n1. \"Recovery expectations can be assessed with single-item measures: findings of a systematic review and meta-analysis on the role of recovery expectations on return-to-work outcomes after musculoskeletal pain conditions.\" *Pain*, 2023. [[EPMC]](https://europepmc.org/article/MED/36155605)\n\n2. \"Functional Biomarkers Associated with Risk of Low Back Pain in Firefighters: A Systematic Review.\" *J Funct Morphol Kinesiol*, 2025. [[EPMC]](https://europepmc.org/article/MED/41283548)\n\n3. \"Revealing the Progression of Pain Pathways and Identifying Chronification of Pain Predictors After an Isolated Lateral Ankle Sprain: Project RECOIL.\" *J Pain Res*, 2025. [[EPMC]](https://europepmc.org/article/MED/40027208)\n\n4. \"Message from the Chairperson, Scientific Committee — OCCUCON 2025.\" *Indian J Occup Environ Med*, 2025. [[EPMC]](https://europepmc.org/article/PMC/PMC11994198)\n\n5. \"Abstracts for IJOEM.\" *Indian J Occup Environ Med*, 2026. [[EPMC]](https://europepmc.org/article/PMC/PMC12875526)\n\n6. ICD-11: Low back pain, unspecified (ME84.2Z). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#unspecified)\n\n7. ICD-11: Chronic primary musculoskeletal pain (MG30.02). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1236923870)\n\n8. ICD-11: Physical rehabilitation (QB95.1). [[ICD-11]](https://icd.who.int/browse/2024-01/mms/en#1128991153)\n\n9. OpenFDA Drug Adverse Events — Analgesic medications. [[FDA]](https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:acute%20low%20back%20pain%20return%20to)\n\n10. ClinicalTrials.gov: Erector Spinae Plane Block for Acute Low Back Pain (NCT07434024). [[TRIALS]](https://clinicaltrials.gov/study/NCT07434024)\n\n11. ClinicalTrials.gov: Non-Specific Chronic Low Back Pain Treatment Methods (NCT07057687). [[TRIALS]](https://clinicaltrials.gov/study/NCT07057687)\n\n12. ClinicalTrials.gov: Predictive Factors for the Success of Rehabilitation Programs in Chronic Low Back Pain (NCT07051772). [[TRIALS]](https://clinicaltrials.gov/study/NCT07051772)\n\n13. DailyMed: Rapid Relief Lidocaine 4% Patch. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca35030-958c-8f62-e063-6294a90a4d63)\n\n14. DailyMed: Reinreude Back Pain Therapy Patch. [[DAILYMED]](https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca7d0ca-6407-1fed-e063-6394a90aaccc)",
          "citations": [
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/36155605"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#1236923870"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#unspecified"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/41283548"
            },
            {
              "source": "icd11",
              "title": "ICD-11",
              "url": "https://icd.who.int/browse/2024-01/mms/en#1128991153"
            },
            {
              "source": "clinical_trials",
              "title": "TRIALS",
              "url": "https://clinicaltrials.gov/study/NCT07051772"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca35030-958c-8f62-e063-6294a90a4d63"
            },
            {
              "source": "dailymed",
              "title": "DAILYMED",
              "url": "https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4ca7d0ca-6407-1fed-e063-6394a90aaccc"
            },
            {
              "source": "openfda",
              "title": "FDA",
              "url": "https://api.fda.gov/drug/event.json?search=patient.drug.openfda.generic_name:acute%20low%20back%20pain%20return%20to"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/MED/40027208"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/PMC/PMC11994198"
            },
            {
              "source": "europe_pmc",
              "title": "EPMC",
              "url": "https://europepmc.org/article/PMC/PMC12875526"
            },
            {
              "source": "clinical_trials",
              "title": "TRIALS",
              "url": "https://clinicaltrials.gov/study/NCT07434024"
            },
            {
              "source": "clinical_trials",
              "title": "TRIALS",
              "url": "https://clinicaltrials.gov/study/NCT07057687"
            }
          ],
          "metadata": {
            "modelId": "claude-opus-4-6",
            "promptFamily": "research",
            "generatedAt": "2026-03-12T12:58:50.446Z"
          }
        }
      ],
      "record": {
        "date": "2026-03-03T08:15:00.000Z",
        "patientName": "Jason Miller",
        "chiefComplaint": "Threw my back out at work two days ago and it's been killing me ever since. I can barely move.",
        "hpiText": "The patient is a warehouse worker who presents with acute onset of sharp lower back pain two days ago while lifting a heavy box (50-60 pounds) off the floor with a twisting motion. Pain is localized to the right lower back from belt line up a few inches, initially sharp/stabbing, now deep constant ache with tightness and sharp catch with movement (worse with bending forward, twisting, getting up from chair, sneezing/coughing, sitting >15-20 min; better lying flat on back with knees up, ice). Pain 4-5/10 at rest, 8-9/10 with aggravating movements. No radiation below knee (mild right buttock soreness), no numbness/tingling in saddle area, no bowel/bladder changes, no leg weakness, no fever/chills/night sweats, no unexplained weight loss, no cancer history. Prior minor back tweak 3 years ago resolved with rest. Tried ibuprofen 400mg (2x200mg tabs) 3-4x/day with minimal relief.",
        "medications": "Ibuprofen 400 mg (2x200 mg tablets) 3-4 times daily as needed (current, minimal relief)\nNaproxen 500 mg twice daily with food (new prescription, for 10-14 days)\nCyclobenzaprine 5 mg at bedtime (new prescription, 1-week supply)",
        "rosText": "No numbness/tingling in groin/saddle area. No bowel/bladder changes. No leg weakness. No fever/chills/night sweats. No unexplained weight loss.",
        "pmh": "Appendectomy as teenager. Minor back strain 3 years ago resolved with rest. No other chronic conditions. No medication allergies.",
        "socialHistory": "Warehouse worker for 8 years (heavy lifting, on feet all day). Former smoker (quit 5 years ago, previously 1/2 pack/day). Alcohol: 1-2 beers on weekends. Sedentary outside work (used to play basketball). Plans to start walking with wife.",
        "familyHistory": "[Not discussed]",
        "vitals": {
          "bp": "126/78",
          "hr": "72",
          "temp": "98.4",
          "rr": "[Not discussed]",
          "spo2": "[Not discussed]"
        },
        "physicalExam": "Antalgic posture shifted to left. Significant right paraspinal muscle spasm at L4-L5 level; spine not tender to direct palpation. Forward flexion 30% normal; extension limited. Negative straight leg raise bilaterally. Normal neurological exam: strength 5/5 throughout lower extremities, sensation intact in lumbar distributions, reflexes brisk/symmetrical at knees/ankles.",
        "labsStudies": null,
        "assessment": "1. 1. Acute lumbar muscle strain (right paraspinal at L4-L5), no radiculopathy or red flags",
        "plan": "1. Acute lumbar muscle strain: Naproxen 500 mg BID with food x 10-14 days; cyclobenzaprine 5 mg QHS x 1 week; ice 15-20 min several times/day x 48-72 hrs then heat; relative rest (avoid bending/twisting/heavy lifting, short walks 5-10 min several times/day, no prolonged bed rest); PT referral (start within 1 week: manual therapy, core strengthening, body mechanics training, 6-8 sessions over 4-6 weeks); work note for modified duty (no lifting >10 lbs, no repetitive bending/twisting x 2 weeks, return to light duty in 2 days if possible); prevention (proper lifting technique, use equipment, ergonomic assessment, general fitness/walking, weight loss); follow-up in 2 weeks or sooner if worsening pain, new radicular symptoms, or red flags (saddle numbness, bowel/bladder changes, leg weakness → ER). No imaging at this time.",
        "metadata": {
          "modelId": "grok-4-1-fast-non-reasoning",
          "promptFamily": "record",
          "generatedAt": "2026-03-12T12:56:32.312Z"
        }
      },
      "patientHandout": {
        "language": "en",
        "conditions": [
          {
            "id": "low-back-pain:ME84.2Y",
            "icdCode": "ME84.2Y",
            "diseaseName": "Acute lumbar muscle strain (Other specified low back pain)",
            "source": "ddx"
          }
        ],
        "entries": [
          {
            "conditionId": "low-back-pain:ME84.2Y",
            "sections": {
              "conditionOverview": "Acute lumbar muscle strain is a common injury to the muscles and ligaments in your lower back, often caused by sudden heavy lifting or twisting. It leads to pain and stiffness, usually around the L4-L5 area of the spine. Most cases improve with simple home care and physical therapy within a few weeks.",
              "signsSymptoms": "You may feel sharp pain in the lower back that worsens with movement, bending, or twisting. Pain is often mild at rest (4-5/10) but sharp (8-9/10) when active. There might be muscle spasms, stiffness, limited ability to bend forward, and soreness in the buttock area, but no pain shooting down the leg below the knee.",
              "causesRiskFactors": "This often happens from lifting heavy objects (like 50-60 lb boxes) with twisting, especially during repetitive physical work. Risk factors include poor lifting technique (bending at the waist instead of knees), rushing under time pressure, extra body weight, weak core muscles, and lack of regular exercise.",
              "complications": "If not managed properly, it can lead to ongoing pain, repeated injuries, or time off work. Rarely, it might signal a more serious issue if new symptoms like leg weakness or numbness develop.",
              "treatmentOptions": "Rest briefly but stay active with short walks. Use ice for the first 1-2 days (20 minutes on/off), then switch to heat. Take naproxen 500 mg twice daily with food for pain and inflammation (2 weeks), and cyclobenzaprine 5 mg at bedtime for spasms (1 week). Start physical therapy (6-8 sessions over 4-6 weeks) for core strengthening, proper lifting techniques, and gradual return to work. Follow modified work duties: no lifting over 10 lbs, no repetitive bending/twisting for 2 weeks.",
              "whenToSeekHelp": "Seek emergency care immediately if you have numbness in the groin/inner thigh, loss of bladder/bowel control, sudden leg weakness, or severe uncontrollable pain. Call your doctor sooner if pain worsens instead of improving, or if new pain shoots down your leg below the knee.",
              "additionalAdviceFollowUp": "Prevent future strains by always facing loads directly, bending at knees/hips, keeping objects close, tightening your core, and pivoting with your feet (not twisting). Use equipment like dollies for heavy items over 50 lbs. Walk 10-15 minutes daily (build up), aim for modest weight loss, and continue PT exercises at home. Follow up in 2 weeks; imaging like X-ray/MRI only if not improving.",
              "disclaimer": "This is general educational information about acute lumbar muscle strain based on common guidelines. It is not a personal diagnosis or treatment plan. Always follow your doctor's specific instructions and contact them or seek emergency care for any concerns. This is not a substitute for professional medical advice."
            }
          }
        ],
        "generatedAt": "2026-03-12T12:56:43.259Z",
        "metadata": {
          "modelId": "grok-4-1-fast-non-reasoning",
          "promptFamily": "patient-handout",
          "generatedAt": "2026-03-12T12:56:43.259Z"
        }
      },
      "documents": [
        {
          "templateId": "after-visit-summary",
          "title": null,
          "contentJson": {
            "type": "doc",
            "content": [
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Visit snapshot"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Visit reason"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Acute low back pain after lifting heavy box with twist at work"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Today's impression"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Acute lumbar muscle strain (right paraspinal at L4-L5) without radiculopathy or red flags. Muscle spasm, reduced flexion, negative SLR, normal neuro exam."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Diagnosis codes"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "ME84.2Y"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Medication and orders"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Medication changes"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Switch from ibuprofen to naproxen 500 mg, one tablet morning and evening with food for 10-14 days"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Add cyclobenzaprine 5 mg at bedtime for muscle spasm (1-week supply, avoid driving)"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Referrals ordered"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Physical therapy (start within 1 week for spasm release, core strengthening, body mechanics, return-to-work plan)"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Follow-up and safety"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Scheduled follow-up date"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "2 weeks"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Follow-up plan"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Return in 2 weeks to assess progress. Imaging if no improvement."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Return precautions"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Numbness in groin/inner thigh/saddle area"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Loss of bladder/bowel control"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Sudden leg weakness"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Severe/uncontrolled pain"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Pain worsening or new leg pain below knee"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Patient action items"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Ice 15-20 min several times/day for 48-72 hrs, then heat"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Short walks 5-10 min several times/day, avoid bed rest >1-2 days"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Avoid bending/twisting/heavy lifting"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Take meds as prescribed with food"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Modified work: no lifting >10 lbs, no repetitive bending/twisting for 2 weeks"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Sleep on back with pillow under knees or side with pillow between knees"
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          },
          "generationInputs": {
            "clinicalContextMode": null,
            "confirmedDiagnoses": [
              {
                "id": "low-back-pain:ME84.2Y",
                "icdCode": "ME84.2Y",
                "diseaseName": "Acute lumbar muscle strain (Other specified low back pain)",
                "source": "ddx"
              }
            ]
          },
          "metadata": {
            "modelId": "grok-4-1-fast-non-reasoning",
            "promptFamily": "document",
            "generatedAt": "2026-03-12T13:00:12.524Z"
          }
        },
        {
          "templateId": "referral-request-letter",
          "title": null,
          "contentJson": {
            "type": "doc",
            "content": [
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Referral request header"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Referring clinician"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Dr. [Referring Provider]"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Receiving clinician or service"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Physical Therapy"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Urgency"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Routine"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Referral question"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Please evaluate and treat acute lumbar muscle strain with paraspinal spasm to improve mobility, initiate core strengthening, teach proper body mechanics for heavy lifting job, and facilitate safe return to modified work duties."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Clinical summary"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Reason for referral"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Acute right lumbar muscle strain following work-related lifting injury with twist 2 days ago; significant paraspinal spasm at L4-L5, pain 4-5/10 rest to 8-9/10 with movement, no radiculopathy."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Diagnosis codes"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "ME84.2Y"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Pertinent history and findings"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Sudden sharp pain in right lower back after lifting 50-60 lb box with twist; pain localized to lower back/right buttock, no radiation below knee; antalgic posture, 30% flexion, negative SLR bilaterally, normal neuro exam (5/5 strength, intact sensation, normal reflexes); no red flags."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Workup completed"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Physical exam including neuro assessment"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Vitals: BP 126/78, HR 72, T 98.4"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Current medications and allergies"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Naproxen 500mg BID with food; cyclobenzaprine 5mg QHS; no known allergies"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Requested actions and attachments"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Requested evaluation or service"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Manual therapy for spasm release, core strengthening program, lifting mechanics training, graded return-to-work plan; start within 1 week, 6-8 sessions over 4-6 weeks."
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Target appointment window"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Within 1 week"
                  }
                ]
              }
            ]
          },
          "generationInputs": {
            "clinicalContextMode": null,
            "confirmedDiagnoses": [
              {
                "id": "low-back-pain:ME84.2Y",
                "icdCode": "ME84.2Y",
                "diseaseName": "Acute lumbar muscle strain (Other specified low back pain)",
                "source": "ddx"
              }
            ]
          },
          "metadata": {
            "modelId": "grok-4-1-fast-non-reasoning",
            "promptFamily": "document",
            "generatedAt": "2026-03-12T13:00:12.527Z"
          }
        },
        {
          "templateId": "longitudinal-care-plan",
          "title": null,
          "contentJson": {
            "type": "doc",
            "content": [
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Care plan overview"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Primary condition focus"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Acute lumbar muscle strain"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Active problems"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Acute lumbar muscle strain (right paraspinal at L4-L5)"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Work-related injury risk"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Health concerns"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Pain management"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Return to work"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Recurrence prevention"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Goals and interventions"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Care goals"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Item 1"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Goal"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Reduce pain to <3/10 at rest and <5/10 with movement within 2 weeks"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Interventions"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Naproxen 500mg twice daily with food for 10-14 days"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Cyclobenzaprine 5mg at bedtime for 1 week"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Ice 15-20min several times/day for first 48-72 hours, then heat"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring metric"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Pain scale (0-10)"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Target timeframe"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "2 weeks"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Item 2"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Goal"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Improve lumbar flexion to >70% normal and resolve muscle spasm within 4 weeks"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Interventions"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Physical therapy starting within 1 week: manual therapy, core strengthening, body mechanics training"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Relative rest: avoid bending/twisting/heavy lifting, short walks 5-10min several times/day"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring metric"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Lumbar flexion range and palpation for spasm"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Target timeframe"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "4 weeks"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Item 3"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Goal"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Return to modified work duty within 1 week and full duty within 6 weeks"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Interventions"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Modified duty note: no lifting >10lbs, no repetitive bending/twisting for 2 weeks"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Gradual return-to-activity plan via PT"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Workplace ergonomics: use dollies/forklift, proper lifting technique"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring metric"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Work status and functional capacity"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Target timeframe"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "6 weeks"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Item 4"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Goal"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Prevent recurrence through long-term habits"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Interventions"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Daily core exercises post-PT"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "General fitness: walking/swimming 2-3x/week"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Weight management: aim 5-10% loss"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Lifting rules: face load, knees/hips bend, no twist, get help >50lbs"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring metric"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Episode-free intervals and weight"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 4
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Target timeframe"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Ongoing"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 2
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring and escalation"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Monitoring plan"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Self-report pain scale daily"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Track medication adherence and side effects"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "PT progress reports"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Follow-up visit in 2 weeks"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Expected outcomes"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "Significant improvement in 2-4 weeks, full recovery in 6-8 weeks, reduced recurrence risk"
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Escalation criteria"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Progressive worsening of pain"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "New radicular pain below knee"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Saddle numbness, bowel/bladder changes, leg weakness (ER immediately)"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "No improvement after 2 weeks"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Patient or caregiver responsibilities"
                  }
                ]
              },
              {
                "type": "bulletList",
                "content": [
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Take medications as prescribed"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Attend PT sessions (6-8 over 4-6 weeks)"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Perform home exercises and walks"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Report changes promptly"
                          }
                        ]
                      }
                    ]
                  },
                  {
                    "type": "listItem",
                    "content": [
                      {
                        "type": "paragraph",
                        "content": [
                          {
                            "type": "text",
                            "text": "Follow work restrictions"
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "type": "heading",
                "attrs": {
                  "level": 3
                },
                "content": [
                  {
                    "type": "text",
                    "text": "Next review date"
                  }
                ]
              },
              {
                "type": "paragraph",
                "content": [
                  {
                    "type": "text",
                    "text": "2026-03-17"
                  }
                ]
              }
            ]
          },
          "generationInputs": {
            "clinicalContextMode": null,
            "confirmedDiagnoses": [
              {
                "id": "low-back-pain:ME84.2Y",
                "icdCode": "ME84.2Y",
                "diseaseName": "Acute lumbar muscle strain (Other specified low back pain)",
                "source": "ddx"
              }
            ]
          },
          "metadata": {
            "modelId": "grok-4-1-fast-non-reasoning",
            "promptFamily": "document",
            "generatedAt": "2026-03-12T13:00:12.529Z"
          }
        }
      ]
    }
  ]
} as const

export const SAMPLE_CONSULTATION_FIXTURE_PACK: SampleConsultationFixturePack = {
  version: SAMPLE_PACK_VERSION,
  generatedAt: fixturePack.generatedAt,
  samples: fixturePack.samples as unknown as SampleConsultationFixturePack["samples"],
}
