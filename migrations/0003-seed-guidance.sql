-- Seed THINK+SMART protocol guidance content
-- Uses INSERT OR IGNORE so re-running this migration is safe.

INSERT OR IGNORE INTO protocol_guidance (id, topic, content, version) VALUES

('guidance-keto-adaptation', 'keto_adaptation',
'Keto adaptation is the 1–2 week process of your body switching from burning glucose to burning fat and ketones as its primary fuel. It is the hardest part of the protocol and symptoms are normal — they are signs of metabolic change, not failure.

Common experiences include fatigue, brain fog, headaches, irritability, and strong carb cravings. These arise because your brain is temporarily running low on glucose before it adapts to ketones. Most symptoms resolve by day 10–14.

The most effective strategies during this phase: stay strictly within your carb target (every gram matters now), replenish electrolytes aggressively (sodium, potassium, magnesium — see the electrolytes topic), drink plenty of water, prioritise sleep, and avoid intense exercise for the first week. Eating enough fat and calories prevents unnecessary suffering — this is not a calorie-restriction diet.

Ketone readings during weeks 1–2 may be erratic or lower than your goal range. This is normal — full adaptation takes time. Track consistently and look for an upward trend by day 10.',
'1.0'),

('guidance-electrolytes', 'electrolytes',
'Electrolyte loss is the primary cause of keto flu symptoms. When insulin drops on a ketogenic diet, the kidneys excrete more sodium, which pulls potassium and water with it. You must actively replace these.

Sodium: Aim for 3–5g of sodium per day (significantly more than standard recommendations). Salt your food liberally, drink a salted electrolyte drink, or use bouillon cubes. This single change eliminates most headaches and fatigue.

Potassium: Aim for 3,000–4,500mg/day. Sources include avocado, salmon, leafy greens, and electrolyte supplements. Do not take high-dose potassium supplements without medical supervision — excess potassium is dangerous.

Magnesium: 300–500mg/day, preferably magnesium glycinate or malate (easier on the gut than oxide). Helps with sleep, muscle cramps, and mood. Many people are already deficient.

Signs of low electrolytes: muscle cramps, heart palpitations, headaches, constipation, fatigue, and poor sleep. If symptoms are severe or persistent, contact your care team.',
'1.0'),

('guidance-sleep-and-ketosis', 'sleep_and_ketosis',
'Sleep and ketosis have a bidirectional relationship — poor sleep raises cortisol and blood glucose, which can knock you out of ketosis, while deep ketosis can improve sleep quality and architecture over time.

During keto adaptation (weeks 1–2), sleep may be disrupted due to electrolyte shifts and changes in adenosine metabolism. Prioritise 7–9 hours, keep a consistent sleep and wake time, and avoid screens in the hour before bed. Magnesium glycinate before bed supports both sleep quality and electrolyte balance.

Once adapted, many people report deeper sleep, more vivid dreams, and improved morning alertness. Ketones are a preferred fuel for the brain and support GABA (calming) over glutamate (excitatory) activity.

Circadian alignment amplifies the benefits: eat within a consistent window, get morning sunlight, and avoid eating in the last 2–3 hours before sleep. Late-night eating raises insulin and can reduce ketone levels overnight.

Track sleep hours and quality alongside your ketone readings to spot correlations — this data is valuable context for your care team.',
'1.0'),

('guidance-mental-health-and-ketosis', 'mental_health_and_ketosis',
'A ketogenic diet affects brain metabolism directly — ketones provide an alternative fuel to glucose and modulate neurotransmitters including GABA, glutamate, serotonin, and dopamine. For some people with mood disorders, anxiety, or cognitive difficulties, this shift can be profoundly beneficial. For others, the adaptation period can temporarily worsen symptoms.

What to expect in weeks 1–2: mood may be lower, irritability is common, and anxiety can temporarily increase. This is partly metabolic (low glucose, electrolyte shifts) and partly withdrawal from high-carb foods. These effects typically resolve as adaptation completes.

After adaptation: many people report improved mood stability, reduced anxiety, better focus, and more emotional resilience. Track these outcomes with the log_mood tool so you can see your own trend.

Important safety considerations: if you take psychiatric medications, work closely with your prescribing doctor before starting or during the protocol. Ketosis can alter medication requirements (including lithium levels and seizure medication dosing). Never adjust medications without medical supervision.

If you experience a mental health crisis at any point, contact your care team or a crisis service immediately. This protocol supports but does not replace clinical care.',
'1.0'),

