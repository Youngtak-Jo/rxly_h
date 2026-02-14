import type { Scenario } from "./index"

export const pediatricFeverScenario: Scenario = {
  id: "pediatric-fever",
  name: "Pediatric Fever Evaluation",
  description:
    "3-year-old with 3 days of persistent high fever. Doctor-parent conversation leading to strep pharyngitis diagnosis and antibiotic decision.",
  tags: ["pediatrics", "acute", "infection", "parent-counseling"],
  entries: [
    // — Opening —
    {
      rawSpeakerId: 0,
      text: "Hi there. I see you've brought your little one in for a fever. What's his name and how old is he?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "His name is Ethan. He just turned three last month. He's had a fever for three days now and it keeps coming back even with Tylenol.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "Three days of fever is understandably concerning. What's the highest temperature you've measured?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Last night it went up to thirty-nine point two. I've been giving him children's Tylenol every six hours, but it only brings it down to about thirty-eight for a couple of hours, then it goes right back up.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "And you're measuring with a thermometer under the arm or in the ear?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "I use the ear thermometer. It's been consistently between thirty-eight point five and thirty-nine point two for the past three days.",
      delayMs: 2000,
    },

    // — Associated Symptoms —
    {
      rawSpeakerId: 0,
      text: "Has he been having any other symptoms? Cough, runny nose, sore throat, ear pulling?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "He's had a runny nose for about a week, just clear stuff at first. But the last two days he's been complaining that his throat hurts. He points to his neck and says it hurts to swallow. He's had a dry cough too, but not very frequent.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "Any vomiting or diarrhea?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "He threw up once yesterday afternoon, but I think that was because he coughed really hard. No diarrhea.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Any rash anywhere on his body?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "No, I've been checking. No rash that I can see.",
      delayMs: 1400,
    },

    // — Intake & Activity —
    {
      rawSpeakerId: 0,
      text: "How's his appetite been? Is he drinking fluids?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "His appetite is way down. He barely ate anything yesterday. He's drinking, but not as much as usual. I've been pushing juice and popsicles to get fluids in him.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "How about his urine output? Is he having wet diapers or going to the bathroom regularly?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "He's potty-trained now, and he's been going maybe three or four times a day. Usually he goes more often. The urine looks a little darker than normal.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "That slightly reduced output and darker urine could mean he's a bit dehydrated from the fever and not drinking enough. How's his energy level?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "He's more tired than usual, but he's still playing a little. When the fever comes down with the Tylenol, he perks up and acts more like himself. When the fever is high, he just wants to lie on the couch.",
      delayMs: 2600,
    },

    // — Exposure & History —
    {
      rawSpeakerId: 0,
      text: "Is he in daycare or preschool? Has anyone else at home or in his class been sick?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "He goes to daycare four days a week. They sent a notice last week that there were several cases of strep going around. Two of his close friends have been out sick.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "That's very helpful information. Is Ethan up to date on all his vaccinations?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, he's had everything on schedule. He just had his three-year well check last month and they said he was all caught up.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Any allergies to medications?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "No known allergies.",
      delayMs: 800,
    },

    // — Physical Exam —
    {
      rawSpeakerId: 0,
      text: "Alright, let me examine him. Hey buddy, I'm going to look in your ears and your mouth, okay? Can you open wide for me? Good job.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "His temperature right now is thirty-eight point eight. Ears look clear, no signs of an ear infection. His throat, however, is quite red and I can see some white patches on the tonsils. The tonsils are swollen. I'm also feeling some enlarged, tender lymph nodes on both sides of his neck.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Is that strep throat?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "The presentation is very suggestive of strep pharyngitis, especially with the exposure at daycare, the throat findings, the fever pattern, and the absence of cough, which actually makes strep more likely. Let me do a rapid strep test to confirm.",
      delayMs: 2800,
    },

    // — Test Results —
    {
      rawSpeakerId: 0,
      text: "The rapid strep test came back positive. So we can confirm this is a Group A streptococcal pharyngitis, which is strep throat.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 1,
      text: "Does he need antibiotics?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Yes, for confirmed strep throat we do recommend antibiotic treatment. The first-line treatment is amoxicillin. For Ethan's weight, the dose would be two hundred and fifty milligrams twice daily for ten days. It comes in a liquid form that's usually flavored and most kids tolerate it well.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Why ten days? I've heard some infections only need a shorter course.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "For strep specifically, the full ten-day course is important to completely eradicate the bacteria and prevent complications like rheumatic fever, which can affect the heart. Even when he starts feeling better in two to three days, it's very important to finish all ten days of the antibiotic.",
      delayMs: 2800,
    },

    // — Symptom Management —
    {
      rawSpeakerId: 0,
      text: "For symptom relief, continue the children's Tylenol every four to six hours as needed for fever or pain. You can also alternate with children's ibuprofen every six to eight hours if the Tylenol alone isn't enough. Make sure to use the correct dosing syringe for his weight.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Can I give both at the same time?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "You can alternate them, but don't give both at exactly the same time. For example, give Tylenol now, then three hours later give ibuprofen, then three hours later Tylenol again. This way there's always something working on the fever.",
      delayMs: 2400,
    },

    // — Hydration & Diet —
    {
      rawSpeakerId: 0,
      text: "The most important thing right now is keeping him hydrated. Popsicles are a great idea. Cold or cool liquids may actually feel soothing on his sore throat. Small frequent sips are better than trying to get him to drink a lot at once. Avoid citrus juices as they might sting his throat.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "What about food? He's barely eating.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "That's very common with sore throats. Don't force it. Soft, bland foods like yogurt, applesauce, mashed potatoes, or soup are good options. His appetite should improve as the antibiotics start working, usually within forty-eight hours.",
      delayMs: 2400,
    },

    // — Contagion & Return to Daycare —
    {
      rawSpeakerId: 1,
      text: "When can he go back to daycare?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "He needs to be on the antibiotic for at least twenty-four hours and be fever-free without fever-reducing medication for twenty-four hours before returning to daycare. That usually means at least two to three days at home.",
      delayMs: 2400,
    },

    // — Warning Signs —
    {
      rawSpeakerId: 0,
      text: "Now, I want to go over some warning signs that would mean you should bring him back or go to the emergency room. If his fever goes above forty degrees or doesn't respond to medication at all, if he stops drinking fluids and has no wet diaper or urination for six hours or more, if he has difficulty breathing or is drooling excessively because he can't swallow, or if he develops a widespread rash, please seek care immediately.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "Got it. What about the rest of our family? My daughter is five. Should she be tested?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "If she develops symptoms like a sore throat and fever, then yes, bring her in for testing. We don't routinely test asymptomatic household contacts unless there are special circumstances. Good hand hygiene and not sharing utensils or cups will help prevent spread.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Thank you so much, doctor. I was really worried, especially with the fever lasting so long. I feel better knowing what it is.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "You're welcome. You did the right thing bringing him in. Strep throat responds very well to antibiotics. You should see improvement within forty-eight hours. I'll send the prescription to your pharmacy. Call us if he's not improving after two days on the antibiotic. Take care of your little guy.",
      delayMs: 2800,
    },
  ],
}
