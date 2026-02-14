import type { Scenario } from "./index"

export const migraineScenario: Scenario = {
  id: "migraine",
  name: "Migraine Diagnosis",
  description:
    "2-week unilateral headache with hypertension history and positive family history. Neurological exam, MRI, and triptan prescription.",
  tags: ["neurology", "new-diagnosis", "imaging", "medication"],
  entries: [
    // — Opening & Chief Complaint —
    {
      rawSpeakerId: 0,
      text: "Good morning. Please have a seat. What brings you in today?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Hi, doctor. I've been having this persistent headache for about two weeks now. It's mostly on the right side and it comes and goes throughout the day.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "Two weeks is quite a while. Can you describe the pain for me? Is it throbbing, sharp, or more of a dull pressure?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "It's mostly a throbbing kind of pain. Sometimes it gets really bad and I feel nauseous. The light bothers me too when it's at its worst.",
      delayMs: 2500,
    },

    // — Characterizing the headache —
    {
      rawSpeakerId: 0,
      text: "On a scale of one to ten, how would you rate the pain at its worst?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "At its worst, probably a seven or eight. There were two days last week where I couldn't even go to work because of it.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "And how long does each episode typically last?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "Usually four to six hours. Sometimes it lasts almost the entire day if I don't take anything for it. I've noticed it tends to start in the late morning.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "Those symptoms you're describing, the unilateral throbbing, nausea, and photophobia, those are fairly characteristic of migraines. Have you ever been diagnosed with migraines before?",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "No, never. I used to get occasional tension headaches but nothing like this. My mother gets migraines though. She's had them since she was in her twenties.",
      delayMs: 2400,
    },

    // — Family & Social History —
    {
      rawSpeakerId: 0,
      text: "Family history of migraines is significant. That does increase your likelihood. Any other family members with headaches or neurological conditions?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "Not that I know of. My father has high blood pressure and type 2 diabetes, but no headache issues.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Good to know. And how about your lifestyle? How much sleep are you getting? Any major stressors?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "I've been under a lot of stress at work lately. We had layoffs and I've been picking up extra responsibilities. I'm only sleeping about five hours a night, sometimes less. I drink about three to four cups of coffee a day to keep going.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 0,
      text: "That's a lot of caffeine and very little sleep. Both of those are well-known migraine triggers. Are you eating regularly? Skipping meals can also be a trigger.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "Honestly, I've been skipping breakfast most days and sometimes I don't eat until two or three in the afternoon. I know it's not great.",
      delayMs: 2000,
    },

    // — Medication History —
    {
      rawSpeakerId: 0,
      text: "Are you currently taking any medications or supplements?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "I take lisinopril for blood pressure, ten milligrams daily. And I've been taking ibuprofen for the headaches, usually about four hundred milligrams, sometimes two or three times a day.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "How often have you been taking the ibuprofen? Every day for the past two weeks?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Pretty much, yes. At least once a day, sometimes more. It helps a little but the headache always comes back.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "I'd actually recommend being very careful with that. Taking ibuprofen that frequently can lead to medication overuse headaches, sometimes called rebound headaches. It's a cycle where the pain reliever itself starts contributing to the headache pattern.",
      delayMs: 2800,
    },

    // — Blood Pressure & Red Flags —
    {
      rawSpeakerId: 1,
      text: "Oh, I had no idea. My last blood pressure reading at the pharmacy was one forty over ninety. I know it's a bit high.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "That is above target, especially while on lisinopril. The poor sleep, stress, caffeine, and irregular eating could all be contributing to both the elevated blood pressure and the headaches. Have you noticed any visual changes, numbness, or weakness anywhere?",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "No numbness or weakness. But I have noticed some blurry vision a couple of times when the headache is really bad. It goes away when the headache eases up.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "Any aura symptoms? Flashing lights, zigzag lines, or blind spots before the headache starts?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Now that you mention it, I did see some flickering lights in my peripheral vision once or twice. I thought it was just from staring at the computer screen too long.",
      delayMs: 2400,
    },

    // — Neurological Exam —
    {
      rawSpeakerId: 0,
      text: "That could be a visual aura, which is actually common with migraines. Let me do a quick neurological exam. I'm going to check your cranial nerves, reflexes, and coordination. Can you follow my finger with your eyes?",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Sure.",
      delayMs: 600,
    },
    {
      rawSpeakerId: 0,
      text: "Good, eye movements are normal. Now squeeze my fingers with both hands. Good, grip strength is equal bilaterally. I'm going to tap your reflexes now. Can you touch your nose and then my finger? Good. Everything looks neurologically intact.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 0,
      text: "Let me check your blood pressure. I'm getting one forty-two over eighty-eight. That's consistently elevated. I'd like to take it again at the end of our visit.",
      delayMs: 2200,
    },

    // — Assessment & Plan —
    {
      rawSpeakerId: 0,
      text: "Okay, let me summarize. Given the elevated blood pressure, the visual symptoms including possible aura, and the severity and pattern of the headaches, I'd like to do a few things. First, I want to order some basic blood work including a complete metabolic panel and CBC. Second, I think we should schedule an MRI of the brain just to rule out anything structural.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "An MRI? Is that really necessary? That sounds a bit scary.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "It's really just a precautionary measure. With new onset significant headaches and visual changes in an adult, it's good practice to get imaging to make sure everything looks normal. The vast majority of the time, it comes back completely normal and we can move forward with confidence.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, I understand. What about treatment for the headaches in the meantime?",
      delayMs: 1600,
    },

    // — Medication Plan —
    {
      rawSpeakerId: 0,
      text: "I'd like to start you on sumatriptan, which is a specific migraine medication called a triptan. You'd take fifty milligrams at the onset of a headache. It works by constricting the blood vessels and blocking pain pathways in the brain. It's much more targeted than ibuprofen for migraines.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Are there any side effects I should watch out for?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Some people experience a warm or tingling sensation, mild chest tightness, or drowsiness. These are usually brief. If you feel any significant chest pain or severe tightness, stop taking it and come in right away or go to the ER. Also important, don't take more than two doses in twenty-four hours.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 0,
      text: "I also want you to taper off the daily ibuprofen. You can use it occasionally, but no more than two days per week to avoid the rebound effect. For your blood pressure, I'd like to increase the lisinopril to twenty milligrams daily.",
      delayMs: 2800,
    },

    // — Lifestyle Modifications —
    {
      rawSpeakerId: 1,
      text: "That all makes sense. Is there anything else I can do besides the medication?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Absolutely. Lifestyle modifications are actually crucial for migraine management. I'd recommend aiming for seven to eight hours of sleep per night with a consistent schedule. Try to cut the caffeine down to no more than two cups per day, and do it gradually to avoid withdrawal headaches.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 0,
      text: "Regular meals are important. Don't skip breakfast. Stay well hydrated, at least eight glasses of water a day. Regular moderate exercise like thirty minutes of walking five days a week can also help both the migraines and the blood pressure.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "I'll try my best with the lifestyle changes. Should I keep a headache diary or anything like that?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Yes, that's an excellent idea. Track when the headaches occur, how long they last, what you were doing before, what you ate, how much sleep you got, and how the sumatriptan works. Also note any triggers you identify. We'll review that diary at your follow-up.",
      delayMs: 3000,
    },

    // — Follow-up Planning —
    {
      rawSpeakerId: 0,
      text: "I'd like to see you back in four weeks. By then we should have the MRI and blood work results. We'll review your headache diary, check the blood pressure on the higher dose of lisinopril, and see how the sumatriptan is working. If the migraines are still frequent, we may discuss a preventive medication.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "What kind of preventive medication?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "There are several options. Beta-blockers like propranolol, which would also help your blood pressure. Topiramate is another option. We'd only go that route if you're having four or more migraine days per month despite the acute treatment and lifestyle changes.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "That's very helpful. Thank you for being so thorough about this, doctor. I was really worried it might be something more serious.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "That's completely understandable. The good news is that your neurological exam is normal, which is very reassuring. We're being thorough with the MRI just to be safe. I'll have the front desk schedule the MRI and the blood work, and book your follow-up in four weeks. Do you have any other questions?",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "No, I think that covers everything. I'll start the headache diary tonight. Thank you, doctor.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "You're welcome. And remember, if the headaches suddenly get much worse, or you develop any new symptoms like weakness, speech difficulty, or the worst headache of your life, go to the emergency room immediately. Take care.",
      delayMs: 2800,
    },
  ],
}
