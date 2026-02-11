import type { Scenario } from "./index"

export const anxietyScenario: Scenario = {
  id: "anxiety",
  name: "Generalized Anxiety Disorder",
  nameKo: "불안장애 상담",
  description:
    "2개월간 지속된 불안, 수면 장애, 신체 증상으로 내원. GAD-7 문진, 치료 옵션(CBT/SSRI) 논의, 안전 평가.",
  tags: ["psychiatry", "mental-health", "new-diagnosis", "counseling"],
  entries: [
    // — Opening —
    {
      rawSpeakerId: 0,
      text: "Good afternoon. I see from the intake form that you've been experiencing some anxiety and sleep difficulties. Can you tell me more about what's been going on?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "Hi, doctor. Honestly, I've been struggling for about two months now. I feel anxious almost all the time. My mind just won't stop racing. I worry about everything, work, finances, my health, things that might go wrong. It's exhausting.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 0,
      text: "That sounds really difficult. When you say your mind is racing, is this mainly during the day, at night, or both?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Both, but it's worst at night. I lie in bed and I can't turn my brain off. I go through every conversation I had during the day, every email I sent, wondering if I said the wrong thing. Then I start worrying about tomorrow. It takes me one to two hours to fall asleep most nights.",
      delayMs: 3200,
    },

    // — Sleep Assessment —
    {
      rawSpeakerId: 0,
      text: "How many hours of sleep are you actually getting per night?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "Maybe four to five hours on a good night. I wake up around three or four AM and can't get back to sleep. I just lie there worrying. Then the alarm goes off at six thirty and I'm already exhausted.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "Early morning awakening with inability to return to sleep. That's something we need to pay attention to. How long has the sleep issue been going on?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "The sleep problems started about three months ago, maybe a little before the anxiety really ramped up. At first it was occasional, now it's almost every night.",
      delayMs: 2200,
    },

    // — Physical Symptoms —
    {
      rawSpeakerId: 0,
      text: "Are you experiencing any physical symptoms along with the anxiety? Things like a racing heart, tension, stomach issues?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Yes, actually. My heart races sometimes, especially in the morning. I feel this tightness in my chest. My hands shake when I'm really anxious. I thought I might be having heart problems, but I went to urgent care and they said my heart was fine.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "Did they do an ECG and blood work at urgent care?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "Yes. ECG was normal and they checked my thyroid and it was fine too. They said it was probably anxiety and told me to see my regular doctor.",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 0,
      text: "Good, I'm glad those were checked. Anxiety can absolutely cause all of those physical symptoms. How about your stomach? Any nausea, diarrhea, appetite changes?",
      delayMs: 2000,
    },
    {
      rawSpeakerId: 1,
      text: "My appetite is all over the place. Some days I barely eat because my stomach is in knots. Other days I stress eat and then feel terrible about it. I've also been getting tension headaches almost daily, across my forehead and the back of my neck.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "Muscle tension is very common with anxiety. Any difficulty concentrating at work or feeling like your mind goes blank?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Definitely. I used to be really focused and productive. Now I reread the same email three times and still don't process it. My boss noticed too. She asked if everything was okay because I missed a deadline last week. That just made the anxiety worse.",
      delayMs: 2800,
    },

    // — Stressors & History —
    {
      rawSpeakerId: 0,
      text: "Let's talk about what might be driving this. Has anything significant happened in your life in the past few months?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 1,
      text: "Our company went through a restructuring three months ago. My role changed and I'm now managing a bigger team with more responsibilities. I feel like I'm in over my head. My marriage has been strained because I'm always stressed and irritable. My wife says I'm not present even when I'm home.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 0,
      text: "Have you experienced anything like this before? Any history of anxiety or depression?",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 1,
      text: "I had some anxiety in college during finals, but nothing like this. It always went away. I've never been on any psychiatric medication. My mother has depression and takes antidepressants, but I don't think I'm depressed. I'm just anxious.",
      delayMs: 2800,
    },

    // — GAD-7 Screening —
    {
      rawSpeakerId: 0,
      text: "I'd like to do a brief standardized questionnaire called the GAD-7 to help assess the severity of your anxiety. Over the last two weeks, how often have you been bothered by feeling nervous, anxious, or on edge?",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "Nearly every day.",
      delayMs: 800,
    },
    {
      rawSpeakerId: 0,
      text: "Not being able to stop or control worrying?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Nearly every day for that one too.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Worrying too much about different things?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Every day. I worry about everything.",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 0,
      text: "Trouble relaxing?",
      delayMs: 800,
    },
    {
      rawSpeakerId: 1,
      text: "Constantly. I can't remember the last time I actually felt relaxed.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Being so restless that it's hard to sit still?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Several days a week. I pace around the house sometimes.",
      delayMs: 1400,
    },
    {
      rawSpeakerId: 0,
      text: "Becoming easily annoyed or irritable?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Nearly every day. I snap at my wife and kids over little things and then feel guilty about it.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "Feeling afraid as if something awful might happen?",
      delayMs: 1000,
    },
    {
      rawSpeakerId: 1,
      text: "Several days a week. I have this constant sense of dread, like something bad is about to happen even when logically I know everything is fine.",
      delayMs: 2200,
    },

    // — Depression & Safety Screen —
    {
      rawSpeakerId: 0,
      text: "Your score on the GAD-7 is eighteen out of twenty-one, which indicates severe anxiety. I also need to ask you some important questions about your mood. Over the past two weeks, have you felt down, depressed, or hopeless?",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 1,
      text: "Sometimes I feel hopeless, like this is never going to get better. But I wouldn't say I'm depressed exactly. I still enjoy things when I can actually get out of my own head.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "I appreciate your honesty. I need to ask this directly, and please know it's a routine question we ask everyone. Have you had any thoughts of harming yourself or not wanting to be alive?",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 1,
      text: "No, nothing like that. I have my family and I want to be here for them. I just want to feel normal again. I want to enjoy things without this constant knot in my stomach.",
      delayMs: 2400,
    },
    {
      rawSpeakerId: 0,
      text: "I'm glad to hear that, and I'm glad you told me. Thank you for being open about that.",
      delayMs: 1400,
    },

    // — Substance Use —
    {
      rawSpeakerId: 0,
      text: "A few more questions. How much caffeine are you consuming daily?",
      delayMs: 1200,
    },
    {
      rawSpeakerId: 1,
      text: "Probably too much. Four to five cups of coffee, mostly because I'm so tired from not sleeping. I also have an energy drink in the afternoon sometimes.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "That much caffeine can significantly worsen anxiety symptoms and disrupt sleep. We'll need to address that. How about alcohol?",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 1,
      text: "I've been having a glass or two of wine most nights to try to unwind. Sometimes three. It's the only way I can relax enough to eventually fall asleep.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "I understand the impulse, but alcohol actually disrupts sleep architecture. It might help you fall asleep initially, but it causes more waking during the night and worsens sleep quality. It can also increase anxiety the next day as it wears off.",
      delayMs: 2600,
    },

    // — Treatment Options —
    {
      rawSpeakerId: 0,
      text: "Based on everything you've told me and your GAD-7 score, I believe you're experiencing generalized anxiety disorder. The good news is this is very treatable. I'd like to discuss two main approaches that work best together.",
      delayMs: 2600,
    },
    {
      rawSpeakerId: 0,
      text: "The first is cognitive behavioral therapy, or CBT. This is a type of therapy with a trained therapist where you learn to identify and challenge the thought patterns that fuel your anxiety. It's the most evidence-based psychotherapy for anxiety and many patients see significant improvement within eight to twelve sessions.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "I've thought about therapy but I wasn't sure if it really works. What about medication?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "That brings me to the second approach. I'd recommend starting an SSRI, specifically sertraline, also known as Zoloft. We'd start at a low dose of twenty-five milligrams for the first week, then increase to fifty milligrams. SSRIs are first-line treatment for generalized anxiety and have a strong evidence base.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "I've heard antidepressants can have a lot of side effects. What should I expect?",
      delayMs: 1600,
    },
    {
      rawSpeakerId: 0,
      text: "Common side effects in the first one to two weeks include mild nausea, headache, and sometimes a temporary increase in anxiety. These usually improve as your body adjusts. Some people experience changes in appetite or sleep initially. An important thing to know is that the full therapeutic effect takes about four to six weeks, so don't be discouraged if you don't feel different right away.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "Four to six weeks. That feels like a long time when you're feeling this bad every day.",
      delayMs: 1800,
    },
    {
      rawSpeakerId: 0,
      text: "I understand. Many patients do notice some improvement within two to three weeks. For the short term, I can also prescribe a small supply of hydroxyzine, which is an antihistamine that helps with acute anxiety and can help with sleep. It's non-addictive and you can take it as needed, especially at bedtime.",
      delayMs: 2800,
    },

    // — Lifestyle Recommendations —
    {
      rawSpeakerId: 0,
      text: "Alongside medication and therapy, here are some lifestyle changes that will help. First, gradually reduce the caffeine. Cut down to two cups of coffee maximum and eliminate the energy drinks. Second, reduce alcohol to no more than one drink per night, ideally none on most nights.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "Third, regular exercise is one of the most effective natural anti-anxiety treatments. Even thirty minutes of moderate exercise like brisk walking can significantly reduce anxiety. Fourth, establish a consistent sleep routine. No screens for an hour before bed, same bedtime each night, and consider a relaxation practice like deep breathing or progressive muscle relaxation.",
      delayMs: 3200,
    },
    {
      rawSpeakerId: 1,
      text: "I'm willing to try all of that. I just want to feel like myself again. When should I come back?",
      delayMs: 1800,
    },

    // — Follow-up Plan —
    {
      rawSpeakerId: 0,
      text: "I'd like to see you in two weeks to check how you're tolerating the sertraline and whether we need to adjust the dose. At that visit we'll also repeat the GAD-7 to track your progress. In the meantime, I'll give you a referral list for CBT therapists in the area who take your insurance.",
      delayMs: 2800,
    },
    {
      rawSpeakerId: 0,
      text: "One more thing. If at any point you develop worsening symptoms, especially any thoughts of self-harm, new or worsening panic attacks, or any concerning side effects from the medication, please call our office right away or go to the emergency room. The crisis line number is also on the paperwork I'll give you.",
      delayMs: 3000,
    },
    {
      rawSpeakerId: 1,
      text: "Thank you, doctor. Just talking about this and having a plan already makes me feel a little better. I've been putting this off for weeks because I was embarrassed.",
      delayMs: 2200,
    },
    {
      rawSpeakerId: 0,
      text: "There is absolutely nothing to be embarrassed about. Anxiety disorders are incredibly common, affecting millions of people. Coming in and asking for help is a sign of strength, not weakness. We're going to work through this together. I'll see you in two weeks.",
      delayMs: 2800,
    },
  ],
}
