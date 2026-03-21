/**
 * templates.js
 *
 * Ten pre-written email variants urging House representatives to support
 * legislation repealing the 1929 Apportionment Act and expanding the House.
 *
 * Placeholders:
 *   {{REP_LAST_NAME}}      — replaced with representative's last name
 *   {{REP_FULL_NAME}}      — replaced with representative's full name
 *   {{CONSTITUENT_NAME}}   — replaced with the constituent's full name
 *
 * One variant is chosen randomly on page load and locked for that session.
 */

const EMAIL_SUBJECT = "Please support uncapping the House of Representatives";

const EMAIL_TEMPLATES = [
  // ── Variant 1: Founders' Intent & Historical Precedent ──────────────────
  {
    id: "founders-intent",
    angle: "Founders' intent and historical precedent",
    body: `Dear Representative {{REP_LAST_NAME}},

I am writing to urge you to support legislation to repeal the 1929 Apportionment Act and restore the constitutional design of the U.S. House of Representatives.

The Framers created the House as the branch closest to the people, explicitly intending it to grow alongside the population. For the first 140 years of our republic, it did. From 1789 to 1913, Congress regularly expanded the House to keep pace with a growing nation—from 65 members to 435. Then, in 1929, Congress quietly froze that number. No constitutional amendment. No national debate. Just a statute that broke a 140-year tradition.

James Madison wrote in Federalist No. 52 that the House should have "an immediate dependence on, and an intimate sympathy with, the people." With 435 members serving over 335 million Americans, that sympathy has been stretched beyond recognition. The average district now holds more than 760,000 constituents—nearly eight times the size the Founders envisioned.

Repealing the 1929 cap is not a partisan act. It is a restorative one. I urge you to support this legislation and give the Founders' vision of representative government a chance to work as intended.

Respectfully,
{{CONSTITUENT_NAME}}`
  },

  // ── Variant 2: Plain-Spoken Constituent Voice ────────────────────────────
  {
    id: "plain-spoken",
    angle: "Plain-spoken constituent voice",
    body: `Dear Representative {{REP_LAST_NAME}},

I'll be honest: most of the time I feel like my voice doesn't reach Washington. By the time my concern gets filtered through a staff member, a form response, and a packed schedule, it doesn't feel like representation—it feels like noise.

That's not a criticism of you personally. It's the math. You represent over 760,000 people. Even if you worked every waking hour, you couldn't meaningfully connect with that many constituents.

I'm asking you to support repealing the 1929 Apportionment Act. The House hasn't grown in nearly a century, even as America's population has tripled. More members means smaller districts, more direct access, and representatives who actually know the community they serve.

This isn't about politics. It's about making government work for regular people again. I believe you got into public service because you wanted to make a difference. Please support expanding the House so that's actually possible.

Thank you for your time.

{{CONSTITUENT_NAME}}`
  },

  // ── Variant 3: Gerrymandering & Electoral Integrity ──────────────────────
  {
    id: "gerrymandering",
    angle: "Gerrymandering and electoral integrity",
    body: `Dear Representative {{REP_LAST_NAME}},

The United States faces a crisis of electoral integrity—not from voting machines or ballot fraud, but from the systematic manipulation of district lines. Gerrymandering is rampant, and one of the most powerful ways to reduce it is to expand the House of Representatives.

Here's why: with only 435 seats divided among 50 states and 435 districts, the mathematical leverage available to mapmakers is enormous. Packing and cracking are easy when districts are large. Smaller districts created by a larger House would reduce the efficiency of extreme gerrymanders and make maps more resistant to manipulation.

I urge you to support legislation repealing the 1929 Apportionment Act, which froze House membership at 435 for nearly a century. More districts mean more competition, more accountability, and a harder target for partisan line-drawing.

If you believe in free and fair elections, expanding the House is one of the most concrete structural reforms available. I hope you will champion this cause.

Sincerely,
{{CONSTITUENT_NAME}}`
  },

  // ── Variant 4: Representation Ratio Math / International Comparison ──────
  {
    id: "representation-math",
    angle: "Representation ratio math and international comparison",
    body: `Dear Representative {{REP_LAST_NAME}},

The numbers tell a stark story. Each U.S. House member today represents roughly 760,000 constituents. In the United Kingdom, each Member of Parliament represents around 72,000 people. In Canada, it's about 100,000. Germany, France, Japan—virtually every peer democracy gives its citizens far more direct representation than we do.

When the House last expanded in 1913, each member represented about 210,000 people. The Founders expected roughly one representative per 30,000—a ratio enshrined in the original constitutional text. The 1929 Apportionment Act froze the House at 435, and no statute, no amendment, no national referendum changed that. Three hundred million more Americans arrived, and Congress simply didn't adjust.

This is not sustainable. It produces legislatures disconnected from their constituents, inaccessible offices, and representation so diluted as to be nearly theoretical.

I urge you to support repealing the 1929 cap. Expanding the House would bring American representation ratios closer to international norms and to the design our Constitution actually contemplates.

With respect,
{{CONSTITUENT_NAME}}`
  },

  // ── Variant 5: Civic Distance & Constituent Access ───────────────────────
  {
    id: "civic-distance",
    angle: "Civic distance and constituent access",
    body: `Dear Representative {{REP_LAST_NAME}},

When was the last time you could sit down with every community in your district? Visit every county seat, every rural town, every urban neighborhood? With 760,000 constituents, the honest answer is: probably never.

This is the hidden cost of an undersized House. Civic distance—the gap between elected officials and the people they serve—is not just an emotional complaint. It has measurable effects: lower civic participation, less trust in government, and policy that reflects broad donor coalitions more than local community needs.

The fix the Founders built into the Constitution was a House that grew with the country. Congress honored that design for 140 years. The 1929 Apportionment Act broke it, and we've lived with the consequences ever since.

Please support legislation to repeal the 1929 cap. Smaller districts mean representatives who can actually know their constituents—and constituents who can actually know their representative. That's what democracy is supposed to feel like.

Thank you for reading this.

{{CONSTITUENT_NAME}}`
  },

  // ── Variant 6: Executive Branch Balance of Power ─────────────────────────
  {
    id: "executive-balance",
    angle: "Executive branch balance of power",
    body: `Dear Representative {{REP_LAST_NAME}},

The House of Representatives was designed to be the most powerful branch of the federal government—the chamber closest to the people, with the power of the purse and the sole authority to originate revenue legislation. But a House of 435 members governing 335 million people is structurally weaker than the Founders intended.

A smaller House is easier for the executive branch to manage, to lobby, and to pressure. When a single vote—your vote—can represent 760,000 constituents, each individual House member becomes a disproportionately high-stakes target. The math of a small legislature concentrates power in fewer hands and makes the chamber more susceptible to executive overreach, not less.

Expanding the House by repealing the 1929 Apportionment Act is one of the clearest ways to rebalance power in favor of the legislative branch and, by extension, the American people. More members means more diverse voices, more committee capacity, and a chamber that is harder for any single interest—executive or otherwise—to dominate.

I urge you to support this important structural reform.

Respectfully,
{{CONSTITUENT_NAME}}`
  },

  // ── Variant 7: Campaign Finance & Donor Influence ────────────────────────
  {
    id: "campaign-finance",
    angle: "Campaign finance and donor influence",
    body: `Dear Representative {{REP_LAST_NAME}},

One of the least-discussed consequences of an undersized House is what it does to campaign finance dynamics. When a single district contains 760,000 people and requires millions of dollars to contest, the cost of running for Congress prices out most ordinary citizens and makes incumbents heavily dependent on large donors.

A larger House with smaller districts would fundamentally change this calculus. Smaller districts are cheaper to campaign in, more accessible to grassroots candidates, and harder for out-of-district money to dominate. More seats means more competition, more turnover, and less entrenchment.

The 1929 Apportionment Act—a statute, not a constitutional provision—froze the House at 435 and has contributed to the campaign-finance arms race we live with today. Repealing it won't solve every money-in-politics problem, but it would structurally reduce the cost and barrier of entry to the people's chamber.

Please support legislation to expand the House. It is a reform that serves constituents across the political spectrum.

Sincerely,
{{CONSTITUENT_NAME}}`
  },

  // ── Variant 8: Bipartisan Framing ────────────────────────────────────────
  {
    id: "bipartisan",
    angle: "Bipartisan framing citing nonpartisan research",
    body: `Dear Representative {{REP_LAST_NAME}},

Support for expanding the House of Representatives is one of the rare reforms that draws backing from across the political spectrum—from the American Academy of Arts and Sciences' Commission on the Practice of Democratic Citizenship to scholars at the Brookings Institution, the Cato Institute, and FairVote.

The core argument is nonpartisan: the 1929 Apportionment Act capped the House at 435 as an administrative convenience, not as a considered constitutional design. Since then, America's population has tripled while the House has not grown by a single seat. The result is a legislature structurally disconnected from the people it represents.

This is not a Democratic or Republican problem. Republicans in rural states suffer from the same representation deficit as Democrats in urban areas. More seats means more representation for everyone—and research consistently shows that expansion would not systematically advantage either party.

I hope you will look at the bipartisan evidence and support repealing the 1929 cap. It is one of the few structural reforms with genuine cross-ideological support.

With respect,
{{CONSTITUENT_NAME}}`
  },

  // ── Variant 9: Personal Urgency / Present-Moment Stakes ──────────────────
  {
    id: "personal-urgency",
    angle: "Personal urgency and present-moment stakes",
    body: `Dear Representative {{REP_LAST_NAME}},

I don't usually write to my representative. But this issue feels urgent enough that I need to.

We are living through a moment of genuine democratic crisis—distrust in institutions, polarization, civic disengagement. Many proposed fixes are complicated, contested, or require constitutional amendments. Repealing the 1929 Apportionment Act is none of those things. It is a simple statute. Congress can undo it with a majority vote.

The House hasn't grown in nearly 100 years. America has 335 million people and the same 435 representatives it had when the population was 123 million. That is not a functioning ratio. It produces overworked representatives, disconnected constituents, and a legislature that struggles to reflect the true diversity of this country.

I am asking you to act now, while there is momentum, while reform feels possible. Please support legislation to expand the House. It is the right thing to do for democracy, and it is something that can actually happen.

Thank you.

{{CONSTITUENT_NAME}}`
  },

  // ── Variant 10: Constitutional First Principles ───────────────────────────
  {
    id: "constitutional-principles",
    angle: "Constitutional first principles",
    body: `Dear Representative {{REP_LAST_NAME}},

Article I, Section 2 of the Constitution states that "the number of Representatives shall not exceed one for every thirty Thousand" people—establishing a floor on representation, not a ceiling. The Founders designed the House to grow. They expected it to grow. They wrote growth into the document's structure.

For 140 years, Congress honored that design. Then, in 1929, a lame-duck Congress passed the Permanent Apportionment Act, freezing the House at 435 without constitutional authorization, without a supermajority, and without any formal process reflecting the gravity of the change.

No amendment to the Constitution authorized this cap. It rests on nothing more than an ordinary statute—one that Congress is fully empowered to repeal.

I urge you to support legislation doing exactly that. Repealing the 1929 Apportionment Act would not require amending the Constitution—it would require honoring it. The House of Representatives was designed to be the people's branch. Please help it become that again.

With deepest respect for the office you hold,
{{CONSTITUENT_NAME}}`
  }
];

// Make available globally for app.js
window.EMAIL_SUBJECT = EMAIL_SUBJECT;
window.EMAIL_TEMPLATES = EMAIL_TEMPLATES;