('guidance-carb-target', 'carb_target',
'Keeping carbohydrates low enough to maintain ketosis is the core dietary requirement of THINK. Most people achieve therapeutic ketosis with 20g or fewer net carbs per day, though your personal threshold may vary.

Net carbs = total carbs minus dietary fibre. In countries that include fibre in total carb counts on labels, subtract it. Sugar alcohols (erythritol is fine; maltitol is not — it raises blood sugar significantly) should be assessed individually.

Foods to eliminate: bread, pasta, rice, potatoes, corn, sugar, most fruit, legumes, and anything containing flour or added sugars. Read labels carefully — processed foods often contain hidden carbs.

Foods to count carefully: dairy (milk contains lactose), nuts and seeds (count in quantity), vegetables above ground (most are low-carb but track them), condiments and sauces.

Practical approach: use a food tracking app for the first 2–4 weeks to build awareness of carb content. After that, many people can estimate reliably. Use the log_meal tool to build a picture of your intake — the AI can help identify carb sources that may be slowing ketosis.',
'1.0'),

('guidance-protein-and-fat', 'protein_and_fat',
'On a ketogenic diet, fat is your primary fuel source and protein is kept at a moderate level — enough to preserve muscle mass but not so much that excess amino acids convert to glucose (gluconeogenesis) and reduce ketone production.

Protein: A common starting target is 1.2–1.7g per kg of lean body mass per day. Athletes or those doing resistance training trend toward the higher end. If you are losing muscle mass or feel weak, increase protein. If ketones are consistently low despite strict carbs, consider whether protein intake is too high.

Fat: Eat enough fat to feel satisfied and avoid hunger. Fat should make up the majority of your calories. Quality matters: prioritise fatty fish, eggs, butter, ghee, extra-virgin olive oil, avocado, and unprocessed animal fats. Minimise refined seed oils (canola, soybean, sunflower) in large quantities.

Calories: Most people find appetite naturally reduces on a ketogenic diet. Do not aggressively restrict calories in the first 4–6 weeks — adequate fat intake supports adaptation. After adaptation, natural caloric reduction often follows.',
'1.0'),

('guidance-fasting', 'fasting',
'Intermittent fasting and ketosis are highly synergistic — fasting depletes glycogen stores and accelerates the transition into ketosis, while ketosis makes fasting easier by reducing hunger hormones (ghrelin) and stabilising blood sugar.

Common fasting protocols compatible with THINK:
- 16:8 (eat within an 8-hour window, fast 16 hours including sleep) — a sustainable daily approach
- 18:6 or 20:4 — more aggressive daily fasting for deeper ketosis
- 24-hour fasts occasionally — can be used to break plateaus or deepen adaptation
- Protein-sparing modified fasting — ask your care team for guidance

Benefits of fasting on keto: deeper ketosis, improved insulin sensitivity, cellular autophagy, and mental clarity during the fast.

Cautions: fasting is not appropriate for everyone. People with a history of disordered eating, those who are underweight, pregnant or breastfeeding women, and those on certain medications should discuss fasting with their care team before starting. Start slowly — a 12-hour overnight fast is a safe starting point.',
'1.0'),

('guidance-supplementation', 'supplementation',
'Several supplements are commonly used on a ketogenic diet to address nutrient gaps and support adaptation. Always discuss supplementation with your care team, especially if you take medications.

Core electrolytes (see the electrolytes topic): sodium, potassium, magnesium. These are the most important and most commonly neglected.

Omega-3 fatty acids (fish oil or algae oil): supports brain health, inflammation regulation, and metabolic health. Aim for 2–3g of EPA+DHA combined per day.

Vitamin D3 + K2: many people are deficient in vitamin D. D3 supports mood, immune function, and metabolic health. K2 (MK-7 form) helps direct calcium to bones rather than arteries. Test your levels before supplementing high doses.

Creatine monohydrate: supports muscle and cognitive performance. May be especially helpful during adaptation.

B vitamins: a B-complex can support energy metabolism and neurological function, especially during adaptation.

What to avoid: weight-loss supplements, stimulant stacks, and anything not discussed with your care team. Many supplements interact with medications.',
'1.0'),

