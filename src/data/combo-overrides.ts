// src/data/combo-overrides.ts
// Per-(city, service) content overrides for high-demand city×service combo pages.
//
// WHY: combo pages (`src/pages/[city]/[service].astro`) render intro + honest-opinion
// from CITY-level data (`cityDesc.homeStock`, city climate/water) and SERVICE-level data
// (`serviceDesc.honestOpinion`). That text is shared, so every combo of a city reads the
// same, and every combo of a service shares the same honest block. To make a specific
// {city × service} combo read uniquely (and stop duplicating siblings + the city pillar),
// we add an override here. When an entry exists for `${citySlug}/${serviceSlug}`, the
// template renders `lede` / `introHeading` / `introHtml` / `honest` from this file instead
// of the generated text. Absent → template falls back to the generated version.
//
// Fully reversible: delete an entry and the page returns to the shared template.
// Only lede + intro + honest are overridden; pricing, warranty, FAQ, brand pool,
// neighborhoods, CTAs stay shared (as they should).
//
// Content follows docs/voice-and-style.md: technician's-eye observations, concrete
// neighborhoods + model numbers, honest repair-vs-replace, no forbidden marketing phrases.

export interface ComboOverride {
  /** Hero sub-line. Replaces cityDesc.serviceContext for this combo. */
  lede?: string;
  /** H2 above the intro prose. */
  introHeading?: string;
  /** Intro paragraphs (HTML). Brand/city names are auto-linkified by the template. */
  introHtml?: string;
  /** Honest-opinion paragraphs (HTML). Replaces serviceDesc.honestOpinion for this combo. */
  honest?: string;
}

