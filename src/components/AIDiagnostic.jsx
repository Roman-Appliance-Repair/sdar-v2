import { useState } from "react";

const CATEGORIES = [
  { id: "home",       label: "Home Appliances",     icon: "🏠", sub: "Fridge, washer, oven, dryer, dishwasher" },
  { id: "restaurant", label: "Restaurant Kitchen",  icon: "🍽️", sub: "Ovens, fryers, dishwashers, ranges" },
  { id: "cold",       label: "Cold Storage",        icon: "❄️", sub: "Walk-in coolers, reach-in, display cases" },
  { id: "ice",        label: "Ice Machines",        icon: "🧊", sub: "Hoshizaki, Scotsman, Manitowoc, Follett" },
  { id: "outdoor",    label: "Outdoor Living",      icon: "🔥", sub: "Grills, fireplaces, patio heaters" },
];

const APPLIANCES_BY_CATEGORY = {
  home:       ["Refrigerator","Freezer","Dishwasher","Washer","Dryer","Oven / Range","Cooktop","Microwave","Wine Cooler / Cellar","Range Hood","Wall Oven"],
  restaurant: ["Commercial Oven","Commercial Range","Commercial Fryer","Commercial Dishwasher","Commercial Refrigerator","Commercial Freezer","Commercial Steamer","Commercial Mixer"],
  cold:       ["Walk-in Cooler","Walk-in Freezer","Reach-in Refrigerator","Reach-in Freezer","Display Case","Prep Table","Undercounter Refrigerator"],
  ice:        ["Ice Machine (Cuber)","Ice Machine (Flaker)","Ice Machine (Nugget)","Ice Dispenser","Ice Storage Bin"],
  outdoor:    ["Gas Grill","Pellet Grill","Patio Heater","Gas Fireplace","Outdoor Refrigerator","Outdoor Ice Maker","Pizza Oven"],
};

