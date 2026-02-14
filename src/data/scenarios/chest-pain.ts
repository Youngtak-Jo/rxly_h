import type { Scenario } from "./index"

export const chestPainScenario: Scenario = {
  id: "chest-pain",
  name: "Chest Pain Evaluation",
  description:
    "55-year-old male with exertional chest pain and multiple cardiovascular risk factors. ECG, cardiac enzymes, and stress test planning.",
  tags: ["cardiology", "urgent", "risk-assessment", "diagnostic"],
  entries: [
    // — Opening & Chief Complaint —
    {
      rawSpeakerId: 0,
      text: "Good morning. I see from the triage notes that you're here for chest pain. Tell me exactly what's been going on.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "Hi, doctor. About a week ago I started getting this pressure in my chest. It comes on when I'm doing something physical, like walking up the stairs at work or carrying groceries. It goes away after I rest for a few minutes.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "Can you point to where exactly you feel the pressure?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "It's right in the center of my chest, behind the breastbone. Sometimes it feels like it spreads to my left arm and up into my jaw a little bit.",
      delayMs: 2400,
    },

    // — OPQRST Assessment —
    {
      rawSpeakerId: 0,
      text: "That radiation pattern is important. How would you describe the sensation? Is it sharp, burning, squeezing, or something else?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "It's more of a squeezing or heavy pressure, like someone is sitting on my chest. It's not sharp. It's a deep, uncomfortable feeling.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "On a scale of one to ten, how bad does it get at its worst?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "I'd say about a six or seven. It's never been so bad that I felt like I was going to pass out, but it definitely makes me stop what I'm doing.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "How long does each episode last?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Maybe three to five minutes. Once I stop and sit down, it gradually goes away. Yesterday I was rushing to catch the bus and it came on pretty strong. That's actually what made me decide to come in.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "Does anything else trigger it besides physical activity? Emotional stress, cold weather, heavy meals?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Now that you mention it, I got into an argument with my boss on Wednesday and I felt it then too. I haven't noticed it with meals or cold weather specifically.",
      delayMs: 2200,
    },

    // — Associated Symptoms —
    {
      rawSpeakerId: 0,
      text: "When the chest pressure comes on, do you experience any other symptoms? Shortness of breath, sweating, nausea, dizziness?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, I do get short of breath when it happens. And a couple of times I noticed I was sweating more than usual, even though I wasn't exercising that hard. No nausea or dizziness though.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "Have you ever had chest pain at rest? Waking up in the middle of the night with it?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "No, only with activity or that one time with the argument. At rest I feel fine.",
      delayMs: 1600,
    },

    // — Risk Factor Assessment —
    {
      rawSpeakerId: 0,
      text: "Let me ask about your cardiac risk factors. Do you smoke?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "I quit about two years ago. Before that I smoked a pack a day for about twenty-five years.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Good that you quit, but that's a significant smoking history. Any family history of heart disease?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "My father had a heart attack at age fifty-eight. He survived but needed stents. My older brother had bypass surgery at sixty-two.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "That's a very strong family history. How old are you now?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "I'm fifty-five.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Do you have high blood pressure, high cholesterol, or diabetes?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "I was told my cholesterol was high about a year ago but I never started medication for it. My doctor at the time recommended it but I didn't follow up. Blood pressure has been borderline, around one thirty-five over eighty-five. No diabetes that I know of.",
      delayMs: 3000,
    },

    // — Physical Exam —
    {
      rawSpeakerId: 0,
      text: "Let me examine you now. I'm going to listen to your heart and lungs, check your pulses, and look for any signs of heart failure. Please sit up for me.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "Your blood pressure today is one forty over eighty-eight. Heart rate is seventy-six and regular. Lungs are clear bilaterally. Heart sounds are normal, no murmurs. No leg swelling. Pulses are strong in both feet. That's reassuring.",
      delayMs: 3000,
    },

    // — ECG Results —
    {
      rawSpeakerId: 0,
      text: "I've already ordered an ECG which was done when you arrived. Let me review it. The rhythm is normal sinus rhythm. There are some nonspecific ST-T wave changes in the lateral leads. This could be significant in the context of your symptoms.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "What does that mean exactly? Is it a heart attack?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "The ECG changes I'm seeing are not consistent with an active heart attack, which is reassuring. However, combined with your symptoms and risk factors, they could indicate reduced blood flow to parts of the heart muscle during exertion. This is what we call angina.",
      delayMs: 2800,
    },

    // — Lab Orders —
    {
      rawSpeakerId: 0,
      text: "I'm going to order some blood work right now. A troponin level to check for any heart muscle damage, a complete metabolic panel, a lipid panel since you mentioned your cholesterol was high, and a CBC. We'll get results within the hour for the troponin.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Okay. What if the troponin is elevated?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "If the troponin is elevated, that would indicate heart muscle injury and we'd need to act more urgently, possibly admitting you and getting a cardiology consult right away. If it's normal, which I'm cautiously hopeful about since your ECG doesn't show acute changes, we'll proceed with further outpatient testing.",
      delayMs: 3200,
    },

    // — Stress Test Discussion —
    {
      rawSpeakerId: 0,
      text: "Assuming the troponin comes back normal, I strongly recommend a cardiac stress test. This is where we monitor your heart while you exercise on a treadmill. It helps us see if there's reduced blood flow to the heart during exertion, which would explain your symptoms.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "When would that be?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "I want to schedule it within the next week, given your symptoms and risk factors. If the stress test shows abnormalities, the next step would be a cardiac catheterization, an angiogram, to look directly at the coronary arteries.",
      delayMs: 2600,
    },

    // — Immediate Treatment —
    {
      rawSpeakerId: 0,
      text: "In the meantime, I'm going to start you on a few medications. First, aspirin eighty-one milligrams daily. Second, atorvastatin forty milligrams for your cholesterol. And I'm prescribing sublingual nitroglycerin tablets to keep with you. If you get the chest pressure, place one tablet under your tongue. If it doesn't improve in five minutes, take a second dose and call 911.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "Nitroglycerin? Isn't that what they give people having heart attacks?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "It's used for angina relief as well. It works by dilating the blood vessels and improving blood flow to the heart. It's an important safety net while we complete the evaluation. Some people get a headache from it, that's a common side effect.",
      delayMs: 2600,
    },

    // — Red Flags & Safety Net —
    {
      rawSpeakerId: 0,
      text: "I need to go over some warning signs with you. If at any point you experience chest pain at rest that lasts more than ten minutes, chest pain with severe shortness of breath or lightheadedness, or any sudden severe chest pain unlike what you've been having, call 911 immediately. Do not drive yourself to the hospital.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "That's a lot to take in. Should I avoid exercising until the stress test?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Avoid strenuous activity. Light walking on flat ground is okay. Don't push through any chest discomfort. If you feel the pressure coming on, stop immediately and rest. Use the nitroglycerin if needed. No heavy lifting, no running, no climbing multiple flights of stairs if possible.",
      delayMs: 2800,
    },

    // — Lifestyle Discussion —
    {
      rawSpeakerId: 0,
      text: "Long term, regardless of what the stress test shows, you have significant cardiovascular risk factors that we need to manage aggressively. The statin for cholesterol is crucial. We should also discuss blood pressure management and a heart-healthy diet. Are you open to that?",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Absolutely. I'm scared, to be honest. Seeing what happened to my father and brother, I don't want to end up the same way.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "The fact that you came in and we're catching this now is actually very positive. Many people ignore these symptoms. We have excellent tools for managing cardiovascular disease today. I'd also recommend the Mediterranean diet, which has strong evidence for heart health. Reduce saturated fats, increase fish, olive oil, nuts, and vegetables.",
      delayMs: 3200,
    },

    // — Closing —
    {
      rawSpeakerId: 1,
      text: "I'll start making changes right away. Thank you for taking this seriously, doctor.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Of course. Let's wait for the troponin result before you leave today. The nurse will draw the blood shortly. Once we have a normal troponin, I'll schedule the stress test and you can go home with the new prescriptions. I'd like to see you back in one week to review the stress test results and check how you're doing on the medications.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Sounds good. Thank you, doctor. I really appreciate you being so thorough with all of this.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "You're welcome. Remember, any chest pain at rest or worsening symptoms, go straight to the emergency room. We'll get through this together. The nurse will be in shortly to draw your blood.",
      delayMs: 2400,
    },
  ],
}
