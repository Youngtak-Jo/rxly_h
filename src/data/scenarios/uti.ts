import type { Scenario } from "./index"

export const utiScenario: Scenario = {
  id: "uti",
  name: "Urinary Tract Infection",
  description:
    "28-year-old female with 3 days of dysuria, frequency, and urgency. Urine dipstick and UA/culture confirm uncomplicated cystitis. Nitrofurantoin prescribed with prevention counseling.",
  tags: ["urology", "acute", "infection", "medication"],
  entries: [
    // — Opening & Chief Complaint —
    {
      rawSpeakerId: 0,
      text: "Hi there, come on in and have a seat. I'm Dr. Nguyen. What brings you in today?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "Hi, doctor. Thanks for seeing me. I've been having a lot of pain when I pee for the past few days and I just can't seem to stop going to the bathroom. It's really uncomfortable.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "I'm sorry to hear that. Let's figure out what's going on. When exactly did the symptoms start?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "It started about three days ago. At first it was just a little stinging at the end of urination, but by yesterday it became this burning pain every single time I go.",
      delayMs: 2400,
    },

    // — History of Present Illness —
    {
      rawSpeakerId: 0,
      text: "Can you describe the burning a little more? Is it at the beginning of urination, at the end, or throughout?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "It's mostly at the end. Right as I'm finishing, there's this intense burning and stinging. It lingers for a minute or two afterward as well.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "How often would you say you're needing to go to the bathroom?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "I feel like it's every thirty to forty-five minutes. I'll go and then almost immediately feel like I have to go again. Even when barely anything comes out, the urge is still there.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "That constant urge to urinate even when the bladder isn't full is called urgency. It's a very common symptom with what I'm suspecting. Have you noticed any blood in your urine?",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "Actually, yes. Yesterday I noticed the urine looked a little pinkish. Not bright red or anything, but definitely not the normal color. That honestly scared me a bit.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "I understand that can be alarming. A small amount of blood in the urine, what we call hematuria, is actually fairly common with urinary tract infections and usually resolves with treatment. Have you had any fevers or chills?",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "No, I don't think so. I haven't felt feverish or had any chills.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "What about any pain in your lower back or sides, around where your kidneys are? Any nausea or vomiting?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "No back pain or side pain, and no nausea or vomiting. The discomfort is really just down low, in my lower belly and when I urinate.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Have you noticed any unusual vaginal discharge, itching, or odor?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "No, nothing different there. No discharge or itching.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Any pain during intercourse recently, or any unusual smell to the urine?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "No pain with intercourse before this started, but I haven't tried since because I've been so uncomfortable. And the urine has had a stronger, kind of foul smell the last couple of days.",
      delayMs: 2400,
    },

    // — Past Medical History —
    {
      rawSpeakerId: 0,
      text: "That can definitely happen with a urinary infection. Now let me ask about your medical history. Have you ever had a urinary tract infection before?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, I had one about two years ago. My doctor at the time gave me an antibiotic and it cleared up in a few days. I think it was called trimethoprim or something like that.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "That was likely trimethoprim-sulfamethoxazole, also called Bactrim. Do you remember if it worked well for you?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, it worked great. I felt better within a day or two and finished the whole course.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Good. Any other medical conditions I should know about? Diabetes, kidney problems, anything chronic?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "No, I'm generally pretty healthy. I don't have any chronic conditions.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Are you taking any medications currently? Including over-the-counter supplements or vitamins?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Just a daily multivitamin and I take birth control pills, a combination pill called Yaz. I've been on it for about three years.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Do you have any drug allergies?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, I'm allergic to sulfa drugs. I got a pretty bad rash the first time they tried to give me a sulfa antibiotic when I was a teenager.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "That's very important, and good that you know about it. With a documented sulfa allergy, we'll definitely avoid trimethoprim-sulfamethoxazole, so the antibiotic you had two years ago was probably something different. No worries. We have other excellent options. Are you sexually active?",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, I am. I'm in a monogamous relationship with my boyfriend. We've been together about a year. We don't regularly use condoms since I'm on the pill.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "I ask because sexual activity is actually one of the most common risk factors for UTIs in young women. Have you had any recent increase in sexual frequency?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 1,
      text: "Well, we just got back from a vacation last week and were probably more active than usual. Could that be related?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "It very well could be. There's actually an old term called honeymoon cystitis because UTIs are so commonly triggered by increased sexual activity. The mechanical activity can introduce bacteria from the perineal area into the urethra.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Oh wow, I had no idea. I feel a little embarrassed now.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Please don't be embarrassed at all. This is extremely common. UTIs are one of the most frequent reasons young women visit their doctor. There's nothing to be embarrassed about.",
      delayMs: 2200,
    },

    // — Review of Systems —
    {
      rawSpeakerId: 0,
      text: "Let me run through a few more questions to make sure we're not dealing with anything more serious. Any pain between your shoulder blades or in your mid-back?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 1,
      text: "No, no back pain at all.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Any recent weight loss, night sweats, or fatigue beyond what you'd expect from being uncomfortable?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "No, I feel normal otherwise. Just the urinary symptoms are bothering me.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "When was your last menstrual period? And any chance you could be pregnant?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "My period was about two weeks ago, totally normal. And no, I've been taking my birth control consistently. I haven't missed any pills.",
      delayMs: 1800,
    },

    // — Physical Examination —
    {
      rawSpeakerId: 0,
      text: "Alright, thank you for answering all of those questions. Let me do a quick physical exam now. I'll start by checking your vitals and then examine your abdomen.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Your temperature is thirty-six point eight degrees Celsius, so no fever. Blood pressure is one eighteen over seventy-four, heart rate is seventy-two. Everything looks normal.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "That's good to hear.",
      delayMs: 600,
    },
    {
      rawSpeakerId: 0,
      text: "I'm going to press on your abdomen now. Let me know if anything is tender. I'll start up here near your stomach and work my way down.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "That's fine up there. Ow, yes, right down there is sore. Right above my pubic bone.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "That suprapubic tenderness is consistent with bladder inflammation. Now I'm going to tap gently on your lower back on each side to check for kidney tenderness. This is called costovertebral angle tenderness. Let me know if this hurts.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "No, that doesn't hurt at all on either side.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Excellent. The fact that there's no CVA tenderness and no fever is very reassuring. It makes it much less likely that the infection has traveled up to the kidneys.",
      delayMs: 2200,
    },

    // — Diagnostic Workup —
    {
      rawSpeakerId: 0,
      text: "Based on your symptoms and the exam, I'm quite confident we're dealing with a urinary tract infection, specifically a lower UTI or cystitis. But I'd like to confirm with a urine test. Have you been able to hold your urine, or did you just go recently?",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "I actually really need to go right now. I've been holding it since I got here.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Perfect timing. I'll need you to provide a clean-catch midstream urine sample. The nurse will give you a cup and wipes. Wipe from front to back first, start urinating into the toilet, then catch the middle part of the stream in the cup. This helps us get the most accurate results.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, I've done that before. I'll go do that now.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Great. We'll do a quick dipstick test here in the office and I'll also send the sample for a formal urinalysis and urine culture. I'll have the dipstick results in just a few minutes.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "Sounds good. What exactly are you looking for on the dipstick?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Good question. The two most important markers for us right now are nitrites, which are produced when certain bacteria break down nitrate in the urine, and leukocyte esterase, which is an enzyme released by white blood cells fighting infection. If both are positive, it strongly supports a UTI.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, I'll be right back.",
      delayMs: 600,
    },

    // — Results Discussion —
    {
      rawSpeakerId: 0,
      text: "Alright, welcome back. I have the dipstick results. As expected, the nitrites are positive and the leukocyte esterase is positive as well. There's also a trace of blood on the dipstick, which fits with the pinkish color you noticed.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "So it is an infection?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Yes, everything points to an uncomplicated lower urinary tract infection, what we call cystitis. The bacteria, most commonly E. coli, have made their way into the bladder and are causing inflammation. That's what's behind the burning, the frequency, the urgency, and the blood.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "E. coli? Isn't that the food poisoning bacteria?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "It can cause food poisoning, but certain strains of E. coli normally live in our intestines without causing problems. Because the urethra in women is shorter and closer to the rectum, these bacteria can sometimes migrate to the urinary tract. That's actually why UTIs are so much more common in women than in men.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "That makes sense. What about the culture you sent? When do those results come back?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "The culture typically takes forty-eight to seventy-two hours. It will tell us exactly which bacteria are causing the infection and which antibiotics it's sensitive to. Given how classic your presentation is, I'm comfortable starting treatment right now without waiting for those results.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Oh good, I was hoping I wouldn't have to wait. The burning is really getting to me.",
      delayMs: 1400,
    },

    // — Treatment Plan —
    {
      rawSpeakerId: 0,
      text: "Absolutely, let's get you feeling better. Given your sulfa allergy, the best option for you is nitrofurantoin, also sold under the brand name Macrobid. I'll prescribe one hundred milligrams twice a day for five days.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Is that an antibiotic? And will it interact with my birth control?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Yes, it's an antibiotic that concentrates very well in the urine, which makes it particularly effective for bladder infections. And no, nitrofurantoin does not interact with oral contraceptives. Your birth control will continue to work normally.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "That's a relief. Are there any side effects I should watch for?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "The most common side effects are mild nausea and headache. Taking it with food significantly reduces the nausea. Some people also notice their urine turns a dark yellow or brownish-orange color. That's completely harmless and expected, so don't be alarmed if that happens.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, take it with food and don't panic about the color change. Got it. Is there anything I can take right now for the burning? It's really distracting.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "I'm also going to prescribe phenazopyridine, which is a bladder analgesic. It numbs the lining of the urinary tract and provides significant relief from the burning and urgency. Take two hundred milligrams three times a day for two days. An important warning: it will turn your urine bright orange.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Orange urine from one pill, brownish from the other. My bathroom is going to look interesting for a few days.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Ha, yes. It can also stain clothing and contact lenses, so be careful with that. The phenazopyridine is only for symptom relief, not treatment. The nitrofurantoin is actually fighting the infection, so make sure you complete the full five-day course even if you start feeling better after a day or two.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "I will. I learned that lesson about finishing antibiotics. What about ibuprofen? Can I take that too for the discomfort?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Absolutely. Ibuprofen two hundred to four hundred milligrams every six hours as needed can help with the pelvic cramping and general discomfort. Just take it with food to protect your stomach.",
      delayMs: 2200,
    },

    // — Patient Education & Prevention —
    {
      rawSpeakerId: 0,
      text: "Now, since you've had a UTI before and this one seems to have been triggered by increased sexual activity, I want to go over some prevention strategies to help reduce your risk of future infections.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, please. I really don't want to go through this again.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "First and most important is hydration. Drinking plenty of water throughout the day, aiming for at least six to eight glasses, helps flush bacteria out of the urinary tract before they can establish an infection.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "I'll admit I'm not great about drinking water. I mostly drink coffee during the day.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Coffee is actually a bladder irritant and can make UTI symptoms worse, so while you're recovering I'd suggest cutting back on caffeine. Long-term, try to balance your coffee with equal amounts of water.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "Second, urinate immediately after sexual intercourse. This is one of the single most effective prevention measures. It helps flush out any bacteria that may have been introduced during sex.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "I've heard that before but I'm not always good about doing it. I'll make it a habit.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "It really does make a difference. Third, always wipe from front to back after using the toilet. This prevents bacteria from the rectal area from being introduced to the urethra.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 1,
      text: "I do that already. My mom drilled that into me when I was little.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Good. Also, avoid using douches, feminine sprays, or scented products in the genital area. These can disrupt the normal bacterial balance and actually increase infection risk.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "What about cranberry juice? I've heard that helps prevent UTIs. My friend swears by it.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "The evidence on cranberry products is mixed. Some studies suggest cranberry supplements in capsule form may offer a modest benefit by preventing bacteria from adhering to the bladder wall. However, cranberry juice cocktails from the store are usually loaded with sugar and probably aren't concentrated enough to help.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "So the capsules might be worth trying but don't rely on juice from the grocery store?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "That's a fair summary. It's unlikely to hurt, but the behavioral measures we discussed, hydration, post-coital voiding, and proper hygiene, are backed by stronger evidence. Cotton underwear and avoiding tight pants can also help with airflow, but I'd prioritize those core habits first.",
      delayMs: 2600,
    },

    // — Follow-up & Red Flags —
    {
      rawSpeakerId: 0,
      text: "Now, let me tell you what to watch for. You should start feeling better within one to two days of starting the antibiotic. If your symptoms haven't improved after forty-eight hours, I want you to call us.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "What if the symptoms get worse instead of better?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "That's exactly what I want to go over. There are certain warning signs that would mean the infection could be spreading to the kidneys, which we call pyelonephritis. If you develop a fever over thirty-eight point three degrees Celsius, chills or shaking, pain in your lower back or flank area, nausea or vomiting, or if you feel significantly worse overall, I need you to come back immediately or go to urgent care.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "That sounds serious. How likely is it to spread to the kidneys?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "With prompt treatment like we're starting today, it's quite unlikely. Pyelonephritis usually develops when a UTI goes untreated for a longer period. You came in at the right time.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, that's reassuring. What about the culture results? Do I need to come back for those?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "If the culture shows the bacteria are sensitive to nitrofurantoin, which is the case the majority of the time, we won't need to change anything. If for some reason the bacteria are resistant and we need to switch antibiotics, we'll call you. Otherwise, no news is good news.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Perfect. And if I keep getting UTIs, is there anything more we can do?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "If you have three or more UTIs within a year, we'd classify that as recurrent UTIs and there are additional strategies. We could consider prophylactic low-dose antibiotics taken around the time of sexual activity, or other approaches. But most women who get an occasional UTI don't go on to have recurrent problems, especially once they adopt the prevention measures we discussed.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "That makes sense. One last question. Should I avoid sex while I'm being treated?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "I'd recommend waiting until you've finished the antibiotic course and your symptoms have completely resolved. Having intercourse while the bladder is inflamed can be quite painful and could potentially slow your recovery. After you're better, just remember the post-coital voiding.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, I'll wait. Thank you for explaining everything so clearly. I feel a lot better knowing what's going on and having a plan.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Of course. Let me summarize your plan. Nitrofurantoin one hundred milligrams twice daily with food for five days. Phenazopyridine two hundred milligrams three times daily for two days for the burning. Ibuprofen as needed for pain. Increase your water intake, cut back on caffeine while you're recovering, and remember to urinate after intercourse going forward.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Got it. Nitrofurantoin with food for five days, the bladder pain pill for two days, ibuprofen, lots of water, and pee after sex. I think I can handle that.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "You've got it. The pharmacy should have the prescriptions ready within the hour. If you have any concerns at all or if the warning signs we discussed come up, don't hesitate to call. Otherwise, I hope you feel much better soon.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Thank you so much, Dr. Nguyen. I really appreciate you taking the time to explain everything. I'll head to the pharmacy now.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "You're welcome. Take care and feel better.",
      delayMs: 800,
    },
  ],
}
