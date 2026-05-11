import { useState } from 'react';

const APPLIANCES = [
  'Refrigerator',
  'Freezer',
  'Washer',
  'Dryer',
  'Dishwasher',
  'Oven / Range',
  'Cooktop',
  'Microwave',
  'Range Hood',
  'Wine Cooler / Cellar',
  'Ice Machine',
  'Outdoor Refrigerator',
  'Walk-in Cooler/Freezer',
  'Other',
];

const SERVICE_URLS = {
  'Refrigerator': 'https://samedayappliance.repair/services/refrigerator-repair/',
  'Freezer': 'https://samedayappliance.repair/services/refrigerator-repair/',
  'Dishwasher': 'https://samedayappliance.repair/services/dishwasher-repair/',
  'Washer': 'https://samedayappliance.repair/services/washer-repair/',
  'Dryer': 'https://samedayappliance.repair/services/dryer-repair/',
  'Oven / Range': 'https://samedayappliance.repair/services/oven-repair/',
  'Cooktop': 'https://samedayappliance.repair/services/cooktop-repair/',
  'Microwave': 'https://samedayappliance.repair/services/microwave-repair/',
  'Wine Cooler / Cellar': 'https://samedayappliance.repair/services/wine-cellar-cooling-repair/',
  'Ice Machine': 'https://samedayappliance.repair/commercial/ice-machines/',
  'Outdoor Refrigerator': 'https://samedayappliance.repair/outdoor/outdoor-refrigerator-repair/',
  'Range Hood': 'https://samedayappliance.repair/services/range-hood-repair/',
  'Walk-in Cooler/Freezer': 'https://samedayappliance.repair/commercial/refrigeration/',
};

const BRANDS_BY_APPLIANCE = {
  'Refrigerator':           ['Sub-Zero','Thermador','Viking','Miele','Liebherr','True Residential','GE Monogram','JennAir','KitchenAid','Bosch','Dacor','Fisher & Paykel','LG','Samsung','GE','Whirlpool','Maytag','Frigidaire','Haier','Other'],
  'Freezer':                ['Sub-Zero','Thermador','True Residential','GE Monogram','LG','Samsung','GE','Whirlpool','Frigidaire','Other'],
  'Dishwasher':             ['Miele','Thermador','JennAir','Cove','Gaggenau','KitchenAid','Bosch','Dacor','Fisher & Paykel','Asko','LG','Samsung','GE','Whirlpool','Maytag','Frigidaire','Other'],
  'Washer':                 ['Miele','Asko','Bosch','Speed Queen','Electrolux','Fisher & Paykel','LG','Samsung','GE','Whirlpool','Maytag','Haier','Frigidaire','Other'],
  'Dryer':                  ['Miele','Asko','Bosch','Speed Queen','Electrolux','Fisher & Paykel','LG','Samsung','GE','Whirlpool','Maytag','Frigidaire','Other'],
  'Oven / Range':           ['Wolf','Thermador','Viking','JennAir','Miele','Gaggenau','KitchenAid','Bosch','Bertazzoni','Dacor','BlueStar','Hestan','LG','Samsung','GE','Whirlpool','Maytag','Frigidaire','Other'],
  'Cooktop':                ['Wolf','Thermador','Viking','JennAir','KitchenAid','Bosch','GE','Whirlpool','Other'],
  'Microwave':              ['Wolf','Thermador','Miele','JennAir','KitchenAid','Dacor','LG','Samsung','GE','Whirlpool','Maytag','Sharp','Panasonic','Other'],
  'Wine Cooler / Cellar':   ['Sub-Zero','Viking','Liebherr','Miele','Gaggenau','True Residential','Thermador','U-Line','WhisperKool','CellarPro','Breezaire','Other'],
  'Ice Machine':            ['Sub-Zero','Viking','Thermador','GE Monogram','GE Profile','LG','Samsung','GE','Whirlpool','Maytag','Miele','Frigidaire','Other'],
  'Outdoor Refrigerator':   ['Sub-Zero','Viking','U-Line','Perlick','Hestan','Other'],
  'Range Hood':             ['Wolf','Thermador','Viking','Miele','JennAir','GE Monogram','BlueStar','Hestan','Fisher & Paykel','Bosch','KitchenAid','Zephyr','GE Profile','LG','Samsung','Whirlpool','Broan','GE','Frigidaire','Maytag','Other'],
  'Walk-in Cooler/Freezer': ['True Refrigeration','Hoshizaki','Traulsen','Beverage-Air','Delfield','Nor-Lake','Other'],
};

