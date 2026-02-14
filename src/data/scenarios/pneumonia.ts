import type { Scenario } from "./index"

export const pneumoniaScenario: Scenario = {
  id: "pneumonia",
  name: "Community-Acquired Pneumonia",
  description:
    "5-day cough, fever, and dyspnea. Auscultation, chest X-ray, and blood work leading to community-acquired pneumonia diagnosis and antibiotic therapy.",
  tags: ["pulmonology", "acute", "infection", "imaging"],
  entries: [
    // — Opening & Chief Complaint —
    {
      rawSpeakerId: 0,
      text: "Hello, please come in and have a seat. What's going on today?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Doctor, I've had this terrible cough for about five days now. At first I thought it was just a cold, but it's gotten much worse. I'm coughing up yellowish-green stuff and I've had a fever.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "I see. How high has the fever been, and have you been measuring it at home?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, it's been around thirty-eight point five to thirty-nine degrees Celsius. Last night it hit thirty-nine point two and I had really bad chills and night sweats.",
      delayMs: 2200,
    },

    // — History of Present Illness —
    {
      rawSpeakerId: 0,
      text: "Are you experiencing any shortness of breath or chest pain?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, actually. I feel short of breath when I walk up stairs or move around a lot. And there's a sharp pain on the right side of my chest when I take a deep breath or cough.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "That's called pleuritic chest pain, pain that worsens with breathing. It's important we look into that. Is the cough worse at any particular time of day?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 1,
      text: "It's constant but definitely worse at night. I can barely sleep because of the coughing fits. I've also been feeling completely exhausted, no energy at all, and I've lost my appetite.",
      delayMs: 2400,
    },

    // — Past Medical & Social History —
    {
      rawSpeakerId: 0,
      text: "Do you have any chronic medical conditions? Any history of asthma or lung problems?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "No asthma. I do have mild hypertension controlled with amlodipine. I used to smoke about ten years ago, roughly half a pack a day for about eight years, but I quit.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "Good that you quit. Any recent travel, contact with sick people, or have you been in crowded settings like a conference or long flight?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "My coworker had a bad cold about a week and a half ago. We share an office. And my daughter brought something home from daycare, she had a runny nose and cough for a few days.",
      delayMs: 2400,
    },

    // — Physical Examination —
    {
      rawSpeakerId: 0,
      text: "Let me examine you. First, your temperature is thirty-eight point eight, heart rate is ninety-five, blood pressure is one thirty over eighty-two, and oxygen saturation is ninety-four percent on room air. That oxygen level is a little lower than I'd like.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Is ninety-four bad?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Normal is ninety-five or above. Ninety-four tells me your lungs aren't exchanging oxygen as efficiently as they should. Let me listen to your chest now. Take some deep breaths for me.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "Okay.",
      delayMs: 600,
    },
    {
      rawSpeakerId: 0,
      text: "I'm hearing crackles, or what we call rales, in the right lower lobe. There's also decreased breath sounds in that area and some dullness to percussion. The left side sounds clear. This is quite consistent with a consolidation in the right lower lung.",
      delayMs: 3000,
    },

    // — Diagnostic Workup —
    {
      rawSpeakerId: 0,
      text: "Based on your symptoms and my examination, I'm fairly confident we're looking at pneumonia, specifically a community-acquired pneumonia. I'd like to order a chest X-ray to confirm and see the extent of it. I'll also order blood work including a complete blood count, a CRP, and a basic metabolic panel.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Do I need to be admitted to the hospital?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "That depends on the results. Your oxygen is borderline, and I want to see how the X-ray looks. Let's get the imaging and labs first, then I'll assess. Most community-acquired pneumonia can be treated at home with oral antibiotics, but given your oxygen level we need to be careful.",
      delayMs: 3000,
    },

    // — Results Discussion —
    {
      rawSpeakerId: 0,
      text: "Your chest X-ray is back. It shows a clear area of consolidation in the right lower lobe, which confirms pneumonia. There's no significant pleural effusion, which is good. Your white blood cell count is elevated at fourteen thousand, and your CRP is sixty-eight, both indicating an active infection.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "So it's definitely pneumonia. Is it serious?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "It's a moderate case. The good news is your oxygen has come up to ninety-five percent after resting, and your kidney function and electrolytes are normal. I believe we can manage this as an outpatient with close monitoring.",
      delayMs: 2600,
    },

    // — Treatment Plan —
    {
      rawSpeakerId: 0,
      text: "I'm going to prescribe amoxicillin-clavulanate, which is Augmentin, eight hundred seventy-five milligrams twice daily for seven days. I'll also add azithromycin two fifty milligrams, one today then one daily for four more days. This combination covers the most common bacteria causing community-acquired pneumonia.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Any side effects I should know about?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "The most common ones are gastrointestinal: nausea, diarrhea, or stomach upset. Take the Augmentin with food to minimize that. If you develop a rash, severe diarrhea, or any difficulty breathing that worsens, come back immediately or go to the ER.",
      delayMs: 2800,
    },

    // — Instructions & Follow-up —
    {
      rawSpeakerId: 0,
      text: "You should rest, drink plenty of fluids, and take acetaminophen for the fever. Avoid strenuous activity. I want you to monitor your temperature twice daily. If it hasn't come down within forty-eight to seventy-two hours of starting antibiotics, call us right away.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "When should I start feeling better?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Most patients notice improvement within two to three days, but the cough and fatigue can linger for one to two weeks. Complete the full course of antibiotics even if you feel better. I'd like to see you back in one week for a follow-up, and we'll repeat the X-ray in four to six weeks to make sure the infiltrate has resolved.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, doctor. I'll take the antibiotics as prescribed and rest up. Thank you for explaining everything so clearly.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "You're welcome. Remember, if you develop worsening shortness of breath, chest pain that doesn't go away, or your fever spikes above thirty-nine point five despite the medication, go to the emergency room. I'll have the nurse set up your follow-up appointment. Take care.",
      delayMs: 3000,
    },
  ],
}
