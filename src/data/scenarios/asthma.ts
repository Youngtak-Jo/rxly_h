import type { Scenario } from "./index"

export const asthmaScenario: Scenario = {
  id: "asthma",
  name: "Asthma Exacerbation",
  description:
    "25-year-old with worsening wheezing, dyspnea, and nocturnal cough over 1 week. Known mild intermittent asthma with poor compliance. Peak flow assessment, nebulizer treatment, and step-up therapy with ICS/LABA.",
  tags: ["pulmonology", "chronic", "urgent", "medication"],
  entries: [
    // — Opening & Chief Complaint —
    {
      rawSpeakerId: 0,
      text: "Good morning, come on in and have a seat. I'm Dr. Lawson. What brings you in today?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Hi, doctor. I've been having a really rough week. My breathing has been getting worse and worse, and I'm wheezing a lot, especially at night.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "I'm sorry to hear that. Can you tell me more about when this started and what you've been experiencing?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "It started about a week ago. At first it was just a little tightness in my chest, but then the wheezing started and now I'm coughing a lot at night. It's been waking me up almost every night.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "How many nights this past week would you say you've woken up because of coughing or difficulty breathing?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "At least three or four. Last night was the worst. I woke up around two in the morning gasping and coughing and couldn't get back to sleep for over an hour.",
      delayMs: 2400,
    },

    // — History of Present Illness —
    {
      rawSpeakerId: 0,
      text: "That sounds very uncomfortable. Has anything in particular seemed to trigger these episodes? Any changes in your environment or routine?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "Well, my apartment building has been doing renovations. There's been a lot of dust and construction work on the floor below me for the past two weeks. And it's been really cold out, so the cold air seems to make it worse when I walk to work.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 0,
      text: "Those are both classic asthma triggers. Have you noticed it getting worse with exercise or physical activity as well?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, actually. I usually jog a few times a week and I've had to completely stop. Even walking up the stairs to my third-floor apartment leaves me out of breath and wheezing.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "Are you using a rescue inhaler? And if so, how often have you been reaching for it this past week?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "I have an albuterol inhaler. I've been using it a lot more than usual. Probably four or five times a day, sometimes more. Before this week I was only using it maybe once or twice a week.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "It helps for maybe an hour or two, but then the tightness and wheezing come right back. It used to last much longer. Honestly, it's getting frustrating because it feels like it's barely doing anything anymore.",
      delayMs: 2800,
    },

    // — Asthma History —
    {
      rawSpeakerId: 0,
      text: "I understand that's frustrating. Let's talk about your asthma history. When were you first diagnosed?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "I was about twelve. My pediatrician diagnosed it after I kept getting these wheezing episodes during soccer season. They said it was mild intermittent asthma.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "And what medications have you been prescribed for it over the years?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "Mostly just the albuterol rescue inhaler. A doctor a few years ago tried to put me on a daily inhaler, fluticasone I think, but I never really stuck with it. I felt fine most of the time so I didn't see the point. I used it for maybe a month and then stopped.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 0,
      text: "Have you ever been hospitalized for asthma, or had to go to the emergency room for an attack?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "No, never hospitalized. I went to urgent care once about six months ago when it flared up. They gave me a nebulizer treatment and a short course of prednisone and I felt better in a couple of days.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "Have you ever been intubated or put on a ventilator?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "No, never.",
      delayMs: 600,
    },

    // — Allergy & Environmental History —
    {
      rawSpeakerId: 0,
      text: "Good. Now let me ask about allergies. Do you have any known allergies, either to medications or environmental allergens?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "No medication allergies. But I do have allergic rhinitis. I get really congested in the spring and fall, and dust definitely sets me off. I was tested years ago and they said I was allergic to dust mites and some tree pollen.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "Do you have any pets at home?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, I have a cat. I've had her for about three years. She sleeps in my bedroom. Do you think that could be part of the problem?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "It's definitely possible. Cat dander is a very common asthma trigger, and combined with the construction dust from your building renovation, your airways have likely been dealing with a lot of irritation. Do you have carpet in your apartment?",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, wall-to-wall carpet in the bedroom and living room. I vacuum maybe once a week.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Do you smoke or are you exposed to secondhand smoke?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "No, I've never smoked. But my roommate vapes inside occasionally when it's cold.",
      delayMs: 1400,
    },

    // — Review of Systems —
    {
      rawSpeakerId: 0,
      text: "Have you had any fever, chills, or night sweats?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "No fever. I've been checking.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Any coughing up colored or bloody sputum? Is the mucus clear, yellow, or green?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "It's mostly a dry cough. Sometimes there's a little clear mucus but nothing colored and definitely no blood.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Any heartburn or acid reflux? Sore throat, sinus pressure, or postnasal drip?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "No heartburn. A little bit of postnasal drip and my nose has been stuffy, but no sore throat.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Any recent weight loss, fatigue, or body aches?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "I've been tired because I'm not sleeping well from the coughing, but no weight loss or body aches.",
      delayMs: 1800,
    },

    // — Physical Examination —
    {
      rawSpeakerId: 0,
      text: "Alright, let me examine you now. I'll start with your vital signs. Your temperature is thirty-seven point one, so no fever. Heart rate is one hundred and two, which is a bit elevated. Blood pressure is one twenty-four over seventy-eight. Respiratory rate is twenty. And your oxygen saturation is ninety-four percent on room air.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Is the oxygen level okay? Ninety-four sounds low.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Normal is typically ninety-five percent or above, so yours is slightly below normal. It tells me your airways are narrowed enough to affect oxygen exchange. Let me listen to your lungs now. Take some slow, deep breaths.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "I can hear diffuse expiratory wheezing throughout both lung fields. It's more prominent when you exhale. I don't hear any crackles or rales, which is a good sign. The air movement is fair, and I'm not seeing you use your neck or shoulder muscles to breathe, which means you're not in severe distress.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 0,
      text: "Let me check your peak flow now. Take the deepest breath you can and blow out as hard and fast as possible into this device.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Your peak flow reading is three hundred and twenty-five liters per minute. Based on your age, height, and sex, your predicted value should be around five hundred. That puts you at about sixty-five percent of predicted, which is in the moderate obstruction range.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Is that bad?",
      delayMs: 600,
    },
    {
      rawSpeakerId: 0,
      text: "It means your airways are significantly narrowed right now. Above eighty percent is where we consider it well-controlled. Below fifty would be severe. You're in the yellow zone, so we need to act on this today.",
      delayMs: 2600,
    },

    // — Acute Treatment —
    {
      rawSpeakerId: 0,
      text: "What I'd like to do first is give you a nebulizer treatment right here in the office. We'll use albuterol through a nebulizer, which delivers a much larger dose than your handheld inhaler and gets deeper into your airways. After that, we'll recheck your peak flow and oxygen to see how you respond.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Okay. I've had that before at urgent care.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Good. The nurse will set that up. It takes about ten to fifteen minutes. Just breathe normally through the mouthpiece.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Alright, the nebulizer treatment is done. How are you feeling now compared to before?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Actually, a lot better. My chest feels more open and the wheezing has calmed down quite a bit. I can take a deeper breath now.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "Great, I can hear that too. The wheezing is significantly reduced. Let me recheck your peak flow.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Four hundred liters per minute. That's eighty percent of your predicted value, a significant improvement from sixty-five percent before the treatment. Your oxygen is also up to ninety-seven percent now. The fact that you responded so well confirms this is reversible airway obstruction, characteristic of asthma.",
      delayMs: 3200,
    },

    // — Assessment & Classification —
    {
      rawSpeakerId: 0,
      text: "Now, I want to talk to you about what's going on with your asthma overall, not just today. Based on what you've told me, your symptoms have crossed a threshold. You're having symptoms most days, needing your rescue inhaler daily, waking up at night several times a week, and your activity is limited. This is no longer mild intermittent asthma.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "What does that mean exactly? It's gotten worse?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "We classify asthma severity in steps. Mild intermittent means symptoms less than twice a week and nighttime symptoms less than twice a month. Mild persistent means symptoms more than twice a week but not daily. Moderate persistent, which is where you are now, means daily symptoms, nighttime symptoms more than once a week, and some limitation of activity.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "So it's gone from mild to moderate? That's honestly kind of scary. I always thought my asthma was no big deal.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "I understand the concern, but moderate persistent asthma is very manageable when treated properly. The key issue is that you haven't been on a controller medication, and you've had significant trigger exposure. Once we get you on the right treatment and address the triggers, there's every reason to expect your symptoms will improve significantly.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 0,
      text: "That's a very common misconception. Asthma involves chronic underlying airway inflammation, even when you feel fine. Without a controller medication, that inflammation can quietly worsen over time, and then a trigger like the construction dust pushes you into an exacerbation.",
      delayMs: 2800,
    },

    // — Step-Up Therapy —
    {
      rawSpeakerId: 0,
      text: "Here's what I want to do for your treatment going forward. For the acute exacerbation, I'm going to prescribe a short course of oral prednisone, forty milligrams once daily for five days. This will quickly reduce the inflammation in your airways.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Prednisone? Isn't that a steroid? I've heard steroids have a lot of side effects.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "That's a great question and a common concern. This is a very short course, only five days. At this duration, the risk of significant side effects is very low. You might notice some increased appetite, mild trouble sleeping, or a little jitteriness, but these are temporary and will resolve when you finish the course.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 0,
      text: "And to be clear, the oral prednisone is very different from the inhaled steroid I'll prescribe for daily use. The inhaled version goes directly to your lungs in tiny doses with minimal systemic absorption. Millions of people use inhaled steroids safely for years. The most common side effect is oral thrush, which you can prevent by rinsing your mouth after each use.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 0,
      text: "For your daily controller, I'm prescribing a combination inhaler containing fluticasone and salmeterol. The brand name is Advair. Fluticasone is the inhaled corticosteroid that reduces inflammation, and salmeterol is a long-acting bronchodilator that keeps your airways open for twelve hours. You'll use this twice daily, one puff in the morning and one in the evening.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "So that replaces my albuterol?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "No, you'll keep the albuterol as your rescue inhaler for breakthrough symptoms. The fluticasone-salmeterol is your maintenance medication. Think of it this way: the daily inhaler prevents symptoms, and the albuterol is there for emergencies. As the controller starts working, you'll need the albuterol less and less.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "How long before the daily inhaler starts helping?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "The salmeterol component works within about thirty minutes. The fluticasone takes longer to build up its anti-inflammatory effect. You should notice meaningful improvement within one to two weeks, with maximum benefit by about four weeks.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "And I really need to take it every day? Even when I feel fine?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Yes, every day, even when you feel perfectly fine. That's critical. The controller medication only works if it's used consistently. Stopping it when you feel good is what leads to the cycle of exacerbations. I know that was the pattern before, and I want to help you break it.",
      delayMs: 2800,
    },

    // — Asthma Action Plan —
    {
      rawSpeakerId: 0,
      text: "I'm going to create an asthma action plan for you. This is a written document that tells you exactly what to do based on how you're feeling. We use a traffic light system: green, yellow, and red zones.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "I've heard of those but never had one. What do the zones mean?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Green zone means you're doing well. Peak flow above eighty percent of your personal best, no symptoms, sleeping through the night. In this zone, you just continue your daily controller inhaler as prescribed.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "Yellow zone means caution. Peak flow between fifty and eighty percent, increased cough or wheeze, nighttime waking, needing your rescue inhaler more often. In this zone, you use your albuterol and call the office if symptoms don't improve within twenty-four hours.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 0,
      text: "Red zone is a medical emergency. Peak flow below fifty percent, severe shortness of breath, difficulty speaking in full sentences, or lips and fingernails turning blue. In this zone, use your albuterol immediately and call nine-one-one or go to the emergency room.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, that makes a lot of sense. So where was I today when I came in?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "You were in the yellow zone, at sixty-five percent peak flow. Had you let it progress without treatment, you could have moved into the red zone. That's why it's important not to ignore worsening symptoms.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "I also want to make sure you're using your inhalers correctly, because technique makes a huge difference. With the Advair Diskus, open it, slide the lever, exhale fully away from the device, breathe in steadily and deeply, hold for ten seconds, then exhale slowly. Always rinse your mouth afterward. If you have trouble coordinating the metered-dose albuterol, we can prescribe a spacer device.",
      delayMs: 3200,
    },

    // — Patient Concerns & Emotional Response —
    {
      rawSpeakerId: 1,
      text: "Can I ask you something honestly? Is this something I'm going to have to deal with for the rest of my life? It's been frustrating watching it get worse. I thought I'd grow out of it.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "That's a really important question. Asthma is a chronic condition, and in most cases it doesn't completely go away. Some children do outgrow it, but for many people, especially those diagnosed in adolescence who still have symptoms as adults, it tends to persist.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "But here's the thing. With proper treatment and trigger management, most people with asthma live completely normal, active lives. Many professional athletes have asthma. The goal isn't to cure it, it's to control it so well that it doesn't limit you.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "I guess that's reassuring. I just got frustrated because it felt like it came out of nowhere and I was doing everything wrong.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "You weren't doing everything wrong. You just didn't have the right tools and information. That's what we're fixing today.",
      delayMs: 1800,
    },

    // — Trigger Avoidance & Environmental Controls —
    {
      rawSpeakerId: 0,
      text: "Now let's talk about trigger avoidance, because medication is only part of the picture. The construction dust in your building is a major issue. I'd recommend getting a HEPA air purifier for your bedroom and sealing gaps under your apartment door with a draft stopper.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "What about my cat? Do I have to get rid of her? She's been with me for three years and I really don't want to give her up.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "I wouldn't jump to that conclusion yet. First, let's see how you respond to proper treatment. In the meantime, keep the cat out of your bedroom, get allergen-proof covers for your pillows and mattress, and wash your bedding weekly in hot water.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "Also, if you can eventually replace the carpet with hard flooring, that would help enormously. Carpet traps dust mites, pet dander, and other allergens. And your roommate's vaping indoors needs to stop, the aerosol contains irritants that trigger airway inflammation.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "I'll talk to him about it. He's pretty reasonable, I think he'll understand.",
      delayMs: 1400,
    },

    // — Allergy Testing Referral —
    {
      rawSpeakerId: 0,
      text: "I'd also like to refer you for formal allergy testing with an allergist. You were tested years ago, but a comprehensive panel now would help us identify all your specific triggers and guide decisions about environmental changes.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "What does allergy testing involve?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "It's a skin prick test. They place small drops of common allergens on your forearm, lightly prick the skin, and wait about fifteen to twenty minutes to see which ones cause a reaction. The allergist may also discuss immunotherapy, or allergy shots, depending on the results.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Allergy shots? Like a long-term treatment?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Yes, it's a series of injections over several years that gradually desensitize your immune system to specific allergens. For patients with significant allergic asthma triggers, it can reduce symptoms and medication needs significantly. That's something the allergist would evaluate.",
      delayMs: 2800,
    },

    // — Follow-up Plan —
    {
      rawSpeakerId: 0,
      text: "Let me summarize everything for you. Starting today: prednisone forty milligrams daily for five days, fluticasone-salmeterol Diskus one inhalation twice daily, continue albuterol as needed for rescue. I also want you to get a peak flow meter from the pharmacy so you can monitor your numbers at home.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "How often should I check the peak flow?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Twice daily for the next two weeks, morning and evening, before using your inhalers. Write down the numbers. This helps us track your response to treatment and establishes your personal best value for your action plan zones.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "I want to see you back in two weeks. At that visit, we'll review your peak flow diary, assess your symptoms, and decide if the current medication level is appropriate or if we need to adjust.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "And if I'm still not doing well after the prednisone?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Then we may need to step up further, potentially adjusting the dose of the inhaler or adding another medication. But I'm optimistic that with the prednisone burst, the controller inhaler, and some environmental changes, you'll see significant improvement.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "What if something gets worse before my follow-up appointment? Should I go to the ER?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "If your symptoms worsen significantly, if your peak flow drops below fifty percent, if you're struggling to speak in full sentences, or if albuterol is not providing any relief, go straight to the emergency room. For less urgent concerns, call our office and we can see you sooner.",
      delayMs: 2800,
    },

    // — Closing —
    {
      rawSpeakerId: 1,
      text: "Thank you, doctor. This is the first time someone has actually explained all of this to me. I feel like I have a much better understanding of what's going on.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "I'm glad. Understanding your asthma is the first step to controlling it. You're doing the right thing by coming in today instead of just pushing through it. I'll print out your asthma action plan, the prescriptions will be sent to your pharmacy, and we'll have the allergy referral ready at the front desk.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "One last thing. Is it okay to start exercising again once I'm feeling better? I really miss my running.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Absolutely. Once your symptoms are well-controlled, there's no reason you can't run. You may want to use your albuterol fifteen minutes before exercise as a preventive measure, especially in cold air. Start slow and build back up gradually. We'll talk more about exercise management at your follow-up.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "That's great to hear. I'll pick up the medications today and start everything right away. Thank you for your time.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "You're very welcome. Remember, take the prednisone with food in the morning, use the Advair twice daily every day, rinse your mouth after each use, and keep that peak flow diary. I'll see you in two weeks. Take care of yourself.",
      delayMs: 2800,
    },
  ],
}
