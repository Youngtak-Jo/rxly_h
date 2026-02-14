import type { Scenario } from "./index"

export const acuteAppendicitisScenario: Scenario = {
  id: "acute-appendicitis",
  name: "Acute Appendicitis",
  description:
    "Periumbilical pain migrating to RLQ. McBurney's tenderness and rebound confirmed, CT-diagnosed appendicitis with surgical referral.",
  tags: ["surgery", "acute", "urgent", "diagnostic"],
  entries: [
    // — Opening & Chief Complaint —
    {
      rawSpeakerId: 0,
      text: "I can see you're in some discomfort. Tell me what's going on.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Doctor, I have really bad stomach pain. It started last night around my belly button area, kind of a dull ache. But now it's moved down to the lower right side and it's gotten much sharper and worse.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "When exactly did it start, and has the pain been constant or does it come and go?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "It started about twelve hours ago. At first it was crampy and sort of came and went. But for the last four or five hours it's been constant and getting worse. It hurts more when I move or walk.",
      delayMs: 2400,
    },

    // — Associated Symptoms —
    {
      rawSpeakerId: 0,
      text: "Have you had any nausea, vomiting, or changes in appetite?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "I felt nauseous shortly after the pain started and I vomited once this morning. I have zero appetite. Even the thought of food makes me feel sick.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Any fever or chills?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "I felt warm last night. I didn't have a thermometer but I was sweating and then feeling cold on and off.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "How about your bowel movements? Any diarrhea or constipation? And when was the last time you passed gas?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "I had a small loose stool this morning but nothing since then. I passed gas a few hours ago, I think.",
      delayMs: 1600,
    },

    // — Ruling Out Other Causes —
    {
      rawSpeakerId: 0,
      text: "Any urinary symptoms? Pain when you urinate, frequency, or blood in the urine?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "No, urination is normal.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Any recent injuries, heavy lifting, or similar episodes in the past?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "No injuries, nothing like this has ever happened before. I've been pretty healthy.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Any allergies to medications? And are you taking any medications currently?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "No allergies. I just take a daily vitamin, that's it.",
      delayMs: 1000,
    },

    // — Physical Examination —
    {
      rawSpeakerId: 0,
      text: "Your temperature is thirty-eight point three, heart rate one hundred and two, blood pressure one twenty-eight over seventy-six. Let me examine your abdomen. I'll try to be as gentle as possible. Can you lie flat for me?",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, but it really hurts when I lie flat. Let me try.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "I'm going to start by listening with the stethoscope. Bowel sounds are present but diminished. Now I'll palpate gently. Tell me where it hurts the most.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 1,
      text: "Ow! Right there, the lower right side. That's exactly where it hurts the most.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "That's McBurney's point, which is one-third of the way from your hip bone to your belly button. I'm also noticing rebound tenderness, meaning the pain is worse when I release the pressure than when I push down. And there's guarding, your muscles are tensing up to protect the area. Let me check one more thing. Does it hurt in the right lower quadrant when I press on the left side?",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "Yes! How does pressing the left side make the right side hurt?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "That's called Rovsing's sign, and it's a classic finding in appendicitis. The pressure on the left creates indirect pressure on the inflamed appendix on the right.",
      delayMs: 2200,
    },

    // — Assessment & Diagnostic Plan —
    {
      rawSpeakerId: 0,
      text: "Based on the migrating pain pattern, nausea, fever, and the examination findings, I'm highly suspicious for acute appendicitis. I'd like to order a CT scan of the abdomen and pelvis with contrast to confirm. I'll also get blood work including a white blood cell count and a urinalysis to rule out other causes.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Appendicitis? Does that mean I need surgery?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "If the CT confirms appendicitis, yes, the standard treatment is an appendectomy, surgical removal of the appendix. It's almost always done laparoscopically, which means small incisions, less pain, and faster recovery. But let's confirm with the imaging first.",
      delayMs: 2800,
    },

    // — Results & Surgical Referral —
    {
      rawSpeakerId: 0,
      text: "Your CT is back. It shows an inflamed, dilated appendix measuring eleven millimeters in diameter with surrounding fat stranding and a small amount of free fluid. There's also an appendicolith, a small calcified blockage, visible. This confirms acute appendicitis. Your white count is fifteen thousand with a left shift, consistent with infection.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "So I definitely need surgery. When will that happen?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "I'm going to contact the surgical team right now. Given the findings, they'll want to operate today, ideally within the next few hours. We don't want to delay because there's a risk of the appendix rupturing, which would make things significantly more complicated.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "In the meantime, I'm going to start you on IV antibiotics, ceftriaxone and metronidazole, and we'll give you IV fluids and pain medication. You'll need to stay nothing by mouth from this point forward for the surgery.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "How long is the recovery from this surgery?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "For a laparoscopic appendectomy, most patients go home the next day and return to normal activities within one to two weeks. If it were open surgery or if the appendix had ruptured, recovery would be longer. The surgeon will explain everything in detail before the procedure. Do you have any questions while we wait for the surgical consult?",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "No, I think I understand. I'm just glad we figured out what it is. Thank you, doctor.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "You're welcome. You came in at the right time. I'll make sure you're comfortable while we wait for the surgeon. The nurse will be in shortly with the IV and antibiotics.",
      delayMs: 2200,
    },
  ],
}
