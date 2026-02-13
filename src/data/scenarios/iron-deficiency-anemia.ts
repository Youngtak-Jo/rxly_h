import type { Scenario } from "./index"

export const ironDeficiencyAnemiaScenario: Scenario = {
  id: "iron-deficiency-anemia",
  name: "Iron Deficiency Anemia",
  nameKo: "철결핍성 빈혈",
  description:
    "수주간 어지러움, 피로감, 창백함으로 내원한 환자. 결막 창백 확인, CBC/철분검사를 통해 철결핍성 빈혈 진단 후 철분제 처방 및 원인 조사.",
  tags: ["hematology", "chronic", "diagnostic", "medication"],
  entries: [
    // — Opening & Chief Complaint —
    {
      rawSpeakerId: 0,
      text: "Good morning. What can I help you with today?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Doctor, I've been feeling really dizzy for the past few weeks. It happens when I stand up too quickly, and sometimes even when I'm just sitting at my desk. I almost fainted at work last week.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "That's concerning. Have you actually fainted or lost consciousness at any point?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "No, I haven't fully fainted, but I came very close. My vision went dark for a few seconds and I had to sit down and put my head between my knees. It scared me.",
      delayMs: 2200,
    },

    // — Symptom Exploration —
    {
      rawSpeakerId: 0,
      text: "Besides the dizziness, have you been feeling more tired than usual?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "Extremely tired. I used to go to the gym three times a week, but now I can barely get through a normal workday. Even climbing one flight of stairs leaves me out of breath, which has never happened before.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "Shortness of breath with minimal exertion is important. Have you noticed any heart palpitations, like your heart racing or pounding?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Actually, yes. Sometimes I can feel my heart beating really fast, especially when I'm lying in bed trying to sleep. It lasts a few minutes and then calms down.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "Any headaches, difficulty concentrating, or feeling cold more than usual?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "Yes to all three. I've had mild headaches almost daily. I can't focus at work, and my hands and feet are always cold. My nails have also become really brittle and they break easily.",
      delayMs: 2200,
    },

    // — Dietary & Menstrual History —
    {
      rawSpeakerId: 0,
      text: "Tell me about your diet. Are you vegetarian or vegan? Do you eat red meat?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "I've been mostly vegetarian for about a year now. I occasionally eat chicken but I've completely stopped eating red meat. I eat a lot of salads, rice, and pasta.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "And how are your menstrual periods? Have they been heavier or longer than usual?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "They've always been on the heavier side. I usually go through a super pad every two to three hours on the first two days. It lasts about seven days total. My mother was the same way.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "That is quite heavy. Do you pass any blood clots during your period?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, especially on the first and second day. Some of them are about the size of a large coin.",
      delayMs: 1400,
    },

    // — Physical Examination —
    {
      rawSpeakerId: 0,
      text: "Let me examine you. Your vitals show a heart rate of ninety-eight, which is a bit elevated, and blood pressure of one-oh-five over sixty-five, slightly on the low side. Let me check a few things.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "Can you pull down your lower eyelid for me? I want to check the color of your conjunctiva.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Sure, like this?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Perfect. Your conjunctivae are noticeably pale, which is a sign of anemia. Let me look at your hands. Your nail beds are pale as well, and I can see the brittleness you mentioned. Some of the nails have a slight concave shape, which we call koilonychia or spoon nails. This is quite characteristic of iron deficiency.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 0,
      text: "Your skin overall appears pale. Let me listen to your heart. I can hear a soft systolic flow murmur, which is common in anemia because the heart pumps harder to compensate for the reduced oxygen-carrying capacity.",
      delayMs: 2600,
    },

    // — Assessment & Diagnostic Plan —
    {
      rawSpeakerId: 0,
      text: "Everything points strongly toward iron deficiency anemia. The combination of fatigue, dizziness, exertional dyspnea, pallor, koilonychia, and your history of heavy periods and limited dietary iron makes me very confident in this direction. I want to order a complete blood count, iron studies including serum iron, ferritin, and total iron binding capacity, and a reticulocyte count.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "I've heard of anemia before, but I always thought it was minor. Is it serious?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "It can be if it's left untreated. Your body isn't carrying enough oxygen to your organs, which is why you're symptomatic. But once we confirm it and start treatment, it's very manageable.",
      delayMs: 2200,
    },

    // — Results Discussion —
    {
      rawSpeakerId: 0,
      text: "Your results are in. Your hemoglobin is eight point two, well below the normal range of twelve to sixteen for women. Your MCV is low at seventy-two, indicating small red blood cells, which is typical of iron deficiency. Your ferritin is only four, critically low. Normal is twenty to two hundred. Your serum iron is low and your TIBC is elevated, both confirming iron deficiency anemia.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "Eight point two? That sounds really low. Is that dangerous?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "It's significantly below normal and explains all your symptoms. With a hemoglobin this low, your heart is working overtime to circulate oxygen. If it had dropped much further, we might have considered a blood transfusion. Thankfully, we caught it at a level we can treat with iron supplementation.",
      delayMs: 3000,
    },

    // — Treatment Plan —
    {
      rawSpeakerId: 0,
      text: "I'm prescribing ferrous sulfate, three hundred twenty-five milligrams, taken twice daily. Take it on an empty stomach if you can tolerate it, and take it with vitamin C or orange juice, which significantly improves iron absorption. Avoid taking it with coffee, tea, milk, or calcium supplements as those block absorption.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Are there any side effects?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "The most common side effects are stomach upset, constipation, and dark or black stools. The dark stools are normal and expected. If the stomach upset is too much on an empty stomach, you can take it with a small amount of food, though absorption will be slightly reduced.",
      delayMs: 2800,
    },

    // — Addressing the Root Cause —
    {
      rawSpeakerId: 0,
      text: "We also need to address the underlying causes. Your heavy menstrual bleeding is likely the primary driver. I'd like to refer you to gynecology to discuss options for managing that, whether it's hormonal therapy or other approaches. And I'd strongly encourage adding iron-rich foods back to your diet. Lentils, spinach, fortified cereals, and tofu are good vegetarian sources.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "I'll definitely try to add more of those foods. How long until I feel better?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "You should start noticing improvement in energy within one to two weeks. Your hemoglobin should rise by about one gram per month with proper supplementation. I'll recheck your blood work in six to eight weeks. You'll need to continue the iron supplements for at least three to six months to fully replenish your stores even after your hemoglobin normalizes.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "That's a relief. Thank you for taking this seriously, doctor. I was starting to think I was just being lazy or something.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Not at all. With a hemoglobin of eight point two, it's remarkable you were still working and functioning as well as you were. Your body has been compensating heroically. We'll get your iron levels back up and you'll feel like a different person. I'll see you in six weeks for follow-up labs. And please see gynecology soon about the heavy periods.",
      delayMs: 3200,
    },
  ],
}
