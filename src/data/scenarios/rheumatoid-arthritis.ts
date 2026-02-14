import type { Scenario } from "./index"

export const rheumatoidArthritisScenario: Scenario = {
  id: "rheumatoid-arthritis",
  name: "Rheumatoid Arthritis",
  description:
    "38-year-old female with 6 weeks of bilateral hand joint pain and morning stiffness lasting over 1 hour. Joint exam shows MCP/PIP synovitis. Labs confirm RF+, anti-CCP+, elevated ESR/CRP. Methotrexate initiation and rheumatology referral.",
  tags: ["rheumatology", "chronic", "new-diagnosis", "autoimmune"],
  entries: [
    // — Opening & Chief Complaint —
    {
      rawSpeakerId: 0,
      text: "Good morning. I'm Doctor Nolan. What brings you in today?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Hi, doctor. I've been having a lot of pain and stiffness in both of my hands. It's been going on for about six weeks now and it's getting worse.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "I'm sorry to hear that. Can you tell me more about the stiffness? When does it tend to be worst?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "It's definitely worst in the morning. When I wake up, my hands feel completely locked up. I can barely make a fist. It takes over an hour, sometimes closer to two hours, before they start to loosen up.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "Over an hour of morning stiffness is significant. Does it improve as you move around and use your hands?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, once I get moving it slowly gets better. But mornings are really rough. I can't open jars anymore, and buttoning my blouse for work has become almost impossible. I've had to switch to pullover tops.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "That must be very frustrating. Is the pain in both hands equally, or is one worse than the other?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "It's pretty much the same on both sides, which I thought was strange. The knuckles at the base of my fingers and the middle joints are the most swollen and painful.",
      delayMs: 2200,
    },

    // — History of Present Illness —
    {
      rawSpeakerId: 0,
      text: "The symmetric pattern is an important detail. Did this come on suddenly one day, or was it more gradual?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "It was gradual. It started about six weeks ago with some aching in my right hand. Then within a few days my left hand started hurting in the same spots. It's been slowly getting worse since then.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "Have you noticed any visible swelling in the joints?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, my knuckles look puffy, especially the second and third fingers on both hands. My husband noticed it too. He said my fingers look like little sausages in the mornings.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "Do the joints ever feel warm to the touch?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "They do, actually. When my husband touches my knuckles in the morning he says they feel warmer than the rest of my hand.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "How would you rate the pain on a scale of zero to ten?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "In the morning it's about a seven. By afternoon it comes down to maybe a four or five. But it never fully goes away anymore.",
      delayMs: 1800,
    },

    // — Joint-Specific History —
    {
      rawSpeakerId: 0,
      text: "Besides the knuckles and middle finger joints, are any other joints bothering you? Wrists, elbows, knees, feet?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Now that you mention it, both of my wrists have been sore too. And the balls of my feet have been aching. I thought maybe I needed new shoes, but it hasn't helped.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "Are the foot symptoms also symmetric, same areas on both feet?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, both feet in the same spots, right under the toes. Walking first thing in the morning feels like I'm stepping on pebbles.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "What about your knees or shoulders? Any stiffness or swelling there?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "My knees have been a little stiff in the mornings but not nearly as bad as my hands. No shoulder problems so far.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Are the tips of your fingers, the joints closest to your nails, involved at all?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "No, those feel fine. It's mainly the middle joints and the base of the fingers.",
      delayMs: 1200,
    },

    // — Past Medical & Family History —
    {
      rawSpeakerId: 0,
      text: "Have you ever been diagnosed with any type of arthritis or joint disease in the past?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "No, never. I've been pretty healthy my whole life. I'm only thirty-eight. I didn't expect to be dealing with joint problems at my age.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Do any autoimmune diseases run in your family? Conditions like lupus, rheumatoid arthritis, thyroid disease?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "My mother has lupus. She was diagnosed in her forties. She's had a rough time with it. Is that related?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "It can be. There's a genetic predisposition to autoimmune conditions. Having a first-degree relative with lupus does increase your risk of developing an autoimmune disease, though not necessarily the same one. Does anyone else in your family have joint problems or autoimmune conditions?",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "My maternal aunt has Hashimoto's thyroid disease. And my grandmother had really deformed hands when she was older. Nobody ever told me what she had, but I remember her fingers were bent and twisted.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "That's very relevant family history. Do you have any history of psoriasis, skin rashes, or inflammatory bowel disease?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "No, nothing like that. No skin issues at all.",
      delayMs: 800,
    },

    // — Review of Systems —
    {
      rawSpeakerId: 0,
      text: "I'd like to ask about some other symptoms. Have you been experiencing unusual fatigue beyond what the pain would cause?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "I'm exhausted all the time. It's a deep kind of tiredness, not just from poor sleep. I come home from work and just collapse on the couch. My husband has been taking over dinner because I'm too drained.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "Have you had any fevers or felt feverish?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "I've felt warm a few times, kind of flushed. I checked my temperature once and it was ninety-nine point four. Not a real fever, but higher than my normal.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Any unintentional weight loss?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "I've lost about four pounds without trying. My appetite hasn't been great.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Any dry eyes or dry mouth? And do your fingers ever turn white or blue in the cold?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "No to both. My eyes and mouth feel normal, and I've never had any color changes in my fingers. No rashes either.",
      delayMs: 1400,
    },

    // — Physical Examination —
    {
      rawSpeakerId: 0,
      text: "Good. Let me do a physical exam. Your vitals look normal. Blood pressure one-eighteen over seventy-six, heart rate seventy-four, temperature ninety-eight point eight. Can you lay your hands flat on the table, palms down? I'm going to palpate each joint.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Sure. Please be gentle, they're pretty tender right now.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "I can see visible swelling over the second and third MCP joints on both hands. The tissue feels boggy and warm. That's consistent with synovitis, which means inflammation of the joint lining. Your PIP joints on the second and third fingers are also swollen bilaterally.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Ow, yes, that one's really sore.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "I'm sorry. Your wrists show some mild swelling as well. I don't feel any nodules under the skin of your elbows or forearms, which is good. Can you try to squeeze my fingers? I want to test your grip strength.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "I'll try. That's as hard as I can squeeze. It's embarrassing, I used to have a strong grip.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Your grip strength is definitely reduced bilaterally. Let me check your feet. I'm going to squeeze across the metatarsal heads.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Ouch. Yes, that's exactly where it hurts when I walk in the morning.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "There's tenderness over the MTP joints bilaterally. Your knees show a very small effusion on the right but no warmth. No joint deformities anywhere, and the rest of the exam including heart, lungs, skin, and lymph nodes is normal.",
      delayMs: 2800,
    },

    // — Diagnostic Workup —
    {
      rawSpeakerId: 0,
      text: "Based on what I'm seeing, I'm concerned about an inflammatory arthritis, specifically rheumatoid arthritis. I want to order some blood tests and imaging. I'll need rheumatoid factor, anti-CCP antibodies, ESR, CRP, a complete blood count, and a comprehensive metabolic panel. I'll also order X-rays of both hands and wrists.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Rheumatoid arthritis? Isn't that what old people get? I'm only thirty-eight.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "It's actually most commonly diagnosed between the ages of thirty and fifty, and it's two to three times more common in women. It can affect anyone at any age. Let's get the labs first before we jump to conclusions.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "Okay. I'm scared, but let's do the tests.",
      delayMs: 1000,
    },

    // — Results Discussion —
    {
      rawSpeakerId: 0,
      text: "Your results are back and I want to go through them with you carefully. Your rheumatoid factor is positive with a titer of eighty-six, which is significantly elevated. Normal is below fourteen.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "That sounds really high. What does that mean exactly?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Rheumatoid factor is an antibody that's found in about eighty percent of people with rheumatoid arthritis. More importantly, your anti-CCP antibody is strongly positive at over two hundred and fifty units. This is the more specific test for RA and is very rarely positive in people who don't have the disease.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "So that confirms it?",
      delayMs: 600,
    },
    {
      rawSpeakerId: 0,
      text: "Combined with your clinical picture, yes. Your ESR is forty-five and your CRP is three point two, both elevated, which tells us there's significant active inflammation. Your CBC shows a mild anemia with a hemoglobin of eleven point four, which is common in chronic inflammatory conditions. Liver and kidney function are normal.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 0,
      text: "Your hand X-rays show periarticular osteopenia, meaning some bone thinning around the joints. The good news is there are no erosions yet. That means we're catching this relatively early.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "What does it mean that there are no erosions yet? Will there be?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Erosions are areas where inflammation has eaten away at the bone. If RA is left untreated, joint erosions can develop within the first two years in many patients. That's exactly why early diagnosis and aggressive treatment are so critical.",
      delayMs: 2600,
    },

    // — Diagnosis Explanation —
    {
      rawSpeakerId: 0,
      text: "Putting it all together, you meet the criteria for seropositive rheumatoid arthritis. You have symmetric inflammatory arthritis involving the small joints of the hands, wrists, and feet, positive RF and anti-CCP, elevated inflammatory markers, and symptoms lasting over six weeks.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Can you explain what exactly is happening in my joints? Why is my immune system doing this?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "In rheumatoid arthritis, your immune system mistakenly attacks the synovium, the thin membrane lining your joints. This causes inflammation that thickens the synovium, produces excess fluid, and over time can damage cartilage and bone. We don't fully understand what triggers it, but genetics, hormones, and environmental factors all play a role.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Is this going to be like my mother's lupus? She's been in and out of the hospital for years. I'm terrified of ending up like that, or like my grandmother with the twisted hands.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "I understand your fear, and those are valid concerns. But the treatment of RA has improved dramatically over the past twenty years. We now have medications that can effectively control the disease and prevent the kind of joint destruction your grandmother likely experienced. The key is starting treatment early, which is exactly what we're doing.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Will I have this for the rest of my life?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "RA is a chronic condition, so it won't go away completely. But with modern treatment, many patients achieve remission or low disease activity and lead full, active lives. The goal is to control the inflammation, relieve your symptoms, and prevent joint damage.",
      delayMs: 2600,
    },

    // — Treatment Discussion —
    {
      rawSpeakerId: 0,
      text: "The standard first-line treatment for RA is methotrexate. It's a disease-modifying antirheumatic drug, or DMARD, and it's been the cornerstone of RA treatment for decades. I'd like to start you on a low dose of ten milligrams once weekly.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "Methotrexate? Isn't that a chemotherapy drug? That sounds really scary.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "That's a very common concern. While methotrexate is used in much higher doses for cancer treatment, the doses we use for RA are significantly lower. At ten milligrams once a week, it works as an immune modulator, calming the overactive immune response rather than suppressing it completely.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "What about side effects? Will I lose my hair? Will I feel nauseous all the time?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Hair loss is very rare at these low doses. Some patients do experience mild nausea on the day they take it, which is why I'll also prescribe folic acid, one milligram daily. Folic acid significantly reduces side effects like nausea, mouth sores, and stomach upset without reducing the drug's effectiveness.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Are there other risks I should know about?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "The main things we monitor are liver function and blood counts. Methotrexate can affect the liver, so you'll need to limit alcohol. I'd recommend avoiding it entirely, or no more than one or two drinks per month. We'll check your liver enzymes and CBC every four to six weeks initially.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "I do enjoy a glass of wine with dinner sometimes. I'll cut that out if I need to. What else should I know?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Methotrexate can lower your immune system slightly, so be vigilant about infections. If you develop a fever, persistent cough, or any signs of infection, call us right away. Also, and this is critical, methotrexate absolutely cannot be taken during pregnancy. It can cause severe birth defects.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "My husband and I were actually talking about having another baby. How long would I need to be off it before trying?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "You'd need to stop methotrexate at least three months before attempting to conceive. That's something we'll coordinate very carefully with your rheumatologist when the time comes. There are pregnancy-compatible treatment options we can switch to.",
      delayMs: 2400,
    },

    // — Bridging Therapy —
    {
      rawSpeakerId: 0,
      text: "Now, methotrexate takes about four to eight weeks to reach its full effect. In the meantime, I'm going to prescribe a short course of prednisone, starting at fifteen milligrams daily and tapering down over three weeks.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "Is prednisone a steroid? I've heard steroids can cause weight gain and other problems.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Yes, it's a corticosteroid. For a short course like this, the side effects are usually minimal. You might notice some increased appetite, mild fluid retention, or difficulty sleeping. Take it in the morning to minimize the sleep issue. Long-term high-dose steroids carry more risks, which is exactly why we're tapering quickly and using methotrexate as the long-term solution.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "How quickly will the prednisone help?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Most patients feel significant improvement within two to three days. Your morning stiffness should decrease, the swelling should reduce, and your pain should be much more manageable. Think of it as a bridge to carry you until the methotrexate kicks in.",
      delayMs: 2400,
    },

    // — Alternative/Complementary Treatments —
    {
      rawSpeakerId: 1,
      text: "Doctor, I have to ask, are there any natural treatments? My sister-in-law has been telling me about turmeric and fish oil. Could I try those instead of methotrexate?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "I appreciate you asking. Fish oil has some modest anti-inflammatory properties and some patients find it helpful as a complement to their medications. Turmeric may have mild benefits as well. However, neither can replace a DMARD like methotrexate. Without proper disease-modifying therapy, RA will very likely progress and cause irreversible joint damage.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "I understand. I just wanted to explore all the options. I'll take the methotrexate.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "That's a wise decision. You're welcome to add fish oil and an anti-inflammatory diet alongside your medications. Many patients find a combination approach works best. Just always tell me about any supplements you're taking so we can check for interactions.",
      delayMs: 2600,
    },

    // — Rheumatology Referral & Follow-up —
    {
      rawSpeakerId: 0,
      text: "I'm placing an urgent referral to Dr. Patel, a rheumatologist in our system. Given your strongly positive antibodies and active disease, I want you seen within two to three weeks.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 1,
      text: "Why do I need a specialist if you've already diagnosed it and started treatment?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "A rheumatologist is the expert in managing RA long-term. They'll monitor your disease activity, adjust medications, and determine if you need additional therapies. If methotrexate alone doesn't control it, they can add biologic medications which are very effective.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "What are biologic medications?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Biologics are targeted therapies that block specific parts of the immune system driving RA inflammation. Drugs like adalimumab, etanercept, or tocilizumab. They're typically added if methotrexate alone isn't sufficient. But let's see how you respond first. Many patients do very well on methotrexate alone.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "I also want to talk about joint protection. Avoid activities that stress your inflamed joints. Use larger joints when you can, for example carry bags on your forearm instead of gripping with your fingers. There are assistive devices like jar openers and button hooks that can help with daily tasks.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Should I stop exercising? I've been afraid that moving will make it worse.",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "No, quite the opposite. Gentle exercise is very important. Range-of-motion exercises keep your joints flexible, and low-impact activities like swimming, walking, and cycling help maintain strength without stressing the joints. I'd avoid heavy weightlifting with your hands for now. A physical therapist who specializes in arthritis can design a program for you.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 0,
      text: "Let me summarize the plan. Methotrexate ten milligrams once weekly, folic acid one milligram daily, and prednisone fifteen milligrams daily with a three-week taper. Blood work in four to six weeks to check liver function and counts. Urgent rheumatology referral.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "What should I watch for that would mean I need to call sooner?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Call us if you develop a fever over one-oh-one, severe nausea or vomiting, yellowing of your skin or eyes, unusual bruising or bleeding, persistent cough, or if your joint symptoms significantly worsen despite the prednisone.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "Doctor, I'm trying to stay positive but I'm really scared. My grandmother couldn't even hold a cup by the time she passed. Is that what's going to happen to me?",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "I hear you, and it's completely natural to feel scared. But your grandmother likely didn't have access to the treatments we have now. Methotrexate wasn't widely used for RA until the late nineteen eighties, and biologics are even newer. We caught this early, your X-rays show no erosions, and we're starting treatment right away. The outlook for patients diagnosed today is dramatically better.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "That does make me feel a little better. What's the realistic best-case scenario?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 0,
      text: "Realistically, with proper treatment, many patients achieve remission or near-remission. That means minimal pain, no swelling, and normal function. You should be able to do almost everything you do now. It requires consistent medication and regular monitoring, but a full and active life is absolutely achievable.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "Thank you for being honest with me and explaining everything so thoroughly. When do I start the medications?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Start the prednisone today. For methotrexate, pick a day of the week that works best. Some patients prefer Saturdays so any nausea doesn't affect the workday. Take folic acid every day except the day you take methotrexate. I'll send the prescriptions to your pharmacy now.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 1,
      text: "I'll pick Saturday for the methotrexate. Is there anything I should do before my rheumatology appointment?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Keep a symptom journal. Track your morning stiffness duration, which joints hurt, your pain level, and how the medications are affecting you. That information will be extremely valuable for the rheumatologist. Write down any questions you think of, and bring your husband or a support person if that helps.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 1,
      text: "I'll definitely do that. Thank you so much, doctor. I feel like I have a plan now, and that helps with the anxiety.",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "You're very welcome. You're being proactive by coming in early, and that makes all the difference with RA. We're going to manage this together. My office will call with the rheumatology appointment, and I'll see you in six weeks for follow-up labs. Don't hesitate to call if anything comes up before then.",
      delayMs: 3200,
    },
  ],
}
