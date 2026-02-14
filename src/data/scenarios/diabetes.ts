import type { Scenario } from "./index"

export const diabetesScenario: Scenario = {
  id: "diabetes",
  name: "Type 2 Diabetes Management",
  description:
    "Poorly controlled diabetic follow-up with HbA1c 8.2%. Medication escalation, complication screening, and lifestyle counseling.",
  tags: ["chronic", "endocrine", "medication-adjustment", "lifestyle"],
  entries: [
    // — Opening —
    {
      rawSpeakerId: 0,
      text: "Good afternoon. How have you been since your last visit three months ago?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Hi, doctor. Honestly, not great. I've been trying to watch what I eat but my sugar numbers are still all over the place.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "I see. Let me pull up your lab results from last week. Your fasting glucose came back at one eighty and your HbA1c is at eight point two percent. That's up from seven point six three months ago.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "That's worse than I thought. I was hoping it would at least stay the same.",
      delayMs: 1800,
    },

    // — Current Medication Review —
    {
      rawSpeakerId: 0,
      text: "Let's review your current medications. You're on metformin five hundred milligrams twice daily, correct?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Yes. I take it with breakfast and dinner. I've been pretty consistent with it, maybe missed a dose once or twice a month.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "How are you tolerating the metformin? Any GI issues like nausea, diarrhea, or stomach cramping?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "A little bit of stomach upset in the first few weeks, but it's mostly settled now. Occasionally I get some bloating after a heavy meal.",
      delayMs: 2200,
    },

    // — Blood Sugar Patterns —
    {
      rawSpeakerId: 0,
      text: "Are you checking your blood sugar at home? Can you tell me what your typical readings look like?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "I check it in the morning most days. My fasting readings are usually between one sixty and one ninety. After meals, I've seen it go up to two fifty or even two seventy sometimes, especially after dinner.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "Those post-meal spikes are concerning. Our goal for fasting is under one thirty, and post-meal ideally under one eighty. Have you experienced any episodes of low blood sugar? Shakiness, sweating, feeling faint?",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "No, nothing like that. If anything, I feel tired and sluggish when it's high. I get very thirsty and I'm going to the bathroom a lot, especially at night.",
      delayMs: 2400,
    },

    // — Diet Assessment —
    {
      rawSpeakerId: 0,
      text: "Let's talk about your diet. Walk me through a typical day of eating.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "For breakfast I usually have toast with butter and coffee with sugar. Lunch is often whatever is available at work, so maybe a sandwich or sometimes fast food. Dinner is the big meal. My wife cooks, and we usually have rice, some meat, and vegetables. But I'll admit we have white rice with every meal.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 0,
      text: "White rice has a high glycemic index, meaning it can spike your blood sugar quickly. Have you tried switching to brown rice or cauliflower rice? Even mixing half and half would help. And how much sugar in the coffee?",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "Two spoonfuls usually. I've cut down from three. I haven't tried brown rice yet, my wife says it takes longer to cook. I also have a sweet tooth. I usually have some cookies or ice cream after dinner.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "Those after-dinner sweets would explain the high post-meal readings, especially on top of the white rice. I know it's hard, but reducing those desserts or switching to lower sugar alternatives would make a real difference. Even fresh fruit would be much better.",
      delayMs: 2800,
    },

    // — Exercise Assessment —
    {
      rawSpeakerId: 0,
      text: "How about physical activity? Are you exercising regularly?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Not really. I work a desk job and by the time I get home I'm exhausted. I walk to the parking lot and back, that's about it. On weekends I might do some light yard work.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "Exercise is one of the most effective ways to improve insulin sensitivity and lower blood sugar. Even a fifteen-minute walk after dinner can significantly reduce those post-meal spikes. Could you start there?",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "I think I could manage that. My wife has been wanting us to walk in the evenings anyway.",
      delayMs: 1800,
    },

    // — Complication Screening —
    {
      rawSpeakerId: 0,
      text: "Good. Now I need to check on a few things related to diabetes complications. How are your feet doing? Any numbness, tingling, or burning sensation?",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "Actually, yes. I've been getting this tingling sensation in my toes, especially at night. It's been going on for a couple of months. I thought it was just from sitting too long at work.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "That tingling could be early diabetic neuropathy, which is nerve damage from prolonged high blood sugars. Let me take a look at your feet. I'm going to use this monofilament to test the sensation. Tell me when you feel it.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "I feel it there. And there. Hmm, I don't feel that one.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "You have decreased sensation at a couple of points on your right foot. This is consistent with early peripheral neuropathy. It's very important that you inspect your feet daily for any cuts, blisters, or sores, because you might not feel an injury.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "That's concerning. I did have a small cut on my foot a few weeks ago that took a long time to heal. Maybe two or three weeks.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "Delayed wound healing is another sign of poorly controlled diabetes. This really underscores why we need to get your blood sugars under better control. Have you had any changes in your vision?",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "My vision has been a little blurry on and off. I assumed I just need a new glasses prescription.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Blurry vision can be from high blood sugars affecting the lens, but it can also be a sign of diabetic retinopathy. When was your last dilated eye exam?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 1,
      text: "It's been over a year. I keep putting it off.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "We need to get that scheduled soon. I'll put in a referral to ophthalmology. A dilated eye exam is recommended at least once a year for diabetic patients.",
      delayMs: 2200,
    },

    // — Kidney Function —
    {
      rawSpeakerId: 0,
      text: "Your kidney function labs show your creatinine is still in the normal range, which is good, but your urine microalbumin is slightly elevated. That can be an early sign of diabetic kidney disease. Another reason to get the blood sugar controlled.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "I didn't know diabetes could affect the kidneys too. This is all a bit overwhelming.",
      delayMs: 1800,
    },

    // — Medication Adjustment —
    {
      rawSpeakerId: 0,
      text: "I understand it's a lot to take in. The good news is all of these complications are in early stages and can be slowed down or even reversed with better blood sugar control. Here's what I'd like to do with your medications. First, I want to increase your metformin to one thousand milligrams twice daily.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Will that cause more stomach problems?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "It might temporarily. I recommend increasing gradually. Go to seven fifty twice daily for two weeks, then up to one thousand. Always take it with food. If the GI symptoms are unbearable, we can switch to the extended-release form.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "Additionally, I want to add a second medication called empagliflozin, also known as Jardiance. It's an SGLT2 inhibitor. It works by causing the kidneys to excrete excess glucose through the urine. It has the added benefit of protecting the kidneys and the heart.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Does that have any side effects?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "The most common side effect is increased urination and an increased risk of urinary tract infections and yeast infections, because there's more sugar in the urine. Staying well hydrated and maintaining good hygiene can help prevent that. Rarely, it can cause a condition called diabetic ketoacidosis, so if you feel very sick, nauseated, or have difficulty breathing, seek medical attention immediately.",
      delayMs: 3400,
    },

    // — Plan Summary —
    {
      rawSpeakerId: 1,
      text: "Okay. So more metformin and this new Jardiance. Anything else?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "I also want you to check your blood sugar more often. Fasting every morning and two hours after your biggest meal. Keep a log and bring it to your next visit. Regarding your diet, try to reduce white rice portions, cut back on sweets after dinner, and switch to water or unsweetened beverages.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 0,
      text: "For exercise, start with a fifteen-minute walk after dinner and try to gradually increase to thirty minutes of moderate activity most days of the week. And please do the daily foot inspections, wearing proper fitting shoes, and never walk barefoot.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "I'll do my best. It's a lot of changes but I understand it's important. When should I come back?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "I'd like to see you in six weeks. We'll repeat the fasting glucose and check how you're tolerating the medication changes. The HbA1c we'll recheck in three months. I'm also ordering the ophthalmology referral and I want you to get a lipid panel since we should check your cholesterol as well. Any questions?",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "No, I think I understand. Thank you for explaining everything so clearly. I'll try to make those changes starting today.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "You're welcome. Remember, even small changes add up. You don't have to be perfect, just consistent. And if you have any concerns about the new medication or your blood sugars, don't hesitate to call the office. Take care.",
      delayMs: 2600,
    },
  ],
}