export const COMBO_OVERRIDES: Record<string, ComboOverride> = {
  "los-angeles/refrigerator-repair": {
    lede: "Refrigerator calls are the busiest line on our board in Los Angeles — and the one repair nobody can push to next week.",
    introHeading: "What a refrigerator call actually looks like in Los Angeles.",
    introHtml: `<p>Refrigerator work in LA splits by the housing. East of La Brea and through Mid-City the stock is 10-to-15-year-old Whirlpool and GE side-by-sides, and by that age it's almost always the defrost system — a frosted-over evaporator coil, a dead defrost heater, a stuck timer — that has the fresh-food side creeping warm while the freezer still holds. Up in Los Feliz, Hancock Park and the hillside builds above Silver Lake it flips to built-ins: Sub-Zero 650s and BI-36s where the condenser is packed with dust and short-cycling in the dry air, or one evaporator fan has quit and only half the box cools.</p>
<p>Our guys stock the parts that match what LA kitchens actually run — Whirlpool, GE, LG and Samsung on the truck, with Sub-Zero and Viking sealed-system parts staged for the built-in calls. On a same-day fridge visit we check the sealed system, the defrost circuit and the fans together, so you're not paying us to swap one part and leave the real cause behind. $89 residential diagnostic, and it comes off the invoice the moment you approve the repair.</p>`,
    honest: `<p>Straight math on refrigerators: mid-tier brand — Whirlpool, GE, Samsung, LG — 12 years or older with a failed compressor, replacement usually wins, and you'll hear that from us on the phone before we ever charge a diagnostic. Where repair is the easy call is the built-ins: a Sub-Zero 650 is an $8,000-plus unit, and a $600-to-900 evaporator or condenser job buys another decade — those we fix all day.</p>
<p>The one we flag in LA is the sealed-system leak on 2015-2019 LG and Samsung linear-compressor models. That's a genuine repair, not a replace — but it has to be brazed and recharged by someone EPA-608 certified, or it's warm inside again within a month. If a shop quotes a refrigerant "top-off" without finding the leak, that's the wrong shop.</p>`,
  },
  "los-angeles/oven-repair": {
    lede: "Oven and range calls in LA run the whole spread — a Koreatown rental with a GE that won't light, a 48-inch Wolf in the hills that won't hold temperature.",
    introHeading: "What an oven or range call looks like across Los Angeles.",
    introHtml: `<p>The split on cooking appliances is sharp here. Through Mid-City, Koreatown and the flats it's freestanding GE, Samsung and LG ranges — a bake igniter that glows but won't drop the gas, a burned-through element, an F1 or F9 board code locking the oven out. Move west or up into Los Feliz, Hancock Park and the hills and it turns pro-grade: Wolf DF486G dual-fuel ranges drifting 40 degrees off setpoint, Thermador Pro Grand ovens with a failed relay board, Viking with a dead spark module.</p>
<p>Our techs carry igniters and elements for the common brands on the truck and stage Wolf, Thermador and Viking control and igniter parts for the pro calls — those aren't next-day warehouse items, and a working kitchen can't wait on them. We test the safety valve and the igniter's actual amp draw instead of eyeballing the glow, so the repair holds instead of failing again two weeks later. $89 residential diagnostic, waived with the repair.</p>`,
    honest: `<p>Repair-or-replace on ranges is cleaner than people expect. A mid-tier freestanding range — a $700-to-1,200 GE or Samsung — is worth a $350-to-500 control-board or igniter job at year 5-to-8, not at year 12 when a new one costs about the same. We'll tell you plainly which side of that line you're on.</p>
<p>Pro ranges are a different world. A Wolf DF486G or a Thermador Pro Grand is a $10,000-plus appliance, and short of a cracked cast burner or a rusted-through oven box, almost everything is worth repairing — we've kept 20-year-old Wolfs cooking. What we won't do is talk you into a board swap on a dying mid-tier range to pad the ticket.</p>`,
  },
  "los-angeles/dryer-repair": {
    lede: "Dryer calls are half our LA laundry board — a stack in a Koreatown closet that quit heating, a vented unit in a Mid-City duplex taking three cycles to dry a load.",
    introHeading: "What a dryer call looks like in Los Angeles.",
    introHtml: `<p>Most LA dryer calls come down to one of three things, and the building usually tells us which before we're through the door. In the older apartments through Koreatown, East Hollywood and Mid-City it's gas dryers with a failed igniter or a blown thermal fuse — and nine times out of ten the fuse blew because the vent run behind the machine is packed with lint, so we clear the real cause instead of just dropping a fuse in and leaving. In the condos and hillside homes it's more stacked LG and Samsung units, plus the occasional Miele or Bosch heat-pump dryer where the condenser or the control board is the culprit.</p>
<p>Our guys carry igniters, thermal fuses, heating elements and belts for the common gas and electric units on the truck, so most single-fault dryer calls are one-and-done same day. When a dryer "takes three cycles," we check airflow end to end — lint trap, blower, vent — because that's a fire risk, not just a slow dryer. $89 residential diagnostic, waived with the repair.</p>`,
    honest: `<p>Dryers are usually the easy yes on repair. The mechanical parts — igniter, element, thermal fuse, belt, rollers — are cheap and the machines are simple; a $180-to-320 fix on a 7-year-old gas dryer is money well spent, and we'll say so plainly.</p>
<p>The exception is the premium heat-pump and steam units. A Miele or Bosch heat-pump dryer with a failed sealed system or main board can run past what the machine is worth at year 10 — that's the one call where we'll tell you to weigh replacement. And when a dryer won't heat but the drum still spins, before anyone sells you a part we check the house gas and the breaker; sometimes it's a tripped leg, not the dryer at all.</p>`,
  },
  "los-angeles/dishwasher-repair": {
    lede: "Dishwasher calls in LA are the quiet emergency — water on the floor of a Larchmont bungalow, dishes coming out gritty in a Silver Lake remodel.",
    introHeading: "What a dishwasher call looks like in Los Angeles.",
    introHtml: `<p>The two dishwasher calls we run most in LA are "it's leaking" and "it's not cleaning," and they split by neighborhood the way everything here does. In the mid-century and older housing through Mid-City and Atwater it's mid-tier Whirlpool, GE and KitchenAid units — a torn door gasket, a cracked sump, or a drain pump that finally seized. In the west-side and Los Feliz remodels it's panel-front Bosch, Miele and Thermador machines where the fix is a circulation pump, a diverter or a control board, and the custom panel has to come off without marking the cabinetry.</p>
<p>Our techs carry pumps, valves, gaskets and float switches for the common brands and take the extra few minutes on the built-ins so a panel goes back exactly how it came off. "Not cleaning" almost always traces to the spray arms, the chopper or hard-water scale on the heating element — LA's water runs moderately hard and that scale is a real pattern here — not a machine that needs replacing. $89 residential diagnostic, applied to the repair.</p>`,
    honest: `<p>Straight talk on dishwashers: a mid-tier unit — a $500-to-800 Whirlpool or GE — with a dead control board is a coin-flip at year 8 and usually a replace at year 12; a pump or gasket job on that same machine is almost always worth it. We price the part against the machine before you commit.</p>
<p>The panel-front Bosch, Miele and Thermador units are worth repairing well past that — they're $1,500-to-2,500 to replace and the parts are available. The one we warn people off is chasing an intermittent control board with repeat part swaps; if the diagnosis isn't clean, we say so instead of throwing parts at it on your dime.</p>`,
  },
  "los-angeles/washer-repair": {
    lede: "Washer calls in LA come in loud — a front-loader walking across a downtown loft on spin, a top-loader in a Mid-City fourplex that fills but won't drain.",
    introHeading: "What a washer call looks like in Los Angeles.",
    introHtml: `<p>Washing machines are one of our busiest lines across LA, and the failure usually matches the machine. The front-load LG and Samsung units common in the newer builds and condos throw drain-pump clogs, worn door boots, and the occasional bad bearing that has the drum knocking on spin. In the older apartments through Koreatown and Mid-City it's top-load Whirlpool and Maytag machines — a failed lid switch, a worn drive coupler, or a suspension that's shot so the tub bangs the cabinet.</p>
<p>Our guys carry drain pumps, door boots, lid switches, belts and valves for the common front- and top-loaders on the truck, so a single-fault washer call is usually one visit. When a washer "won't drain," we pull the pump filter first — in LA front-loaders it's coins, hairpins and lint far more often than a dead pump — so you're not charged for a part you didn't need. $89 residential diagnostic, off the bill with the repair.</p>`,
    honest: `<p>Washers are usually worth fixing. Pumps, boots, valves, lid switches and couplers are inexpensive, and a $180-to-350 repair on a 6-to-9-year-old machine beats buying new. We'll tell you when it's that simple.</p>
<p>The call to slow down on is a front-loader with a failed bearing or spider arm — that's a labor-heavy teardown, and on a mid-tier machine at year 10 the cost can cross into replace territory. We quote it straight and let you make the call; we're not here to sell a bearing job into a machine that doesn't warrant it.</p>`,
  },
  "los-angeles/freezer-repair": {
    lede: "Standalone freezer calls in LA carry a clock — a garage chest freezer in Eagle Rock full of a season's cooking, an upright on a Mid-City service porch drifting warm.",
    introHeading: "What a standalone freezer call looks like in Los Angeles.",
    introHtml: `<p>Standalone freezers are their own kind of call in LA because they usually live in the garage or a back porch — and that's where our climate bites. Through the flats and the Valley-adjacent neighborhoods it's chest and upright freezers — Frigidaire, GE, Whirlpool, Kenmore — running in an un-airconditioned garage where 95-degree afternoons push the condenser hard and the compressor or start relay gives out early. In the nicer homes it's Sub-Zero and Viking freezer columns where a defrost or evaporator-fan fault has one zone frosting up.</p>
<p>Our techs carry start relays, defrost heaters, thermostats and evaporator fans for the common freezers and stage sealed-system parts for the built-in columns. Because a warm freezer is a countdown on everything inside, we run these same-day whenever we can and check the door gasket and the garage airflow, not just the part that failed. $89 residential diagnostic, waived with the repair.</p>`,
    honest: `<p>Freezers are a straightforward repair most of the time — a start relay, a defrost heater or a thermostat on a chest or upright is a $150-to-300 fix, and it's almost always worth it over buying new. We'll tell you when it's that simple.</p>
<p>Where we pump the brakes is a sealed-system leak on an older mid-tier freezer: the refrigerant repair can cost more than a new chest freezer, so at year 12-plus on a basic unit, replacement is the honest answer. The built-in Sub-Zero and Viking columns are the opposite — those earn the sealed-system work every time. And if it's in the garage, we'll flag whether the heat is what's really killing it.</p>`,
  },
  "los-angeles/stove-repair": {
    lede: "Stove and cooktop calls in LA span the spread — a gas cooktop in a Larchmont duplex that won't spark, an induction top in a downtown loft that faults out mid-boil.",
    introHeading: "What a stove or cooktop call looks like in Los Angeles.",
    introHtml: `<p>Cooktop and stove work in LA lands in three buckets. Gas is the bread and butter — freestanding and drop-in gas stoves through Mid-City, Koreatown and the older housing where the igniter clicks but won't light, a burner cap corroded, or the spark module quit firing all four at once. Then the induction tops in the west-side and downtown remodels — GE, Samsung, Bosch — throwing an error code on a bad induction coil or control board. And the pro gas: Wolf and Thermador cooktops in the hills where a sealed burner or the spark ignition needs the right parts.</p>
<p>Our guys carry spark modules, igniters, burner caps and infinite switches for the common gas units on the truck; the induction and pro parts we stage per call. On a "won't spark" we clean and gap the igniter and test the module before we sell you a board — more often than not, that's all it is. $89 residential diagnostic, applied to the repair.</p>`,
    honest: `<p>Gas cooktops are one of the best repair values in the kitchen — igniters, spark modules and switches are cheap, the units last decades, and a $150-to-320 fix on a working gas stove is money well spent no matter the age. We steer you toward the repair there.</p>
<p>Induction is where it gets real: a failed induction coil or generator board on a mid-tier top can run $400-plus, and at year 8-to-10 that starts to rival a new unit — we'll show you the math. The Wolf and Thermador pro cooktops, like the pro ranges, are worth repairing well past a decade. What we won't do is guess at an intermittent induction fault with repeat board swaps on your dime.</p>`,
  },
  "los-angeles/microwave-repair": {
    lede: "Microwave calls in LA are mostly the over-the-range units — a built-in over the stove in a Hancock Park kitchen that hums but won't heat, a Koreatown rental unit gone dark.",
    introHeading: "What a microwave call looks like in Los Angeles.",
    introHtml: `<p>Almost every microwave call we run in LA is an over-the-range or built-in unit, because that's the one people repair instead of tossing — a countertop microwave they just replace. Through the older apartments and the Mid-City and Larchmont homes it's OTR units — GE, Whirlpool, Samsung, LG — that hum but won't heat (a dead magnetron or high-voltage diode), or the door-interlock switch failed and the unit's gone dark. In the built-in trim kits of the west-side kitchens it's the same faults but with cabinetry that has to come apart cleanly.</p>
<p>Microwave work is high-voltage — the capacitor holds a lethal charge even unplugged — so it isn't a DIY call, and our techs discharge and test it properly before touching anything. We carry door switches, diodes and thermal fuses for the common OTR units; a magnetron we quote per model. $89 residential diagnostic, waived with the repair.</p>`,
    honest: `<p>Here's the honest line most shops won't give you: a countertop microwave is almost never worth a service call — a new one costs less than the diagnostic plus a part. So if it's a countertop unit, we tell you to replace it and keep your money.</p>
<p>The over-the-range and built-in units are the ones worth fixing — they're $400-to-900 to replace and often trim-matched to the kitchen. A door switch or diode is a cheap, quick repair; a magnetron is the judgment call, and on a mid-tier OTR at year 8-plus we lay the part cost against a new unit and let you decide.</p>`,
  },
};

export function getComboOverride(city: string, service: string): ComboOverride | undefined {
  return COMBO_OVERRIDES[`${city}/${service}`];
}