const BRANDS_BY_APPLIANCE = {
  "Refrigerator":             ["Sub-Zero","Thermador","Viking","Miele","Liebherr","True Residential","GE Monogram","JennAir","KitchenAid","Bosch","Dacor","Fisher & Paykel","LG","Samsung","GE","Whirlpool","Maytag","Frigidaire","Haier","Other"],
  "Freezer":                  ["Sub-Zero","Thermador","True Residential","GE Monogram","LG","Samsung","GE","Whirlpool","Frigidaire","Other"],
  "Dishwasher":               ["Miele","Thermador","JennAir","Cove","Gaggenau","KitchenAid","Bosch","Dacor","Fisher & Paykel","Asko","LG","Samsung","GE","Whirlpool","Maytag","Frigidaire","Other"],
  "Washer":                   ["Miele","Asko","Bosch","Speed Queen","Electrolux","Fisher & Paykel","LG","Samsung","GE","Whirlpool","Maytag","Haier","Frigidaire","Other"],
  "Dryer":                    ["Miele","Asko","Bosch","Speed Queen","Electrolux","Fisher & Paykel","LG","Samsung","GE","Whirlpool","Maytag","Frigidaire","Other"],
  "Oven / Range":             ["Wolf","Thermador","Viking","JennAir","Miele","Gaggenau","KitchenAid","Bosch","Bertazzoni","Dacor","BlueStar","Hestan","LG","Samsung","GE","Whirlpool","Maytag","Frigidaire","Other"],
  "Cooktop":                  ["Wolf","Thermador","Viking","JennAir","KitchenAid","Bosch","GE","Whirlpool","Other"],
  "Microwave":                ["Wolf","Thermador","Miele","JennAir","KitchenAid","Dacor","LG","Samsung","GE","Whirlpool","Maytag","Sharp","Panasonic","Other"],
  "Wine Cooler / Cellar":     ["Sub-Zero","Viking","Liebherr","Miele","Gaggenau","True Residential","Thermador","U-Line","WhisperKool","CellarPro","Breezaire","Other"],
  "Range Hood":               ["Wolf","Thermador","Viking","Miele","JennAir","GE Monogram","BlueStar","Hestan","Bosch","KitchenAid","Zephyr","LG","Samsung","Whirlpool","Broan","GE","Other"],
  "Wall Oven":                ["Wolf","Thermador","Viking","JennAir","Miele","Gaggenau","KitchenAid","Bosch","LG","Samsung","GE","Whirlpool","Other"],
  "Commercial Oven":          ["Rational","Blodgett","Vulcan","TurboChef","Alto-Shaam","Lang","Montague","Imperial","Southbend","Garland","Other"],
  "Commercial Range":         ["Vulcan","Garland","Imperial","American Range","Southbend","Montague","Wolf Commercial","Other"],
  "Commercial Fryer":         ["Pitco","Frymaster","Henny Penny","Vulcan","Other"],
  "Commercial Dishwasher":    ["Hobart","Jackson","Champion","CMA","Winterhalter","Meiko","Fagor","Electrolux Professional","Miele Professional","Other"],
  "Commercial Refrigerator":  ["True Refrigeration","Hoshizaki","Traulsen","Beverage-Air","Delfield","Nor-Lake","Perlick","Other"],
  "Commercial Freezer":       ["True Refrigeration","Hoshizaki","Traulsen","Beverage-Air","Nor-Lake","Other"],
  "Commercial Steamer":       ["Rational","Vulcan","Market Forge","Cleveland","Other"],
  "Commercial Mixer":         ["Hobart","Globe","KitchenAid Commercial","Other"],
  "Walk-in Cooler":           ["True Refrigeration","Hoshizaki","Traulsen","Nor-Lake","Kolpak","Bohn","Heatcraft","Other"],
  "Walk-in Freezer":          ["True Refrigeration","Hoshizaki","Traulsen","Nor-Lake","Kolpak","Other"],
  "Reach-in Refrigerator":    ["True Refrigeration","Hoshizaki","Traulsen","Beverage-Air","Delfield","Nor-Lake","Other"],
  "Reach-in Freezer":         ["True Refrigeration","Hoshizaki","Traulsen","Beverage-Air","Other"],
  "Display Case":             ["True Refrigeration","Hoshizaki","Beverage-Air","AHT Cooling","Other"],
  "Prep Table":               ["True Refrigeration","Traulsen","Delfield","Beverage-Air","Other"],
  "Undercounter Refrigerator":["True Refrigeration","Hoshizaki","Perlick","Beverage-Air","Other"],
  "Ice Machine (Cuber)":      ["Hoshizaki","Manitowoc","Scotsman","Ice-O-Matic","Follett","Avanti","Other"],
  "Ice Machine (Flaker)":     ["Hoshizaki","Manitowoc","Scotsman","Other"],
  "Ice Machine (Nugget)":     ["Hoshizaki","Manitowoc","Follett","Other"],
  "Ice Dispenser":            ["Follett","Hoshizaki","Manitowoc","Other"],
  "Ice Storage Bin":          ["Hoshizaki","Manitowoc","Scotsman","Other"],
  "Gas Grill":                ["Viking","Wolf Outdoor","DCS","Lynx","Fire Magic","Hestan Outdoor","Kalamazoo","Capital","Coyote","Bull","Napoleon","Weber","Other"],
  "Pellet Grill":             ["Traeger","Weber","Other"],
  "Patio Heater":             ["Bromic","Infratech","Fire Sense","AEI / Sunpak","Sunglo","Other"],
  "Gas Fireplace":            ["Valor","Napoleon","Regency","Heat & Glo","Majestic","SL","Other"],
  "Outdoor Refrigerator":     ["Sub-Zero","Viking","U-Line","Perlick","Hestan Outdoor","Other"],
  "Outdoor Ice Maker":        ["Sub-Zero","Viking","U-Line","Scotsman","Other"],
  "Pizza Oven":               ["Middleby Marshall","Lincoln Impinger","Wood Stone","Bakers Pride","Forno Bravo","Other"],
};

