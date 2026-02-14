import type { Scenario } from "./index"

export const lowBackPainScenario: Scenario = {
  id: "low-back-pain",
  name: "Acute Low Back Pain",
  description:
    "42-year-old male with sudden onset lower back pain after lifting. Neurological exam rules out red flags. Muscle strain diagnosed with conservative management, NSAIDs, and physical therapy referral.",
  tags: ["orthopedics", "musculoskeletal", "acute", "pain-management"],
  entries: [
    // — Opening & Chief Complaint —
    {
      rawSpeakerId: 0,
      text: "Good morning. Come on in and have a seat. What brings you in today?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Hey, doc. I threw my back out at work two days ago and it's been killing me ever since. I can barely move.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "I'm sorry to hear that. Tell me exactly what happened.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "I work in a warehouse and I was lifting a heavy box off the floor, probably about fifty or sixty pounds. I twisted a little as I picked it up and felt this sudden sharp pain right across my lower back. I almost dropped the box.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 0,
      text: "Did the pain hit immediately, or did it come on gradually after the lift?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "It was immediate. Like a knife in my lower back. I had to put the box down right away and I couldn't straighten up for a good five minutes. My coworker had to help me to a chair.",
      delayMs: 2600,
    },

    // — History of Present Illness —
    {
      rawSpeakerId: 0,
      text: "Can you show me exactly where the pain is?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "It's right here across the lower back, mostly on the right side. It goes from about my belt line up a few inches. It feels really tight and sore, like the muscles are locked up.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "How would you describe the pain now compared to when it first happened? Is it the same sharp pain, or has it changed?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "The sharp stabbing part has calmed down a bit. Now it's more of a deep, constant ache with this tightness. But if I move wrong or try to bend, I get this sharp catch that takes my breath away.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "On a scale of one to ten, what's the pain at its worst and what is it at rest?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "At rest, if I'm lying on my back with my knees up, it's about a four or five. But when I try to get out of bed or twist or bend forward, it shoots up to an eight or nine. Getting dressed this morning was brutal.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "This is a really important question. Does the pain travel or radiate anywhere? Down into your buttocks, the back of your thigh, or below the knee into your calf or foot?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "Not really. It stays pretty much in the lower back. Sometimes I feel a little soreness in my right buttock but it doesn't go down my leg or anything like that.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "Good. That's actually a reassuring sign. What makes the pain worse? You mentioned bending and twisting.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Bending forward is the worst. Twisting, getting up from a chair, sneezing, coughing. Even just sitting for more than fifteen or twenty minutes makes it tighten up. I've been alternating between lying down and standing because sitting is so uncomfortable.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 0,
      text: "And what makes it feel better?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Lying flat on my back with a pillow under my knees helps the most. I tried ice on it the first night and that helped a little. I've been taking some Advil but it's not doing much honestly.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "How much Advil have you been taking?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Two tablets, the two hundred milligram ones, maybe three or four times a day. It takes the edge off for an hour or two but then it comes right back.",
      delayMs: 2200,
    },

    // — Red Flag Screening —
    {
      rawSpeakerId: 0,
      text: "I need to ask you some specific questions now to make sure we're not dealing with anything more serious. These are standard questions we ask everyone with back pain. Have you had any numbness or tingling in your groin area or between your legs, what we call the saddle area?",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "No, nothing like that.",
      delayMs: 600,
    },
    {
      rawSpeakerId: 0,
      text: "Any changes in your bladder or bowel function? Difficulty urinating, loss of control, or any incontinence?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "No, everything's been normal in that department.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Have you noticed any weakness in your legs? Foot drop, tripping, or your leg giving out on you?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "No weakness. My legs feel fine, it's really just the back.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Any fever, chills, or night sweats in the last few days?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "No, no fever or anything like that.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Any unexplained weight loss recently?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "No, my weight's been pretty stable.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Have you ever been diagnosed with cancer or had any history of cancer?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "No, no cancer history. Thank God.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Good. All of those answers are very reassuring. Those are what we call red flag symptoms and the absence of all of them is a very good sign.",
      delayMs: 2000,
    },

    // — Past Medical History —
    {
      rawSpeakerId: 0,
      text: "Have you ever had back problems before this episode?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "I tweaked it once about three years ago doing yard work. It was sore for a few days but nothing like this. I just rested and it went away on its own. This is way worse.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "How long have you been working at the warehouse?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "About eight years now. I do a lot of lifting, loading, and unloading. It's pretty physical work. I'm on my feet all day.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Do you exercise regularly outside of work?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Honestly, not really. By the time I get home I'm pretty wiped out. I used to play basketball on weekends but I haven't done that in a couple of years. I know I should be more active.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "Any other medical conditions? High blood pressure, diabetes, anything like that?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "No, I'm generally pretty healthy. I had my appendix out when I was a teenager but that's about it. No medications other than the Advil for this.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "Any allergies to medications?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Not that I know of.",
      delayMs: 600,
    },
    {
      rawSpeakerId: 0,
      text: "Do you smoke or use tobacco?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "No, I quit smoking about five years ago. Used to smoke half a pack a day.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Good for you. How about alcohol?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "A beer or two on weekends, nothing heavy.",
      delayMs: 1000,
    },

    // — Physical Examination —
    {
      rawSpeakerId: 0,
      text: "All right, let me examine you now. I'm going to check your vitals first and then do a thorough back and neurological exam. Can you stand up for me?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 1,
      text: "Sure, just give me a second. Getting up is the hard part.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Take your time. I can already see you're guarding on the right side and your posture is shifted a bit to the left. That's called an antalgic posture, your body is trying to get away from the pain. Your vitals look good. Blood pressure is one twenty-six over seventy-eight, heart rate seventy-two, temperature ninety-eight point four.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 0,
      text: "I'm going to press along your spine and the muscles on either side. Tell me where it's tender.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Ow. Right there. That right side is really sore. I can feel the muscle is all knotted up.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Yes, I can feel significant muscle spasm in the right paraspinal muscles, especially around the L4 to L5 level. The spine itself is not tender to direct palpation, which is a good sign. Now let me check your range of motion. Try to bend forward slowly for me.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "I can only go about this far. That's it. The tightness stops me.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "That's about thirty percent of normal flexion. Try leaning back gently.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "That's a little better but it still hurts. Maybe I can get about halfway.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Okay. Now I'm going to do a straight leg raise test. Please lie back on the table. I'll lift each leg one at a time. Tell me if you feel any pain shooting down your leg.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "Okay.",
      delayMs: 600,
    },
    {
      rawSpeakerId: 0,
      text: "I'm raising your right leg now. Tell me when you feel pain and where.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "I feel some tightness in my back at the very end but nothing going down the leg.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Good. And the left leg now.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "That one feels fine. No pain at all.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Excellent. The straight leg raise is negative on both sides, which means there's no evidence of nerve root compression from a disc herniation. Now I need to check your neurological function. I'm going to test the strength in your legs. Push down against my hand with your foot like you're pressing a gas pedal. Good. Now pull your foot up toward you. Good. Now push out to the side. Both legs are equal and strong, that's five out of five throughout.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 0,
      text: "I'm going to test sensation now. Can you feel me touching here on the top of your foot? How about the outer part of your calf? The inside of your ankle? Good. Sensation is intact in all the lumbar nerve distributions.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, I can feel everything. No numbness anywhere.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Let me check your reflexes. Knees first. Good, they're brisk and symmetrical. And the ankles. Also normal and equal on both sides. Your neurological exam is completely normal.",
      delayMs: 2200,
    },

    // — Diagnosis Discussion —
    {
      rawSpeakerId: 0,
      text: "Okay, you can sit up when you're ready. Let me tell you what I think is going on. Based on the history, the mechanism of injury, your exam findings, and the fact that your neurological exam is completely normal, I'm confident this is an acute lumbar muscle strain. Sometimes we call it a lumbar sprain. Essentially, when you lifted and twisted, you overstretched and likely tore some muscle fibers in your lower back.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "So it's just a muscle thing? Not a disc or anything?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Based on your exam, yes. The key findings that point away from a disc problem are that your straight leg raise test is negative, you have no pain radiating below the knee, and your strength, sensation, and reflexes are all normal. If a disc were pressing on a nerve, we'd almost always see some abnormality in one or more of those tests.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "That's a relief. But honestly it hurts so much I was worried it was something really serious. I could barely sleep the last two nights.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "I completely understand. The pain from a muscle strain can be incredibly intense, sometimes just as painful as a disc problem. The muscle spasm I'm feeling is your body's protective response, it's trying to splint the area and prevent further injury. The good news is that the vast majority of acute back strains like this improve significantly within two to four weeks, and most people are back to normal within six to eight weeks.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "Six to eight weeks? I can't be out of work that long. I've already missed two days and my supervisor is asking when I'll be back. We're short-staffed as it is.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "I hear you, and I don't expect you to be out that long. Most people with this can return to light duty work within a week or two. Full recovery with heavy lifting may take longer, but we'll work on getting you back as quickly and safely as possible. I can write you a note for modified duties at work.",
      delayMs: 2800,
    },

    // — Treatment Plan —
    {
      rawSpeakerId: 0,
      text: "Let's talk about a treatment plan. First, medications. I'm going to switch you from ibuprofen to naproxen, which is a similar anti-inflammatory but lasts longer so you only need to take it twice a day. Naproxen five hundred milligrams, take one tablet in the morning and one in the evening, always with food to protect your stomach. Take it consistently for the next ten to fourteen days.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Is that stronger than the Advil?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "It's in the same class of medications, the NSAIDs, but at this dose it provides more sustained relief because it stays in your system longer. The key is taking it on a schedule rather than waiting for the pain to get bad. That way you're staying ahead of the inflammation.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "I'm also going to prescribe cyclobenzaprine, which is a muscle relaxant. Take five milligrams at bedtime. It will help with the spasm and also help you sleep. It can make you drowsy, so only take it at night and don't drive after taking it.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "That would be amazing. I haven't slept more than a couple hours at a time since this happened. I can't find a comfortable position.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "I'd suggest trying to sleep on your side with a pillow between your knees, or on your back with a pillow under your knees. Both of those positions take pressure off the lower back. The muscle relaxant should help you get through the night.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "For the first forty-eight to seventy-two hours, ice is generally more helpful for acute inflammation. Apply an ice pack wrapped in a towel for fifteen to twenty minutes at a time, several times a day. After that initial period, you can switch to heat, which helps relax the muscle spasm. A heating pad on low for twenty minutes can be very soothing.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Should I just stay in bed until it gets better?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Actually, that's one of the most important things I want to discuss. Prolonged bed rest is actually one of the worst things for acute back pain. I know it seems counterintuitive when it hurts to move, but staying in bed for more than a day or two actually delays recovery. The muscles stiffen, deconditioning sets in, and it takes longer to get better.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Really? I would have thought rest was the best thing for it.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "It's a common misconception. What I recommend is relative rest, meaning avoid activities that aggravate the pain, especially bending, twisting, and heavy lifting. But do keep moving. Take short walks, even just five or ten minutes around the house several times a day. Gentle movement promotes blood flow to the area and helps with healing.",
      delayMs: 3000,
    },

    // — Physical Therapy Referral —
    {
      rawSpeakerId: 0,
      text: "I'm also going to refer you to physical therapy. I'd like you to start within the next week, once the acute spasm settles down a bit. The therapist will work on a few important things.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "What exactly will they do?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "First, they'll use hands-on techniques to help release the muscle spasm and improve mobility. Then they'll start you on a core strengthening program. Your core muscles, the abdominals, the deep stabilizers of the spine, these are the muscles that support and protect your lower back. Strengthening them is the single most important thing you can do to prevent this from happening again.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "I've heard people talk about core strength but I've never really done anything about it.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "That's very common, and with your type of physical work, it's especially important. The therapist will also teach you proper body mechanics for lifting and moving, which will be critical for your job. And they'll work on a gradual return-to-activity plan so you can safely get back to full duty at work.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "How many sessions are we talking about?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Usually six to eight sessions over about four to six weeks. Most of the exercises they teach you, you'll continue on your own at home. It's really about learning the exercises and building the habit.",
      delayMs: 2200,
    },

    // — Ergonomic & Prevention Counseling —
    {
      rawSpeakerId: 0,
      text: "Let's also talk about prevention, because I don't want you back in here with the same problem six months from now. Can you walk me through how you typically lift at work?",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "I mean, I try to lift with my legs but when you're doing it all day and you're in a hurry, sometimes you just grab and go. I know that's probably what got me in trouble this time.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "That's exactly it. The combination of a heavy load and the twisting motion is the classic mechanism for a back strain. Here's what I want you to focus on going forward. Always face the load directly, bend at the knees and hips, keep the object close to your body, and tighten your core muscles before you lift. Most importantly, never twist while holding something heavy. Move your feet to turn your whole body instead.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "Yeah, I know the rules. I just need to actually follow them.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "It's easier said than done, especially when you're under time pressure. If the load is over fifty pounds, get help or use equipment. It's not worth the injury. Does your workplace have any lifting equipment available? Hand trucks, dollies?",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Yeah, we have dollies and a forklift. I should probably use them more instead of trying to muscle through everything.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Absolutely. I'd also recommend asking your supervisor about an ergonomic assessment at your workstation. Sometimes simple changes like adjusting shelf heights or reorganizing where heavy items are stored can make a big difference.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "One other thing I want to mention. You said you haven't been exercising outside of work. Your job is physical, but it's repetitive physical activity, which is different from balanced exercise. Adding some general fitness, even two to three days a week of walking or swimming, plus the core exercises from PT, will make a significant difference in protecting your back.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "My wife has been trying to get me to walk with her in the evenings. I guess now I have a medical reason to actually do it.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "That would be perfect. Walking is one of the best exercises for overall back health. Start slow, even ten to fifteen minutes, and build up. And maintaining a healthy weight helps too, since every extra pound puts additional stress on the spine.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "I could stand to lose about fifteen pounds. I've put on some weight the last couple of years.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "The walking and the general activity should help with that. Even a modest weight loss of five to ten percent of your body weight can meaningfully reduce strain on the lower back. It doesn't have to happen overnight.",
      delayMs: 2400,
    },

    // — Follow-up & Safety Netting —
    {
      rawSpeakerId: 0,
      text: "I'd like to see you back in two weeks to check on your progress. By then, you should be noticeably improved. If the pain is significantly better, we'll keep the current plan going. If you're not improving as expected, we may need to get imaging, like an X-ray or MRI, at that point.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Do I need an X-ray or MRI now?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Based on your exam today, no. Current guidelines actually recommend against routine imaging for acute low back pain when the neurological exam is normal and there are no red flag symptoms, which is your situation. Imaging at this stage rarely changes what we do and can sometimes show incidental findings that cause unnecessary worry. If you're not better in two weeks, then we'll get imaging to look more closely.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "That makes sense. I just want to make sure we're not missing something.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "I understand that concern completely. Based on everything today, I'm very confident in the diagnosis. But I always want you to know what to watch for. There are certain symptoms that should prompt you to come back sooner or go straight to the emergency room.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "If you develop any numbness in the groin or inner thigh area, any loss of bladder or bowel control, sudden weakness in one or both legs, or if the pain becomes severe and uncontrollable despite the medications, go to the emergency room right away. Those could indicate a serious condition called cauda equina syndrome which requires urgent treatment.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Okay, I'll definitely watch for those things. What about if the pain just gets worse instead of better?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "If the pain is getting progressively worse over the next several days rather than gradually improving, or if you start developing new pain shooting down your leg below the knee, call the office and we'll get you in sooner than two weeks. Those changes would make me want to reassess.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Got it. And what about the work note? I'm going to need something for my employer.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "I'll write you a note for modified duty. No lifting over ten pounds, no repetitive bending or twisting for the next two weeks. I'd recommend going back to work in a couple of days on light duty if your employer can accommodate that. Being at work in some capacity, even if it's desk work or inventory paperwork, is actually better for recovery than staying home on the couch.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "I think they can find something for me to do. My supervisor is pretty reasonable about that stuff.",
      delayMs: 1600,
    },

    // — Closing —
    {
      rawSpeakerId: 0,
      text: "Good. Let me summarize the plan so we're on the same page. Naproxen five hundred milligrams twice a day with food for the next two weeks. Cyclobenzaprine five milligrams at bedtime for the muscle spasm, and I'll give you a one-week supply of that. Ice for the first day or two, then transition to heat. Keep moving, short walks, avoid prolonged bed rest. Start physical therapy within the next week. And follow up here in two weeks.",
      delayMs: 3400,
    },
    {
      rawSpeakerId: 1,
      text: "That all sounds good. I'm relieved it's not something worse. I was reading online about herniated discs and surgery and I was getting pretty anxious.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "I'd encourage you to stay away from Dr. Google for this one. The internet tends to present worst-case scenarios. The overwhelming majority of acute low back pain episodes resolve with conservative treatment like what we're doing. Less than one percent of back pain cases require surgery.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "That's good to hear. Thank you, doctor. I really appreciate you explaining everything so clearly.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "You're welcome. The front desk will set up your physical therapy referral and your two-week follow-up appointment. Take the medications as directed and start those short walks today if you can. You're going to get through this. Take care.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Thanks, doc. I'll see you in two weeks.",
      delayMs: 1000,
    },
  ],
}
