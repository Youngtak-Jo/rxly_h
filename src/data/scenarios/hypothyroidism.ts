import type { Scenario } from "./index"

export const hypothyroidismScenario: Scenario = {
  id: "hypothyroidism",
  name: "Hypothyroidism",
  description:
    "Months of fatigue, weight gain, and cold sensitivity. Thyroid palpation, TSH/T4 testing leading to hypothyroidism diagnosis and levothyroxine initiation.",
  tags: ["endocrine", "chronic", "new-diagnosis", "medication"],
  entries: [
    // — Opening & Chief Complaint —
    {
      rawSpeakerId: 0,
      text: "Good afternoon. What brings you in to see me today?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Hi doctor. I've been feeling really tired for the last three or four months. No matter how much I sleep, I wake up feeling exhausted. I thought it was just stress at first, but it's not getting better.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "That sounds frustrating. How many hours of sleep are you getting at night?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "I'm sleeping eight to nine hours, sometimes even ten on weekends. But I still feel like I need a nap by the afternoon. My energy is just completely gone.",
      delayMs: 2200,
    },

    // — Symptom Exploration —
    {
      rawSpeakerId: 0,
      text: "Have you noticed any other changes? Anything with your weight, skin, hair, or mood?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Actually yes. I've gained about five kilograms in the last three months without changing my diet or exercise. My skin has been really dry, especially on my elbows and shins. And my hair seems thinner, I'm losing more in the shower than usual.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "What about sensitivity to cold? Do you feel colder than people around you?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, that's actually something my husband keeps pointing out. I'm always wearing layers and turning up the heat when everyone else is fine. My hands and feet are constantly cold.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "How about your bowel movements? Any constipation?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Now that you mention it, yes. I used to go every day, but lately it's every two or three days. I just assumed it was my diet.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "And how's your mood been? Any feelings of depression, difficulty concentrating, or brain fog?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "I wouldn't say depressed, but I do feel sort of flat. Like I don't have the motivation I used to. And yes, my concentration at work has been terrible. I keep forgetting things and I have to read emails two or three times to process them.",
      delayMs: 2800,
    },

    // — Medical History —
    {
      rawSpeakerId: 0,
      text: "These symptoms together are painting a very specific picture. Let me ask about your medical history. Any thyroid problems in your family?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "My mother takes thyroid medication. She's been on it for years. And my aunt had her thyroid removed, though I'm not sure why. Is that related?",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "It could be very related. Thyroid conditions often run in families. Any personal history of autoimmune diseases like type 1 diabetes, rheumatoid arthritis, or celiac disease?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 1,
      text: "No, nothing like that. I'm generally healthy. I take a multivitamin and that's it. No other medications.",
      delayMs: 1600,
    },

    // — Menstrual History —
    {
      rawSpeakerId: 0,
      text: "Have your periods changed at all recently? Heavier, longer, or more irregular?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "They've been heavier than usual. My cycle used to be very regular, twenty-eight days. Now it's more like thirty-five days and the bleeding lasts seven or eight days instead of five.",
      delayMs: 2400,
    },

    // — Physical Examination —
    {
      rawSpeakerId: 0,
      text: "Let me examine you. I'm going to check your thyroid first. Can you swallow for me while I palpate your neck?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Sure.",
      delayMs: 600,
    },
    {
      rawSpeakerId: 0,
      text: "I can feel that your thyroid is slightly enlarged and has a firm texture, but I don't feel any distinct nodules. Your skin is noticeably dry, and I can see some puffiness around your eyes. Your reflexes are a bit sluggish, particularly the ankle reflex. Your heart rate is fifty-eight, which is on the slower side.",
      delayMs: 3200,
    },

    // — Assessment —
    {
      rawSpeakerId: 0,
      text: "Based on everything you're telling me and what I'm finding on exam, I strongly suspect hypothyroidism, meaning your thyroid gland is underactive and not producing enough thyroid hormone. This would explain all of your symptoms: the fatigue, weight gain, cold intolerance, dry skin, hair thinning, constipation, cognitive changes, and menstrual irregularity.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "That actually makes a lot of sense. My mother said the same thing when I described how I was feeling. What test do we need to confirm it?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "I'm going to order a TSH level, which is the most sensitive test for thyroid function. I'll also check free T4, thyroid peroxidase antibodies to see if it's autoimmune, and a lipid panel because hypothyroidism can raise cholesterol. We'll also do a CBC to check for anemia given your heavy periods.",
      delayMs: 3000,
    },

    // — Results Discussion —
    {
      rawSpeakerId: 0,
      text: "Your lab results are back. Your TSH is twelve point four, which is significantly elevated. Normal is between zero point four and four point zero. Your free T4 is low at zero point six, confirming hypothyroidism. Your TPO antibodies are strongly positive, which tells us this is Hashimoto's thyroiditis, the most common cause of hypothyroidism.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "Hashimoto's? Is that serious? Is it treatable?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "It's an autoimmune condition where your immune system gradually attacks the thyroid gland. The good news is it's very treatable. You'll need to take thyroid hormone replacement, and most patients feel significantly better within a few weeks of starting treatment.",
      delayMs: 2800,
    },

    // — Treatment Plan —
    {
      rawSpeakerId: 0,
      text: "I'm starting you on levothyroxine, fifty micrograms daily. Take it first thing in the morning on an empty stomach with water, at least thirty to sixty minutes before eating or taking any other supplements. This is important for proper absorption.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Will I need to take this for the rest of my life?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "In most cases with Hashimoto's, yes. But it's a very safe medication with virtually no side effects when dosed correctly, because it's simply replacing what your body should be making naturally. We'll recheck your TSH in six to eight weeks and adjust the dose as needed until we find the right level for you.",
      delayMs: 3000,
    },

    // — Follow-up —
    {
      rawSpeakerId: 1,
      text: "How soon will I start feeling better?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Most patients notice improvement in energy and mood within two to three weeks. The weight, hair, and skin changes take longer, sometimes two to three months. Be patient with the process. I'll see you back in six weeks for repeat labs, and we'll adjust from there.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Thank you, doctor. I'm actually relieved to know there's a reason for all of this and that it's fixable.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Absolutely. And also, your cholesterol was mildly elevated at two thirty-two, which often improves once the thyroid is treated. We'll recheck that in three months. If you notice any heart palpitations, tremor, or excessive sweating after starting the medication, let me know as those could mean the dose is too high. See you in six weeks.",
      delayMs: 3200,
    },
  ],
}