('guidance-smart-move', 'smart_move',
'Movement is the M in SMART and one of the most evidence-backed interventions for metabolic and mental health. On a ketogenic diet, exercise and movement work synergistically with nutritional ketosis.

During keto adaptation (weeks 1–2): keep exercise moderate. Walking, stretching, and gentle yoga support adaptation without creating additional metabolic stress. Intense training during adaptation can cause extreme fatigue and is not recommended.

After adaptation: exercise improves insulin sensitivity, deepens ketosis, supports muscle mass (which is protective for metabolic health), and directly benefits mood through BDNF (brain-derived neurotrophic factor) release.

Recommended movement types:
- Low-intensity aerobic activity (walking, cycling, swimming): 30–60 min daily. Especially effective at burning fat and ketones.
- Resistance training (weights, bodyweight): 2–3 times per week. Preserves and builds muscle, improves insulin sensitivity.
- High-intensity intervals (HIIT): 1–2 times per week after adaptation. Increases mitochondrial density.

Exercise timing: some people find fasted morning exercise deepens ketosis. Others feel better exercising after eating. Experiment and log what works for you.',
'1.0'),

('guidance-smart-avoid', 'smart_avoid',
'The A in SMART stands for Avoid — substances and behaviours that undermine metabolic health, mental health, and your ketosis practice.

Alcohol: alcohol is metabolised before fat and ketones, effectively pausing fat-burning and ketosis for hours. It disrupts sleep quality, raises cortisol, and can trigger carb cravings. If you choose to drink, dry wines and spirits are the lowest-carb options — but understand the metabolic cost.

Ultra-processed foods: even "keto" labelled products often contain maltitol (a high-glycaemic sugar alcohol), seed oils, artificial additives, and hidden carbs. Prioritise whole foods.

Inflammatory foods: seed oils in large quantities (canola, soybean, corn, sunflower) are pro-inflammatory. Trans fats are harmful. Minimise these.

Caffeine and stimulants: moderate caffeine is compatible with keto and may enhance ketone production. However, excess caffeine raises cortisol, disrupts sleep, and worsens anxiety. Keep intake consistent and before noon if possible.

Chronic stress: stress raises cortisol, which raises blood glucose and suppresses ketosis. Identify your key stress triggers and use the rebuild pillar to address them. Log avoided triggers using the log_smart tool.',
'1.0'),

('guidance-smart-rebuild', 'smart_rebuild',
'Rebuild is the R in SMART — the pillar covering therapies, relationships, habits, and structures that support long-term healing and wellbeing.

Therapeutic practices to consider:
- Psychotherapy or counselling: especially important if metabolic dysfunction intersects with mental health. Cognitive-behavioural therapy (CBT), acceptance and commitment therapy (ACT), and dialectical behaviour therapy (DBT) are well-evidenced.
- Mindfulness and meditation: 10–20 minutes daily supports HRV, cortisol regulation, and emotional resilience.
- Journaling: captures mood patterns, triggers, and insights. Pairs well with daily logging.
- Breathwork: techniques like box breathing and physiological sighs activate the parasympathetic nervous system.

Relationships and community: social connection is one of the strongest predictors of mental health outcomes. Prioritise relationships that support your protocol and overall wellbeing. Consider finding a community of others following a ketogenic approach.

Routine and structure: consistent sleep times, meal windows, and daily habits reduce cognitive load and cortisol. Small, consistent actions compound into large change over time.

Log rebuild activities with the log_smart tool — tracking these pillars builds accountability and helps your care team see the full picture.',
'1.0'),

('guidance-smart-track', 'smart_track',
'Track is the T in SMART — the ongoing monitoring that makes your protocol data-driven and allows early detection of problems.

What to track and how often:

Ketones (BHB): daily or every other day, especially in the first 6 weeks. Morning fasting readings give the most consistent baseline. Use log_ketone to record. Add glucose readings when possible — GKI (Glucose Ketone Index) is a more sensitive marker of metabolic state.

Mood, energy, focus, anxiety: daily with log_mood. These are your primary mental health outcome measures. Even a 30-second daily check-in builds a valuable dataset over weeks.

Sleep: daily with log_sleep. Sleep hours and quality correlate strongly with next-day mood and ketone levels.

Food: at minimum during the first 4 weeks, use log_meal to track intake. After that, track whenever ketones are unexpectedly low or mood is poor — food is often the missing variable.

Labs (with your care team): baseline bloodwork before starting, then at 6 weeks and 3 months. Key markers: fasting glucose, insulin, HbA1c, lipid panel, CMP, B12, D3, magnesium, thyroid (TSH/T3/T4 if relevant). Some practitioners also track hsCRP (inflammation) and fasting ketones.

Use get_weekly_summary to review your week and share the output with your care team at appointments.',
'1.0');
