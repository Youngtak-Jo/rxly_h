import type { Scenario } from "./index"

export const otitisMediaScenario: Scenario = {
  id: "otitis-media",
  name: "Acute Otitis Media",
  description:
    "5-year-old with ear pain, fever, and irritability for 2 days following upper respiratory infection. Otoscopic exam shows bulging, erythematous tympanic membrane. Amoxicillin prescribed with parent counseling.",
  tags: ["ent", "pediatrics", "acute", "infection"],
  entries: [
    // — Opening & Chief Complaint —
    {
      rawSpeakerId: 0,
      text: "Hello, come on in. I see we have Lily here today. What brings you both in?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "Hi, doctor. Lily's been really fussy the past two days. She keeps pulling on her right ear and crying, and she had a fever last night. I'm worried she might have an ear infection.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "I'm sorry to hear that. She's five now, right? Let's go through everything carefully. When exactly did the ear pulling start?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "It started two days ago, on Tuesday evening. She was fine during the day at daycare, but when I picked her up she was really cranky and kept rubbing her ear. Then she woke up screaming around two in the morning.",
      delayMs: 2800,
    },

    // — History of Present Illness —
    {
      rawSpeakerId: 0,
      text: "Has she had any cold symptoms leading up to this? A runny nose, sneezing, cough?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, actually. She came down with a cold about five days ago. It started with a runny nose and some sneezing. The discharge was clear at first, then turned a little thicker and yellowish over the last couple of days.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "That's a very common pattern. How about the fever? What's the highest temperature you've measured?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Last night it went up to thirty-eight point nine. I gave her children's Tylenol and it came down to about thirty-eight point two, but this morning it was back up to thirty-eight point six.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "And you're measuring oral temperature? That's reliable at her age. Has she been saying which ear hurts, or is it both?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "She mostly points to the right side. But this morning she said the left one hurts a little too, not as much though.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "How has her sleep been these past two nights?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Terrible. She's been waking up multiple times crying. She can't seem to get comfortable lying down. I've been propping her up with pillows, which helps a little.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "And how about her appetite?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Way down. She barely touched her dinner last night and only had a few bites of toast this morning. She is drinking though. I've been making sure she gets water and some diluted juice.",
      delayMs: 2400,
    },

    // — Past Medical History —
    {
      rawSpeakerId: 0,
      text: "Has Lily had ear infections before?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, she had one when she was about two, and then another one around three and a half. Both times she was put on antibiotics and got better within a few days.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "Do you remember which antibiotic was used?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "I think it was amoxicillin both times. The pink liquid. She didn't mind the taste, thankfully.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Has she ever had tubes placed in her ears?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "No, it was never frequent enough for that. The pediatrician at the time said to just keep an eye on it.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Is she up to date on all her vaccinations, including the pneumococcal vaccine?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, she's had everything on schedule. She got all four doses of the Prevnar vaccine as a baby and toddler.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Any allergies to medications, foods, or anything else?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "No allergies that we know of.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Does she attend daycare or preschool? And is anyone at home currently smoking?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "She goes to daycare five days a week. There's been a lot of colds going around there this winter. And no, nobody smokes. My husband quit before Lily was born.",
      delayMs: 2200,
    },

    // — Associated Symptoms —
    {
      rawSpeakerId: 0,
      text: "I'd like to ask a few more questions to rule out some other things. Has Lily had any neck stiffness or complained about her neck hurting?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "No, nothing like that. She can move her head around fine.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Any rash anywhere on her body?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "No rash.",
      delayMs: 600,
    },
    {
      rawSpeakerId: 0,
      text: "Any vomiting or diarrhea?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "No vomiting. Her stools have been normal.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Before this episode, have you had any concerns about her hearing? Does she respond to her name, follow directions normally?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "No, her hearing has always seemed perfectly fine. She talks a lot and responds to everything. She's actually been doing really well at daycare with her letters and numbers.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "Any discharge or fluid coming out of either ear?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "No, nothing draining out. Just the pulling and crying.",
      delayMs: 1200,
    },

    // — Physical Examination —
    {
      rawSpeakerId: 0,
      text: "Alright, let me take a look at her. Hey Lily, I'm going to check a few things, okay? Can you sit up nice and tall for me? Great.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Her temperature right now is thirty-eight point six, heart rate is one hundred and ten, respiratory rate is twenty-two, and blood pressure is ninety-five over sixty. Those vitals are within the expected range for a five-year-old with a fever.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Is the heart rate too high?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "It's a little elevated, but that's completely normal when a child has a fever. It should come down as the fever resolves. Overall she looks fussy but consolable. She's interactive and making eye contact, which is reassuring. Let me check her throat. Open wide, Lily. Good girl.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "Her throat shows some mild pharyngeal erythema, which means mild redness in the back of the throat. That's consistent with the upper respiratory infection. No exudates or white patches on the tonsils, so this doesn't look like strep.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "Now let me feel her neck. I can feel some small, mildly tender lymph nodes on both sides, a bit more prominent on the right. That's the body's immune response to the infection. Nothing alarming there.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "Is that the swelling I noticed when I was bathing her last night? There were little bumps along her jawline.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Exactly. Those are her cervical lymph nodes doing their job fighting the infection. They'll go back down as she gets better. Now let me look in her ears. This is the important part.",
      delayMs: 2400,
    },

    // — Otoscopic Examination —
    {
      rawSpeakerId: 0,
      text: "Lily, I'm going to use this little light to peek inside your ear. It won't hurt, I promise. Hold nice and still for me.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Starting with the right ear. The tympanic membrane on the right is bulging, quite erythematous, meaning very red, and opaque. I can see fluid behind it. When I use the pneumatic attachment to check mobility, the eardrum barely moves. There is no perforation though, which is good.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Is that the one that's infected?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Yes, the right ear is showing clear signs of acute otitis media, which is an ear infection. Now let me check the left ear.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "The left tympanic membrane shows mild retraction and a little dullness, but it's not as inflamed as the right. There's possibly a small amount of fluid behind it as well, but the membrane is intact and less involved. So the right ear is the primary concern, but the left ear is something I want to keep an eye on.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "So she does have an ear infection. I was afraid of that.",
      delayMs: 1200,
    },

    // — Diagnosis Explanation —
    {
      rawSpeakerId: 0,
      text: "Yes, Lily has acute otitis media, primarily in the right ear. Let me explain what's happening. When she got that cold five days ago, the congestion and mucus caused the Eustachian tube, which is the small channel connecting the back of the nose to the middle ear, to become swollen and blocked.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "So the cold caused the ear infection?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Essentially, yes. When that tube gets blocked, fluid gets trapped behind the eardrum. Bacteria that are already present in the nose and throat can then multiply in that trapped fluid, causing the infection. That's why ear infections so often follow colds in young children. Their Eustachian tubes are shorter and more horizontal than adults, so they block more easily.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "That makes sense. She always seems to get ear problems after a cold.",
      delayMs: 1400,
    },

    // — Treatment Decision —
    {
      rawSpeakerId: 0,
      text: "Given Lily's age, the severity of her symptoms, the high fever, and the fact that both ears appear to be involved to some degree, I'd like to start her on antibiotics rather than taking a wait-and-see approach.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "I was actually going to ask about that. I've read online that sometimes ear infections can clear up on their own. But she seems really miserable.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "You're right that in some mild cases, particularly in older children with unilateral infection and no fever, we can observe for forty-eight to seventy-two hours. But in Lily's case, with the fever, the significant bulging of the right eardrum, involvement of both ears, and how uncomfortable she is, antibiotics are the appropriate choice.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "That sounds right to me. I just didn't want to push for antibiotics if they weren't necessary. I know there's concern about overusing them.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "I appreciate you thinking about that. Antibiotic stewardship is important. But this is a case where they're clearly indicated. I'm going to prescribe amoxicillin at a high dose, ninety milligrams per kilogram per day, divided into two doses. Lily weighs about twenty kilograms, so that works out to nine hundred milligrams per day, or four fifty milligrams twice daily, for ten days.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "She's had amoxicillin before with no problems. But why the higher dose? Last time I think it was a lower amount.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "We use the higher dose because some of the bacteria that cause ear infections have developed resistance to lower concentrations of amoxicillin. The higher dose overcomes that resistance in most cases. Since Lily attends daycare, where resistant strains are more common, this is the standard recommendation.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, that makes sense. She does pick up a lot from daycare.",
      delayMs: 1200,
    },

    // — Symptom Management —
    {
      rawSpeakerId: 0,
      text: "Now let's talk about managing her symptoms while the antibiotic works. For pain and fever, you can continue the children's acetaminophen, which is Tylenol. At her weight of twenty kilograms, the dose is three hundred milligrams every four to six hours as needed.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Can I also give her ibuprofen? Sometimes Tylenol alone doesn't seem to be enough.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Absolutely. Children's ibuprofen is actually very effective for ear pain. At her weight, the dose is two hundred milligrams every six to eight hours with food. You can alternate between the two medications. For example, give acetaminophen, then three hours later give ibuprofen, then three hours later acetaminophen again.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Got it. I'll write that down. Anything else that helps with the ear pain?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "A warm compress held against the ear can be soothing. Just a washcloth soaked in warm water and wrung out, held gently against the affected ear. Also, elevating the head of the bed or using an extra pillow can help reduce pressure in the ear, which is why she's more comfortable propped up.",
      delayMs: 2800,
    },

    // — Parent Education —
    {
      rawSpeakerId: 0,
      text: "In terms of what to expect over the next few days, the antibiotics should start to take effect within forty-eight to seventy-two hours. You should see the fever come down, and Lily should start to be less irritable and in less pain.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "So she won't feel better right away?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Not immediately, no. The first twenty-four hours she may still be quite uncomfortable. By day two or three, most children show significant improvement. The important thing is that even after she's feeling much better, you need to complete the full ten-day course of amoxicillin.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "I've heard that stopping antibiotics early can make the infection come back. Is that true?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Exactly. Stopping early can leave behind bacteria that are partially resistant, which can cause a relapse that's harder to treat. Finishing the full course ensures the infection is completely eradicated.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "Understood. I'll make sure she takes every dose, even if she's feeling fine.",
      delayMs: 1400,
    },

    // — Red Flags & Follow-up —
    {
      rawSpeakerId: 0,
      text: "I want to go over some warning signs that should prompt you to bring Lily back or seek emergency care. If her fever rises above thirty-nine point five and does not respond to acetaminophen or ibuprofen, that's a concern.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, thirty-nine point five. What else should I watch for?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "If you notice any fluid or pus draining from her ear, that could mean the eardrum has perforated. It's not dangerous in itself and often actually relieves the pain, but I need to know about it so we can adjust management. Also, if she develops a severe headache, stiff neck, swelling behind the ear, or seems increasingly lethargic or difficult to wake up, those are signs of a more serious complication and you should go to the emergency room.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "That's a lot to remember. Should I write this all down?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "I'll give you a printed after-visit summary with all of this information before you leave. The key things to remember are fever not improving with medication, any ear drainage, and any changes in her alertness or behavior that worry you.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "What if she's not getting better after the forty-eight to seventy-two hours you mentioned?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "If she's still febrile and in significant pain after seventy-two hours on amoxicillin, bring her back and we'll reassess. We may need to switch to a different antibiotic at that point, such as amoxicillin-clavulanate, which covers a broader range of bacteria.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "I'd also like to see Lily back in two to three weeks for a recheck. I want to make sure the fluid behind the eardrum has resolved and that the ear is healing properly.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "Is the fluid a separate problem from the infection?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Good question. The fluid can persist for several weeks even after the infection clears. Most of the time it resolves on its own within one to three months. But if it doesn't, it can affect hearing, which is why we follow up.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "That brings up something I've been worrying about. Could this infection damage her hearing? She's just starting to learn to read and I'd hate for anything to affect that.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "I completely understand your concern. The temporary hearing reduction from fluid in the middle ear is very common and almost always resolves once the fluid clears. Permanent hearing damage from ear infections is rare, especially with appropriate treatment. If she were to have recurrent infections or persistent fluid for more than three months, we'd refer her for a formal hearing evaluation.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "That's reassuring. How many ear infections would be considered too many? Should we be thinking about tubes?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Generally, if a child has three or more episodes in six months, or four or more in twelve months, we consider referral to an ENT specialist to discuss ear tubes. Lily has had two previous infections over several years, so she's well within normal range. But we'll keep tracking.",
      delayMs: 3000,
    },

    // — Daycare & Daily Life —
    {
      rawSpeakerId: 1,
      text: "When can she go back to daycare? I hate to keep her out, but I also don't want her to spread it.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Ear infections themselves aren't directly contagious. However, the cold virus that led to it is. I'd recommend keeping her home until she's been fever-free for twenty-four hours without fever-reducing medication and is feeling well enough to participate in activities. That's usually two to three days.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, that's doable. I already arranged to work from home the rest of the week. Can she take baths or does she need to keep her ears dry?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Regular baths are perfectly fine since the eardrum hasn't perforated. Just avoid submerging her head or getting soapy water directly in the ears. No swimming until we confirm the ear has healed at the follow-up visit.",
      delayMs: 2200,
    },

    // — Prevention Discussion —
    {
      rawSpeakerId: 0,
      text: "Let's also talk about some things that can help reduce the chance of future ear infections.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Please, I'd love to know. It feels like she's always sick in the winter.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "First, the most effective thing is good hand hygiene. Making sure Lily washes her hands regularly at daycare, especially before eating and after playing with shared toys, can significantly reduce the spread of cold viruses that lead to ear infections.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "We've been working on that. She's pretty good about it now.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "That's great. The pneumococcal vaccine she's already received helps protect against some of the most common bacteria that cause ear infections, so she has that working in her favor. Also, you mentioned nobody smokes at home, which is excellent. Secondhand smoke significantly increases the risk of ear infections in children.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "My husband's parents smoke. We visit them occasionally. Could that be a factor?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Even intermittent exposure to secondhand smoke can irritate the Eustachian tubes and increase susceptibility. I'd recommend asking the grandparents to smoke outdoors and away from Lily, and avoid visiting shortly after they've smoked indoors if possible.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "That's good to know. I'll have a conversation with them about it. Is there anything else we can do?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Making sure she gets her flu vaccine each year is also helpful, since the flu can predispose to ear infections just like other respiratory viruses. Also, during cold season, try to minimize exposure when possible. If you know a playmate is actively sick, it's reasonable to reschedule.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "That's tricky with daycare, but I'll do my best. One more question, doctor. Last time she was on antibiotics, she got a bit of a tummy ache and loose stools. Is there anything I can do about that this time?",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "That's a common side effect of amoxicillin. You can give her a probiotic supplement or probiotic-rich foods like yogurt during the course of antibiotics. Make sure to space the probiotic at least two hours apart from the antibiotic dose. Giving the amoxicillin with a meal rather than on an empty stomach also helps reduce GI upset.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Good tip. She loves yogurt, so that should be easy.",
      delayMs: 1000,
    },

    // — Closing —
    {
      rawSpeakerId: 0,
      text: "Perfect. So to summarize the plan: amoxicillin four fifty milligrams twice daily with food for ten full days. Alternate acetaminophen and ibuprofen for pain and fever. Warm compresses and elevating her head for comfort. Watch for the red flags we discussed. And bring her back in two to three weeks for a recheck.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Got it. And call or come back if the fever stays high after three days on the antibiotic or if anything drains from her ear.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Exactly right. You can also call the office anytime if you have questions. We have a nurse advice line after hours as well.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "Thank you so much, doctor. I always get anxious when she's this uncomfortable, but I feel a lot better now that we have a plan.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "You're welcome. You're doing a great job. She's lucky to have a mom who pays such close attention. I'll send the prescription to your pharmacy right now. The front desk will schedule the follow-up visit on your way out. Feel better soon, Lily.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Say thank you, Lily. She's waving at you. I think the Tylenol is kicking in. We'll see you in a couple of weeks.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Bye-bye, Lily. Take care, both of you.",
      delayMs: 1000,
    },
  ],
}