const AGE_OPTIONS = [
  'Less than 1 year',
  '1–3 years',
  '4–7 years',
  '8–12 years',
  '12+ years',
  'Not sure',
];

const initialForm = {
  appliance: '',
  brand: '',
  model: '',
  symptom: '',
  age: '',
  detail: '',
  name: '',
  phone: '',
  email: '',
};

export default function AIDiagnostic({ phone = '(323) 870-4790' }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [callbackRequested, setCallbackRequested] = useState(false);

  const phoneTel = '+1' + phone.replace(/\D/g, '');

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const pick = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const phoneDigits = (s) => String(s || '').replace(/\D/g, '');

  const canAdvance = () => {
    if (step === 1) return !!form.appliance;
    if (step === 2) return !!form.brand;
    if (step === 3) return form.symptom.trim().length >= 10;
    if (step === 4)
      return (
        !!form.name.trim() &&
        phoneDigits(form.phone).length >= 10 &&
        /\S+@\S+\.\S+/.test(form.email)
      );
    return true;
  };

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async () => {
    setLoading(true);
    setError('');
    try {
      const serviceUrl =
        SERVICE_URLS[form.appliance] || 'https://samedayappliance.repair/services/';

      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appliance: form.appliance,
          brand: form.brand,
          model: form.model,
          symptom: form.symptom,
          age: form.age,
          detail: form.detail,
          serviceUrl,
          // diagnose.js expects these keys for its system prompt:
          equipment: form.appliance,
          equipmentLabel: form.appliance,
          description: [form.symptom, form.detail, form.age && `Age: ${form.age}`]
            .filter(Boolean)
            .join('\n\n'),
        }),
      });
      const data = await res.json();
      const text = data.result || 'Call ' + phone + ' for a free phone diagnosis.';
      setResult(text);

      // Fire-and-forget Telegram dispatcher log via existing /api/contact route.
      // `name: '🤖 AI Diagnostics'` is the routing trigger inside contact.js;
      // the real customer name goes in `customerName` so it renders correctly.
      fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '🤖 AI Diagnostics',
          customerName: form.name,
          email: form.email,
          phone: form.phone,
          appliance: form.appliance,
          brand: form.brand,
          model: form.model,
          symptom: form.symptom,
          age: form.age,
          detail: form.detail,
          result: text,
          // contact.js telegram template uses these fields:
          equipment: form.appliance,
          equipmentLabel: form.appliance,
          description: form.symptom + (form.detail ? '\n\n' + form.detail : ''),
          brand_site: 'samedayappliance.repair',
        }),
      }).catch(() => {});
    } catch (err) {
      setError('Something went wrong. Call ' + phone + ' for a free phone diagnosis.');
    } finally {
      setLoading(false);
    }
  };

  const handleCallback = async () => {
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'callback',
          name: form.name,
          phone: form.phone,
          email: form.email,
          appliance: form.appliance,
          brand: form.brand,
          model: form.model,
          symptom: form.symptom,
          result: result,
          source: 'ai-diagnostic',
          brand_site: 'samedayappliance.repair',
        }),
      });
    } catch {
      /* fire-and-forget — fall through to confirmation either way */
    }
    setCallbackRequested(true);
  };

  const reset = () => {
    setStep(1);
    setForm(initialForm);
    setResult('');
    setError('');
    setCallbackRequested(false);
  };

  if (result) {
    return (
      <div style={styles.card}>
        <div style={styles.eyebrow}>AI Diagnosis</div>
        <h2 style={styles.h2}>Here's what's likely going on</h2>
        <div style={styles.resultBox}>{result}</div>

        {SERVICE_URLS[form.appliance] && (
          <a
            href={SERVICE_URLS[form.appliance]}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              marginTop: '1rem',
              marginBottom: '1.25rem',
              color: '#C8102E',
              fontWeight: 500,
              fontSize: '14px',
              textDecoration: 'underline',
            }}
          >
            Подробнее об этой услуге →
          </a>
        )}

        <div style={styles.ctaStack}>
          <a href="/book/" style={styles.ctaPrimary}>
            Забронировать онлайн →
          </a>

          {callbackRequested ? (
            <p style={styles.callbackOk}>
              ✓ Заявка принята — ждите звонка в течение 10 минут
            </p>
          ) : (
            <button
              type="button"
              onClick={handleCallback}
              style={styles.ctaOutline}
            >
              <span style={styles.ctaOutlineMain}>
                Запросить обратный звонок — перезвоним за 10 минут
              </span>
              <span style={styles.ctaOutlineSub}>
                Если позже — скидка 5% на стоимость работ
              </span>
            </button>
          )}
        </div>

        <p style={styles.smallNote}>
          Diagnostic fee waived when you approve the repair. BHGS #A49573 · CSLB C-20 HVAC · EPA 608 Universal · BBB Accredited Business.
          <br />
          Or call <a href={`tel:${phoneTel}`} style={styles.inlineCall}>{phone}</a> directly.
        </p>

        <button type="button" onClick={reset} style={styles.resetBtn}>
          Start a new diagnosis
        </button>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.progressRow}>
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            style={{
              ...styles.progressDot,
              background: n <= step ? '#C8102E' : '#e2e2e2',
            }}
          />
        ))}
      </div>
      <div style={styles.stepLabel}>Step {step} of 4</div>

      {step === 1 && (
        <>
          <h2 style={styles.h2}>What appliance is giving you trouble?</h2>
          <div style={styles.grid}>
            {APPLIANCES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    appliance: a,
                    brand: (BRANDS_BY_APPLIANCE[a] || []).includes(f.brand) ? f.brand : '',
                  }))
                }
                style={{
                  ...styles.choice,
                  ...(form.appliance === a ? styles.choiceActive : {}),
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 style={styles.h2}>Which brand?</h2>
          <div style={styles.grid}>
            {(BRANDS_BY_APPLIANCE[form.appliance] || ['Other']).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => pick('brand', b)}
                style={{
                  ...styles.choice,
                  ...(form.brand === b ? styles.choiceActive : {}),
                }}
              >
                {b}
              </button>
            ))}
          </div>
          <label style={styles.label}>
            Model number <span style={styles.optional}>(optional)</span>
            <input
              type="text"
              value={form.model}
              onChange={update('model')}
              placeholder="e.g. BI-48SD"
              style={styles.input}
            />
          </label>
        </>
      )}

      {step === 3 && (
        <>
          <h2 style={styles.h2}>Describe the problem</h2>
          <label style={styles.label}>
            What's it doing (or not doing)?
            <textarea
              value={form.symptom}
              onChange={update('symptom')}
              placeholder="e.g. Freezer is fine but the fridge side is warm"
              rows={3}
              style={styles.textarea}
            />
            <span style={styles.hint}>
              {form.symptom.trim().length < 10
                ? `${10 - form.symptom.trim().length} more characters needed`
                : 'Looks good'}
            </span>
          </label>

          <label style={styles.label}>
            How old is the unit?
            <select value={form.age} onChange={update('age')} style={styles.input}>
              <option value="">Select…</option>
              {AGE_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Anything else helpful? <span style={styles.optional}>(optional)</span>
            <textarea
              value={form.detail}
              onChange={update('detail')}
              placeholder="Noises, error codes, when it started, what you've already tried…"
              rows={3}
              style={styles.textarea}
            />
          </label>
        </>
      )}

      {step === 4 && (
        <>
          <h2 style={styles.h2}>Where should we send the diagnosis?</h2>
          <p style={styles.subtle}>
            We'll show your diagnosis on this page. Email is so we can send you the report
            and follow up if you want a tech out.
          </p>
          <label style={styles.label}>
            Your name
            <input
              type="text"
              value={form.name}
              onChange={update('name')}
              placeholder="First name is fine"
              style={styles.input}
            />
          </label>
          <label style={styles.label}>
            Phone number
            <input
              type="tel"
              value={form.phone}
              onChange={update('phone')}
              placeholder="(323) 000-0000"
              autoComplete="tel"
              style={styles.input}
              required
            />
          </label>
          <label style={styles.label}>
            Email
            <input
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              style={styles.input}
            />
          </label>
          {error && <div style={styles.errorBox}>{error}</div>}
        </>
      )}

      <div style={styles.navRow}>
        {step > 1 && (
          <button type="button" onClick={back} style={styles.btnGhost} disabled={loading}>
            ← Back
          </button>
        )}
        {step < 4 && (
          <button
            type="button"
            onClick={next}
            disabled={!canAdvance()}
            style={{
              ...styles.btnPrimary,
              opacity: canAdvance() ? 1 : 0.4,
              cursor: canAdvance() ? 'pointer' : 'not-allowed',
            }}
          >
            Continue →
          </button>
        )}
        {step === 4 && (
          <button
            type="button"
            onClick={submit}
            disabled={!canAdvance() || loading}
            style={{
              ...styles.btnPrimary,
              opacity: canAdvance() && !loading ? 1 : 0.4,
              cursor: canAdvance() && !loading ? 'pointer' : 'not-allowed',
            }}
          >
            {loading ? 'Diagnosing…' : 'Get my diagnosis'}
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  card: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    background: '#ffffff',
    border: '1px solid #e2e2e2',
    borderRadius: 12,
    padding: '28px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    color: '#1a1a1a',
  },
  progressRow: { display: 'flex', gap: 6, marginBottom: 8 },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    transition: 'background 0.2s ease',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#6b6b6b',
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#C8102E',
    marginBottom: 8,
  },
  h2: {
    fontSize: '1.35rem',
    fontWeight: 700,
    lineHeight: 1.3,
    margin: '0 0 16px 0',
  },
  subtle: {
    color: '#6b6b6b',
    fontSize: 14,
    lineHeight: 1.6,
    margin: '0 0 16px 0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 8,
    marginBottom: 8,
  },
  choice: {
    padding: '12px 14px',
    background: '#f5f5f5',
    border: '1px solid #e2e2e2',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    textAlign: 'left',
    cursor: 'pointer',
    color: '#1a1a1a',
    transition: 'all 0.15s ease',
  },
  choiceActive: {
    background: '#fff5f6',
    borderColor: '#C8102E',
    color: '#C8102E',
    fontWeight: 600,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#1a1a1a',
    marginTop: 16,
  },
  optional: { color: '#999', fontWeight: 400 },
  input: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: 6,
    padding: '10px 12px',
    fontSize: 15,
    border: '1px solid #d6d6d6',
    borderRadius: 6,
    fontFamily: 'inherit',
    color: '#1a1a1a',
    background: '#fff',
  },
  textarea: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: 6,
    padding: '10px 12px',
    fontSize: 15,
    border: '1px solid #d6d6d6',
    borderRadius: 6,
    fontFamily: 'inherit',
    color: '#1a1a1a',
    background: '#fff',
    resize: 'vertical',
  },
  hint: {
    display: 'block',
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontWeight: 400,
  },
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 24,
    flexWrap: 'wrap',
  },
  btnGhost: {
    padding: '12px 18px',
    background: 'transparent',
    border: '1px solid #d6d6d6',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1a1a',
    cursor: 'pointer',
  },
  btnPrimary: {
    padding: '12px 22px',
    background: '#C8102E',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.02em',
    marginLeft: 'auto',
  },
  errorBox: {
    marginTop: 16,
    padding: '10px 12px',
    background: '#fff5f6',
    border: '1px solid #C8102E',
    borderRadius: 6,
    color: '#C8102E',
    fontSize: 13,
  },
  resultBox: {
    padding: '20px 22px',
    background: '#f7f7f7',
    borderLeft: '3px solid #C8102E',
    borderRadius: 4,
    fontSize: 15,
    lineHeight: 1.7,
    color: '#1a1a1a',
    whiteSpace: 'pre-wrap',
    margin: '0 0 24px 0',
  },
  ctaStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  ctaPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 24px',
    background: '#C8102E',
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
    textDecoration: 'none',
    borderRadius: 6,
    letterSpacing: '0.02em',
  },
  ctaOutline: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '14px 22px',
    background: '#fff',
    color: '#1a1a1a',
    border: '1.5px solid #C8102E',
    borderRadius: 6,
    fontFamily: 'inherit',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'center',
  },
  ctaOutlineMain: {
    fontWeight: 600,
    fontSize: 14,
    lineHeight: 1.3,
    color: '#C8102E',
  },
  ctaOutlineSub: {
    fontSize: 12,
    color: '#6b6b6b',
    lineHeight: 1.4,
  },
  callbackOk: {
    margin: 0,
    padding: '14px 18px',
    background: '#eaf7ed',
    border: '1px solid #b9e0c2',
    borderRadius: 6,
    color: '#1f7a3a',
    fontSize: 14,
    fontWeight: 600,
    textAlign: 'center',
  },
  inlineCall: {
    color: '#C8102E',
    textDecoration: 'none',
    fontWeight: 600,
  },
  smallNote: {
    fontSize: 12,
    color: '#6b6b6b',
    lineHeight: 1.6,
    margin: '0 0 20px 0',
  },
  resetBtn: {
    background: 'transparent',
    border: 'none',
    color: '#6b6b6b',
    fontSize: 13,
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: 0,
  },
};