const SYMPTOMS_BY_APPLIANCE = {
  "Refrigerator":         ["Not cooling","Leaking water","Makes loud noise","Ice maker not working","Freezing food","Door not sealing","Runs constantly","Won't turn on"],
  "Freezer":              ["Not freezing","Frost buildup","Leaking water","Makes loud noise","Won't turn on","Temperature fluctuating"],
  "Dishwasher":           ["Not draining","Not cleaning dishes","Leaking","Won't start","Door won't latch","Leaves residue","Error code"],
  "Washer":               ["Not spinning","Not draining","Leaking","Won't start","Loud banging","Won't fill with water","Error code"],
  "Dryer":                ["Not heating","Takes too long","Won't start","Makes loud noise","Shuts off mid-cycle","Drum won't spin"],
  "Oven / Range":         ["Not heating","Uneven heating","Burner won't ignite","Temperature off","Error code","Door won't close"],
  "Cooktop":              ["Burner won't ignite","Burner stays on","No spark","Error code"],
  "Microwave":            ["Not heating","Sparking inside","Turntable not spinning","Display not working","Loud noise"],
  "Wine Cooler / Cellar": ["Not cooling","Temperature fluctuating","Loud noise","Leaking","Compressor running constantly"],
  "Range Hood":           ["Not venting","Loud noise","Lights not working","Motor not running"],
  "Wall Oven":            ["Not heating","Uneven heating","Error code","Door won't close","Self-clean not working"],
  "Walk-in Cooler":       ["Not maintaining temperature","Compressor issues","Ice buildup","Door seal damaged","Leaking refrigerant"],
  "Walk-in Freezer":      ["Not maintaining temperature","Compressor issues","Ice buildup","Door seal damaged"],
  "Ice Machine (Cuber)":  ["Not making ice","Small or hollow ice","Leaking water","Error code","Making noise","Ice tastes bad"],
  "Ice Machine (Flaker)": ["Not making ice","Leaking water","Error code","Making noise"],
  "Ice Machine (Nugget)": ["Not making ice","Leaking water","Error code"],
  "Gas Grill":            ["Won't ignite","Uneven heat","Gas smell","Burner damaged","Won't reach temperature"],
  "Patio Heater":         ["Won't ignite","Pilot light won't stay","Low heat output","Thermocouple issue"],
  "Gas Fireplace":        ["Won't ignite","Pilot light out","Blower not working","Remote not working","Error code"],
  "Outdoor Refrigerator": ["Not cooling","Leaking","Door seal damaged","Won't turn on","Loud noise"],
};

const DEFAULT_SYMPTOMS = ["Not working","Making unusual noise","Leaking","Error code on display","Other"];

const SERVICE_URLS = {
  "Refrigerator":            "https://samedayappliance.repair/services/refrigerator-repair/",
  "Freezer":                 "https://samedayappliance.repair/services/refrigerator-repair/",
  "Dishwasher":              "https://samedayappliance.repair/services/dishwasher-repair/",
  "Washer":                  "https://samedayappliance.repair/services/washer-repair/",
  "Dryer":                   "https://samedayappliance.repair/services/dryer-repair/",
  "Oven / Range":            "https://samedayappliance.repair/services/oven-repair/",
  "Cooktop":                 "https://samedayappliance.repair/services/cooktop-repair/",
  "Microwave":               "https://samedayappliance.repair/services/microwave-repair/",
  "Wine Cooler / Cellar":    "https://samedayappliance.repair/services/wine-cellar-cooling-repair/",
  "Range Hood":              "https://samedayappliance.repair/services/range-hood-repair/",
  "Wall Oven":               "https://samedayappliance.repair/services/oven-repair/",
  "Walk-in Cooler":          "https://samedayappliance.repair/commercial/refrigeration/",
  "Walk-in Freezer":         "https://samedayappliance.repair/commercial/refrigeration/",
  "Commercial Refrigerator": "https://samedayappliance.repair/commercial/refrigeration/",
  "Commercial Freezer":      "https://samedayappliance.repair/commercial/refrigeration/",
  "Ice Machine (Cuber)":     "https://samedayappliance.repair/commercial/ice-machines/",
  "Ice Machine (Flaker)":    "https://samedayappliance.repair/commercial/ice-machines/",
  "Ice Machine (Nugget)":    "https://samedayappliance.repair/commercial/ice-machines/",
  "Gas Grill":               "https://samedayappliance.repair/outdoor/outdoor-grill-repair/",
  "Gas Fireplace":           "https://samedayappliance.repair/outdoor/gas-fireplace-repair/",
  "Outdoor Refrigerator":    "https://samedayappliance.repair/outdoor/outdoor-refrigerator-repair/",
};

