import type { Scenario } from "./index"

export const gerdScenario: Scenario = {
  id: "gerd",
  name: "Gastroesophageal Reflux Disease",
  description:
    "48-year-old with 3-month heartburn, regurgitation, and epigastric discomfort. Alarm symptoms negative. Empiric PPI trial with dietary and lifestyle modifications.",
  tags: ["gastroenterology", "chronic", "new-diagnosis", "lifestyle"],
  entries: [
    // — Opening & Chief Complaint —
    {
      rawSpeakerId: 0,
      text: "Good morning. What brings you in today?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Hi, doctor. I've been having this burning sensation in my chest and upper stomach area. It's been going on for about three months now and it's really starting to bother me.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "I'm sorry to hear that. Can you point to where exactly you feel the burning?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "It's right here, behind my breastbone, and sometimes it goes up into my throat. And then there's also a dull ache right here in my upper stomach.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "When did this first start, and has it been getting worse over time?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "It started maybe three months ago, just occasionally after a big meal. But over the last month it's been happening almost every day, and the burning is more intense than it used to be.",
      delayMs: 2600,
    },

    // — History of Present Illness —
    {
      rawSpeakerId: 0,
      text: "Is there a particular time of day when it tends to be worse?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Definitely at night. I'll lie down after dinner and within twenty or thirty minutes the burning starts. A few times it's actually woken me up. I end up propping myself up on pillows, which helps a little.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "Does it get worse after eating certain types of food?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, absolutely. Spicy food is the worst. Anything with tomato sauce, pizza, Mexican food. Fatty or greasy meals too. And I've noticed coffee seems to trigger it as well, which is a problem because I drink two to three cups a day.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "Do you ever get a sour or bitter taste in your mouth?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, especially when I bend over or lie down after eating. It's like acid coming up into the back of my throat. Sometimes I feel like food is coming back up a little bit too.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "That regurgitation is a very common symptom of what I'm thinking. Have you tried anything on your own to manage these symptoms?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "I've been taking Tums and sometimes Pepto-Bismol. They help for maybe thirty minutes but then the burning comes right back. I tried some Pepcid too, and that worked a bit better but still didn't fully control it.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "How often are you taking the antacids?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Almost every day now. Sometimes two or three times a day. That's actually why I finally made this appointment.",
      delayMs: 1800,
    },

    // — Alarm Symptom Screening —
    {
      rawSpeakerId: 0,
      text: "You did the right thing coming in. I need to ask you some specific questions now to rule out anything more serious. Do you have any trouble swallowing food or liquids? Does it feel like food is getting stuck?",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "No, I can swallow fine. Food goes down normally.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Any pain when you swallow?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "No, no pain with swallowing.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Have you noticed any unintentional weight loss over the past few months?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "No, if anything I've put on a few pounds.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Any blood in your stool, or black tarry-looking stools?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "No, nothing like that.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Have you ever vomited blood or anything that looked like coffee grounds?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "No, never. Should I be worried about that?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Those are what we call alarm symptoms, and the fact that you don't have any of them is actually very reassuring. Last one: any persistent vomiting or severe worsening abdominal pain, something sharp or different from the burning?",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "No vomiting, and the pain is just the burning and that dull ache. Nothing sharp or severe.",
      delayMs: 1400,
    },

    // — Past Medical History —
    {
      rawSpeakerId: 0,
      text: "Good. Let me go through your medical history. Do you have any known medical conditions?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "My doctor told me at my last physical that my BMI was in the obese range. Thirty-one, I think. And my blood pressure was a bit on the higher side but not high enough for medication. That's about it.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "Are you taking any medications regularly?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Nothing prescribed. I take ibuprofen for headaches, maybe two or three times a week. And a multivitamin.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "The ibuprofen is important. NSAIDs like ibuprofen can irritate the stomach lining and make reflux worse. How long have you been taking it that frequently?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 1,
      text: "Maybe six months. I get tension headaches from staring at the computer all day. Is the ibuprofen making my stomach problem worse?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "It could certainly be contributing. We'll talk about alternatives. Have you ever been tested for H. pylori? That's a bacterium that can cause stomach issues.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "I don't think so. I've never heard of that before.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Any family history of stomach or esophageal cancer, or GI conditions?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "My mother had gallbladder problems and had it removed. My father has high blood pressure. No cancer in the family that I'm aware of.",
      delayMs: 2000,
    },

    // — Social History —
    {
      rawSpeakerId: 0,
      text: "Tell me a bit about your daily routine. What kind of work do you do?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "I'm a project manager at a tech company. It's pretty stressful, lots of deadlines. I usually work from eight in the morning until seven or eight at night. By the time I get home, I'm exhausted.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "What time do you typically eat dinner, and when do you go to bed?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Dinner is usually around eight thirty or nine. I go to bed around ten thirty or eleven. So yeah, I'm eating pretty close to bedtime most nights. I know that's probably not ideal.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "That timing is very relevant. How about alcohol and tobacco?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "I drink socially. A glass or two of wine on weekends, occasionally a beer during the week. I've never smoked.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "What does your typical diet look like during the day?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Breakfast is usually just coffee. Lunch is whatever is quick, often takeout near the office. Sandwiches, burritos, the occasional pizza. I snack on chips or granola bars in the afternoon. Dinner is the biggest meal.",
      delayMs: 2600,
    },

    // — Physical Examination —
    {
      rawSpeakerId: 0,
      text: "Alright, let me do a physical exam. I'll check your vitals and then examine your abdomen.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Your blood pressure is one thirty-six over eighty-four. Heart rate seventy-eight. Oxygen saturation ninety-nine percent. Temperature normal. Your BMI today is thirty-one point two.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "I'm going to examine your abdomen now. Please lie back for me. Bowel sounds are normal in all four quadrants. I'm going to press on your abdomen in different areas. Tell me if anything hurts.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "That's a little tender right there. Right in the upper middle area.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "That's the epigastric region, right below where your ribs meet. That mild tenderness is consistent with acid reflux. There's no guarding or rigidity, no rebound tenderness, no masses. Your liver and spleen feel normal. The rest of your abdomen is soft and non-tender.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Is the tenderness a bad sign?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Mild epigastric tenderness is very common with reflux and stomach irritation. There are no red flags on the exam. Everything else looks normal.",
      delayMs: 2000,
    },

    // — Assessment —
    {
      rawSpeakerId: 0,
      text: "Based on everything you've told me and the exam, I'm confident that you're dealing with gastroesophageal reflux disease, or GERD. This is very common and very treatable.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "GERD. But doctor, can I ask you something honestly? I've been reading things online and I'm worried this could be something more serious. Could it be stomach cancer?",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "I'm glad you brought that up. Based on your age, the absence of alarm symptoms, no difficulty swallowing, no weight loss, no bleeding, no family history of GI cancers, the likelihood of anything serious is very low. Your symptoms are classic for GERD.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "That's a relief. What exactly is happening in my body that's causing all this?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "At the bottom of your esophagus there's a ring of muscle called the lower esophageal sphincter. Think of it like a valve. Normally it opens to let food into your stomach and then closes to keep acid from coming back up. In GERD, that valve relaxes when it shouldn't or doesn't close tightly enough.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "So the acid is getting where it shouldn't be.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Exactly. The esophagus isn't designed to handle acid. That's what causes the burning and the sour taste. Lying down after eating, large meals, specific foods, caffeine, and excess weight around the midsection all make it worse.",
      delayMs: 2800,
    },

    // — Treatment: Empiric PPI Trial —
    {
      rawSpeakerId: 0,
      text: "For treatment, I want to start you on a proton pump inhibitor, or PPI. I'm prescribing omeprazole, twenty milligrams, once daily for eight weeks.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "I've seen omeprazole at the pharmacy. How is that different from the Tums and Pepcid I've been taking?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Antacids like Tums just neutralize acid that's already there. Pepcid reduces acid production but only partially. Omeprazole shuts down the acid pumps in your stomach lining much more effectively, reducing acid production by about ninety percent. That gives the esophagus a real chance to heal.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "How should I take it?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Take it thirty minutes before your first meal of the day, ideally before breakfast. It needs to be activated by food to work properly, so the timing matters.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 1,
      text: "Are there any side effects? I've read some things online about long-term PPI use being dangerous. Something about bone problems and kidney issues.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "For a short-term course, most people tolerate it very well. Some get mild headache or nausea when starting. Those long-term concerns you've read about are for years of continuous use. For eight weeks, the benefits far outweigh those very small risks. We'll reassess at the end and decide whether you need to continue.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, that makes me feel better. What about the ibuprofen I've been taking?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Switch to acetaminophen, Tylenol, for your headaches. NSAIDs irritate the stomach lining and make GERD worse. Acetaminophen works differently and is much gentler on the stomach.",
      delayMs: 2200,
    },

    // — Lifestyle Modifications —
    {
      rawSpeakerId: 0,
      text: "Now, medication is important, but lifestyle changes are just as critical for managing GERD long term. Some of these will require real adjustments, and I know that's not easy with a busy work schedule.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "I'm willing to try. This has been affecting my sleep and my quality of life, so I'm motivated.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "First and most important: avoid eating for at least three hours before you lie down. You mentioned eating dinner at eight thirty or nine and going to bed around ten thirty. That's not enough time for your stomach to empty.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "I figured you'd say that. The problem is my work schedule. I don't get home until eight most nights. What am I supposed to do?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Could you eat a larger lunch and then have a lighter dinner earlier? Even something small around six at your desk before you leave work? Even shifting the timing by an hour can make a real difference.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "That would take some planning, but it's doable. What else?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Elevate the head of your bed by about six inches. A wedge pillow works well for this. It uses gravity to keep acid from flowing back into the esophagus while you sleep.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "I've been using extra pillows. Is that the same thing?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Not quite. Extra pillows bend you at the waist, which can increase abdominal pressure and make reflux worse. A wedge pillow elevates your entire upper body at a gentle incline. I'd recommend getting one.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "What about the coffee? Do I have to give it up completely?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "I'd like you to cut back to one cup a day, in the morning, and not on an empty stomach. Coffee relaxes that lower esophageal sphincter and stimulates acid production. If you can tolerate cold brew, that tends to be less acidic.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "One cup a day is going to be tough, but I'll try. And the alcohol?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Minimize it during the eight-week treatment period. After that, moderate social drinking is fine, but avoid drinking close to bedtime. Also be mindful of these other trigger foods: tomato-based sauces, citrus, chocolate, peppermint, onions, and anything fried or very fatty.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "That's basically everything I enjoy eating. Pizza, burritos, coffee, chocolate. This is going to be a serious lifestyle change.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "The goal isn't to eliminate everything permanently. It's to identify your worst triggers and reduce those. Some people can still eat these foods in smaller portions or earlier in the day. It's about finding your personal threshold.",
      delayMs: 2800,
    },

    // — Weight Management —
    {
      rawSpeakerId: 0,
      text: "I also want to discuss weight. Your BMI is thirty-one. Excess weight, especially around the abdomen, puts pressure on the stomach and makes reflux significantly worse. Even losing ten to fifteen pounds can make a noticeable difference.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "I've been meaning to lose weight. Do you think that alone could fix this?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "For some patients, weight loss combined with lifestyle changes can control GERD without long-term medication. It's one of the most effective things you can do. It won't replace the PPI right now, but it's important for the long-term plan.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "My wife has been wanting us to start walking together in the evenings. Maybe this is the push I need.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "That's excellent. Regular activity helps with weight, stress, and GI motility. Just avoid vigorous exercise right after eating. Waiting an hour or two after a meal is a good rule.",
      delayMs: 2200,
    },

    // — When Endoscopy is Needed —
    {
      rawSpeakerId: 1,
      text: "Doctor, I want to come back to the cancer question. Are you sure I don't need an endoscopy? My coworker had one and they found something.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "Based on clinical guidelines, an endoscopy isn't indicated right now. You're forty-eight with classic symptoms and no alarm features. The recommended approach is to start treatment and see how you respond.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "However, if after eight weeks your symptoms haven't significantly improved, or if they worsen, we'd move to an upper endoscopy. That's where we use a thin camera to look at the lining of your esophagus and stomach directly.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "What about Barrett's esophagus? I saw that term online.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Barrett's is a condition where chronic acid exposure causes the cells lining the esophagus to change. It's more common in people with untreated GERD for many years. It does carry a slightly increased cancer risk, but less than one percent per year. The best way to prevent it is to manage GERD effectively, which is exactly what we're doing.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 0,
      text: "Exactly. And if at any point you develop difficulty swallowing, unintentional weight loss, vomiting blood, or black stools, call me right away. We'd fast-track the endoscopy in that situation.",
      delayMs: 2600,
    },

    // — Follow-up Plan —
    {
      rawSpeakerId: 0,
      text: "For follow-up, I want to see you in eight weeks. If the omeprazole has resolved your symptoms, which it does for the majority of patients, we'll discuss stepping down the medication.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "What do you mean by stepping down?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Rather than stopping abruptly, we'd reduce the dose or switch to an as-needed approach. Some patients eventually manage with just lifestyle modifications and occasional famotidine for breakthrough symptoms. The goal is the least medication necessary.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "And if the symptoms come back after I stop?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "That happens for some people, and it doesn't mean treatment failed. GERD is often chronic and waxes and wanes. Some patients need a low-dose PPI long-term, and that's perfectly manageable.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "What if my symptoms get worse before eight weeks? And can I still use Tums in the meantime?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "If symptoms worsen, call us right away. And yes, you can use antacids for breakthrough symptoms while the omeprazole builds up. Just space them at least two hours apart from the omeprazole. Give it one to two weeks to reach full effect.",
      delayMs: 2600,
    },

    // — Summary & Closing —
    {
      rawSpeakerId: 0,
      text: "Let me summarize the plan. Omeprazole twenty milligrams, thirty minutes before breakfast, every day for eight weeks. Switch from ibuprofen to acetaminophen. Elevate the head of your bed with a wedge pillow.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "Avoid eating within three hours of lying down. Larger lunch, lighter earlier dinner. One cup of coffee in the morning. Minimize alcohol during treatment. Identify and reduce trigger foods. And work on gradual weight loss.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "That's a long list, but I'll do my best. One last question: is stress making this worse? Work has been extremely stressful lately.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Stress doesn't directly cause acid production, but it can absolutely worsen GERD symptoms. It affects pain perception, leads to poor eating habits, and can alter gut motility. Managing stress is part of managing GERD. Those evening walks with your wife would help with that too.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "That makes a lot of sense. I appreciate you explaining everything so clearly, doctor. I feel much better about what's going on.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "You're welcome. Stay consistent with the medication and give the lifestyle changes a real effort. Most patients see significant improvement. I'll see you in eight weeks, and call us anytime if something changes.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Will do. Thank you, doctor. I'm glad I came in instead of just living with it.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "I'm glad you did too. Take care, and the front desk will schedule your follow-up on your way out.",
      delayMs: 1600,
    },
  ],
}