const DIAGNOSTIC_FEE = { home: "$89", restaurant: "$120", cold: "$120", ice: "$120", outdoor: "$89" };

// CSS-var fallbacks so the component renders correctly even if the design tokens
// aren't defined in the global stylesheet.
const C_BG   = "var(--color-background-primary, #ffffff)";
const C_BG2  = "var(--color-background-secondary, #f5f5f5)";
const C_TXT  = "var(--color-text-primary, #1a1a1a)";
const C_TXT2 = "var(--color-text-secondary, #6b6b6b)";
const C_BRD  = "var(--color-border-tertiary, #e2e2e2)";

const initialForm = { category: "", appliance: "", brand: "", model: "", symptom: "", age: "", detail: "", name: "", phone: "", email: "" };

export default function AIDiagnostic({ phone = "(323) 870-4790" }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [callbackRequested, setCallbackRequested] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const appliances = APPLIANCES_BY_CATEGORY[form.category] || [];
  const brands = BRANDS_BY_APPLIANCE[form.appliance] || ["Other"];
  const symptoms = SYMPTOMS_BY_APPLIANCE[form.appliance] || DEFAULT_SYMPTOMS;
  const fee = DIAGNOSTIC_FEE[form.category] || "$89";
  const serviceUrl = SERVICE_URLS[form.appliance];

  const totalSteps = 5;
  const pct = `${(step / totalSteps) * 100}%`;

  const canAdvance = () => {
    if (step === 1) return !!form.category;
    if (step === 2) return !!form.appliance;
    if (step === 3) return !!form.brand && !!form.symptom;
    if (step === 4)
      return (
        !!form.name &&
        !!form.phone &&
        form.phone.replace(/\D/g, "").length >= 10 &&
        /\S+@\S+\.\S+/.test(form.email)
      );
    return false;
  };

  const runDiagnosis = async () => {
    setLoading(true);
    // Hoist resolved text into a local so it's safe to reference in the
    // contact.js fire-and-forget — React state from setResult isn't visible
    // synchronously in this scope.
    let text = "Unable to generate diagnosis. Please call us directly.";
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appliance: form.appliance,
          brand: form.brand,
          model: form.model,
          symptom: form.symptom,
          age: form.age,
          detail: form.detail,
          serviceUrl: serviceUrl || "https://samedayappliance.repair/services/",
          category: form.category,
        }),
      });
      const data = await res.json();
      text = data.result || text;
    } catch {
      text = "Unable to generate diagnosis at this time. Please call us directly.";
    }
    setResult(text);
    setLoading(false);
    setStep(6);

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "🤖 AI Diagnostics",
        customerName: form.name,
        phone: form.phone,
        email: form.email,
        appliance: form.appliance,
        brand: form.brand,
        model: form.model,
        symptom: form.symptom,
        age: form.age,
        detail: form.detail,
        result: text,
        category: form.category,
        brand_site: "samedayappliance.repair",
        equipment: form.appliance,
        equipmentLabel: form.appliance,
        description: form.detail,
      }),
    }).catch(() => {});
  };

  const handleCallback = async () => {
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "callback",
        name: form.name,
        phone: form.phone,
        email: form.email,
        appliance: form.appliance,
        brand: form.brand,
        symptom: form.symptom,
        result,
        source: "ai-diagnostic",
        brand_site: "samedayappliance.repair",
      }),
    }).catch(() => {});
    setCallbackRequested(true);
  };

  const s = { maxWidth: 640, margin: "0 auto", padding: "1.5rem 1rem", fontFamily: "system-ui, sans-serif" };
  const card = { background: C_BG, border: `0.5px solid ${C_BRD.replace(/var\([^)]*\)/, '#e2e2e2')}`, borderRadius: 12, padding: "1.5rem" };
  // Note: CSS `border` shorthand with a `var()` color works inline, but some
  // browsers reject the shorthand if the token resolves to nothing — splitting
  // into longhand keeps it safe.
  const cardSafe = {
    background: C_BG,
    borderWidth: "0.5px",
    borderStyle: "solid",
    borderColor: C_BRD,
    borderRadius: 12,
    padding: "1.5rem",
  };
  const chip = (active) => ({
    padding: "0.6rem 0.8rem",
    borderRadius: 8,
    fontSize: 13,
    textAlign: "left",
    cursor: "pointer",
    borderWidth: active ? 2 : 0.5,
    borderStyle: "solid",
    borderColor: active ? "#C8102E" : C_BRD,
    background: active ? "#fff5f5" : C_BG,
    color: active ? "#C8102E" : C_TXT,
    fontWeight: active ? 500 : 400,
  });
  const btnPrimary = (enabled) => ({
    width: "100%",
    padding: "0.85rem",
    borderRadius: 8,
    background: enabled ? "#C8102E" : C_BG2,
    color: enabled ? "#fff" : C_TXT2,
    border: "none",
    fontSize: 15,
    fontWeight: 500,
    cursor: enabled ? "pointer" : "default",
  });
  const btnBack = {
    flex: 1,
    padding: "0.85rem",
    borderRadius: 8,
    background: "transparent",
    borderWidth: "0.5px",
    borderStyle: "solid",
    borderColor: C_BRD,
    fontSize: 15,
    cursor: "pointer",
    color: C_TXT,
  };
  const label = { display: "block", fontSize: 13, fontWeight: 500, marginBottom: 5 };
  const inp = { width: "100%", marginBottom: "1rem", padding: "0.6rem 0.7rem", fontSize: 14, borderRadius: 8, borderWidth: "0.5px", borderStyle: "solid", borderColor: C_BRD, background: C_BG, color: C_TXT, boxSizing: "border-box", fontFamily: "system-ui" };

  return (
    <div style={s}>
      <h2 className="sr-only">Free appliance diagnostic — Same Day Appliance Repair</h2>

      {step <= totalSteps && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C_TXT2, marginBottom: 5 }}>
            <span>Step {step} of {totalSteps}</span>
            <span>Free · No obligation</span>
          </div>
          <div style={{ height: 3, background: C_BG2, borderRadius: 4 }}>
            <div style={{ height: "100%", width: pct, background: "#C8102E", borderRadius: 4, transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div style={cardSafe}>
          <p style={{ fontSize: 15, color: C_TXT2, marginBottom: "1.25rem" }}>What type of equipment needs service?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.5rem" }}>
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => set("category", c.id)}
                style={{ ...chip(form.category === c.id), display: "flex", alignItems: "center", gap: 12, padding: "0.85rem 1rem" }}
              >
                <span style={{ fontSize: 22 }}>{c.icon}</span>
                <span>
                  <span style={{ display: "block", fontWeight: 500 }}>{c.label}</span>
                  <span style={{ display: "block", fontSize: 12, color: form.category === c.id ? "#C8102E" : C_TXT2, fontWeight: 400 }}>{c.sub}</span>
                </span>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(2)} disabled={!form.category} style={btnPrimary(!!form.category)}>Continue →</button>
        </div>
      )}

      {step === 2 && (
        <div style={cardSafe}>
          <p style={{ fontSize: 15, color: C_TXT2, marginBottom: "1.25rem" }}>Which appliance needs repair?</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 7, marginBottom: "1.5rem" }}>
            {appliances.map(a => (
              <button
                key={a}
                onClick={() =>
                  setForm(f => ({
                    ...f,
                    appliance: a,
                    brand: (BRANDS_BY_APPLIANCE[a] || []).includes(f.brand) ? f.brand : "",
                    symptom: (SYMPTOMS_BY_APPLIANCE[a] || DEFAULT_SYMPTOMS).includes(f.symptom) ? f.symptom : "",
                  }))
                }
                style={chip(form.appliance === a)}
              >
                {a}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(1)} style={btnBack}>← Back</button>
            <button onClick={() => setStep(3)} disabled={!form.appliance} style={{ ...btnPrimary(!!form.appliance), flex: 2 }}>Continue →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={cardSafe}>
          <p style={{ fontSize: 15, color: C_TXT2, marginBottom: "1.25rem" }}>Brand and main symptom</p>
          <label style={label}>Brand</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 7, marginBottom: "1.25rem" }}>
            {brands.map(b => <button key={b} onClick={() => set("brand", b)} style={chip(form.brand === b)}>{b}</button>)}
          </div>
          <label style={label}>
            Model number <span style={{ fontWeight: 400, color: C_TXT2 }}>(optional)</span>
          </label>
          <input type="text" placeholder="e.g. WT7300CW" value={form.model} onChange={e => set("model", e.target.value)} style={inp} />
          <label style={label}>Main symptom</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: "1.25rem" }}>
            {symptoms.map(sym => <button key={sym} onClick={() => set("symptom", sym)} style={chip(form.symptom === sym)}>{sym}</button>)}
          </div>
          <label style={label}>Approximate age of unit</label>
          <select value={form.age} onChange={e => set("age", e.target.value)} style={{ ...inp, marginBottom: "1.5rem" }}>
            <option value="">Select age</option>
            <option>Less than 2 years</option>
            <option>2–5 years</option>
            <option>5–10 years</option>
            <option>10–15 years</option>
            <option>Over 15 years</option>
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(2)} style={btnBack}>← Back</button>
            <button onClick={() => setStep(4)} disabled={!form.brand || !form.symptom} style={{ ...btnPrimary(!!(form.brand && form.symptom)), flex: 2 }}>Continue →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div style={cardSafe}>
          <p style={{ fontSize: 15, color: C_TXT2, marginBottom: "1.25rem" }}>Additional details and your contact info</p>
          <label style={label}>
            Describe what you're seeing <span style={{ fontWeight: 400, color: C_TXT2 }}>(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="When did it start? Any error codes? Unusual sounds or smells?"
            value={form.detail}
            onChange={e => set("detail", e.target.value)}
            style={{
              width: "100%",
              marginBottom: "1rem",
              resize: "vertical",
              padding: "0.7rem",
              borderRadius: 8,
              borderWidth: "0.5px",
              borderStyle: "solid",
              borderColor: C_BRD,
              fontSize: 14,
              fontFamily: "system-ui",
              background: C_BG,
              color: C_TXT,
              boxSizing: "border-box",
            }}
          />
          <label style={label}>Your name</label>
          <input type="text" placeholder="First name" value={form.name} onChange={e => set("name", e.target.value)} style={inp} />
          <label style={label}>
            Phone number <span style={{ color: "#C8102E" }}>*</span>
          </label>
          <input type="tel" placeholder="(323) 000-0000" value={form.phone} onChange={e => set("phone", e.target.value)} autoComplete="tel" style={inp} />
          <label style={label}>
            Email address <span style={{ color: "#C8102E" }}>*</span>
          </label>
          <input type="email" placeholder="your@email.com" value={form.email} onChange={e => set("email", e.target.value)} style={{ ...inp, marginBottom: "0.5rem" }} />
          <p style={{ fontSize: 12, color: C_TXT2, marginBottom: "1.5rem" }}>
            We'll follow up by phone. No spam — just your diagnostic report and a callback if you request one.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(3)} style={btnBack}>← Back</button>
            <button onClick={() => setStep(5)} disabled={!canAdvance()} style={{ ...btnPrimary(canAdvance()), flex: 2 }}>Continue →</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div style={cardSafe}>
          <p style={{ fontSize: 15, color: C_TXT2, marginBottom: "1.5rem" }}>Ready to generate your diagnostic report.</p>
          <div style={{ background: C_BG2, borderRadius: 8, padding: "1rem", marginBottom: "1.5rem", fontSize: 14 }}>
            <p style={{ margin: "0 0 4px", fontWeight: 500 }}>
              {form.appliance} · {form.brand}{form.model ? ` · ${form.model}` : ""}
            </p>
            <p style={{ margin: "0 0 4px", color: C_TXT2 }}>Symptom: {form.symptom}</p>
            {form.age && <p style={{ margin: 0, color: C_TXT2 }}>Age: {form.age}</p>}
          </div>
          <p style={{ fontSize: 13, color: C_TXT2, marginBottom: "1.5rem" }}>
            Diagnostic fee: <strong>{fee}</strong> — waived when you approve the repair.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(4)} style={btnBack}>← Back</button>
            <button onClick={runDiagnosis} disabled={loading} style={{ ...btnPrimary(!loading), flex: 2 }}>
              {loading ? "Analyzing…" : "Get my diagnosis →"}
            </button>
          </div>
        </div>
      )}

      {step === 6 && result && (
        <div style={cardSafe}>
          <p style={{ fontSize: 12, color: C_TXT2, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
            AI Diagnostic Report
          </p>
          <p style={{ fontSize: 15, fontWeight: 500, marginBottom: "1rem" }}>
            {form.brand} {form.appliance}{form.model ? ` · ${form.model}` : ""} — {form.symptom}
          </p>
          <div style={{ borderLeft: "3px solid #C8102E", paddingLeft: "1rem", marginBottom: "1rem" }}>
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", color: C_TXT }}>{result}</p>
          </div>
          {serviceUrl && (
            <a
              href={serviceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-block", marginBottom: "1.25rem", color: "#C8102E", fontWeight: 500, fontSize: 14, textDecoration: "underline" }}
            >
              Learn more about this service →
            </a>
          )}
          <div style={{ background: "#fff8ed", borderWidth: "0.5px", borderStyle: "solid", borderColor: "#fde68a", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem" }}>
            <p style={{ fontSize: 13, color: "#92400e", margin: 0 }}>
              This report is based on your description and reflects the most common causes — not a confirmed diagnosis. Exact cause and price are determined after on-site inspection by a licensed technician (BHGS #A49573).
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a
              href="/book/"
              style={{ display: "block", padding: "0.85rem", borderRadius: 8, background: "#C8102E", color: "#fff", border: "none", fontSize: 15, fontWeight: 500, textAlign: "center", textDecoration: "none" }}
            >
              Book Online →
            </a>
            {callbackRequested ? (
              <p style={{ textAlign: "center", color: "#059669", fontWeight: 500, fontSize: 14, margin: 0 }}>
                ✓ Request received — we'll call you within 10 minutes
              </p>
            ) : (
              <button
                onClick={handleCallback}
                style={{
                  padding: "0.85rem",
                  borderRadius: 8,
                  background: C_BG,
                  borderWidth: "0.5px",
                  borderStyle: "solid",
                  borderColor: C_BRD,
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: "pointer",
                  color: C_TXT,
                }}
              >
                Request a Callback — we'll call within 10 minutes
                <br />
                <small style={{ fontWeight: 400, fontSize: 12, color: C_TXT2 }}>If we're late — 5% off your repair</small>
              </button>
            )}
          </div>
          <p style={{ fontSize: 12, color: C_TXT2, marginTop: "1rem", marginBottom: 0 }}>
            Diagnostic fee waived when you approve the repair. BHGS #A49573 · CSLB C-20 HVAC · EPA 608 Universal · BBB Accredited Business.{" "}
            Or call{" "}
            <a href={`tel:+1${phone.replace(/\D/g, "")}`} style={{ color: "#C8102E" }}>{phone}</a>{" "}
            directly.
          </p>
          <button
            onClick={() => {
              setStep(1);
              setForm(initialForm);
              setResult(null);
              setCallbackRequested(false);
            }}
            style={{ marginTop: "0.75rem", background: "none", border: "none", fontSize: 13, color: C_TXT2, cursor: "pointer", padding: 0 }}
          >
            Start a new diagnosis
          </button>
        </div>
      )}
    </div>
  );
}
