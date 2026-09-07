// src/components/QuoteSheet.client.ts
//
// Quote-sheet state machine. Loaded as its own chunk on the first trigger click
// (see the loader in QuoteSheet.astro), so none of this is in the page's initial
// JS. Vanilla — no framework, no runtime dependency.
//
// Every user-visible string and every number comes out of the #qs-data JSON blob,
// which QuoteSheet.astro built from src/data/quote-copy.ts. This file deliberately
// contains no currency literal; scripts/check-quote-sheet.mjs fails the build if
// one appears.

type Scope = 'residential' | 'commercial';

interface Appliance {
  id: string;
  label: string;
  problems: string[];
}

interface QuoteData {
  appliances: Record<Scope, Appliance[]>;
  price: Record<Scope, string>;
  copy: {
    terms: string[];
    scopeLabels: Record<Scope, string>;
    hours: string;
    callback: { heading: string; body: string; callPrompt: string };
    price: {
      eyebrow: string;
      residentialLabel: string;
      commercialLabel: string;
      note: string;
    };
    steps: { id: string; heading: string }[];
    totalSteps: number;
    outOfZone: string;
    visitTimes: { id: string; label: string; hint: string }[];
    photos: { hint: string; max: number; skip: string; maxBytes: number; tooBig: string };
    errors: { rateLimited: string; failed: string };
  };
  zone: {
    exact: Record<string, string>;
    prefix3: Record<string, string>;
    mainSlug: string;
  };
  phones: {
    main: string;
    mainTel: string;
    branches: Record<string, { name: string; phone: string }>;
  };
}

interface Photo {
  /** Remote URL once the upload lands; empty while it is still in flight. */
  url: string;
  /** Local object URL, so the thumbnail appears the moment the file is picked. */
  localUrl: string;
  name: string;
  state: 'uploading' | 'done' | 'failed';
}

interface State {
  step: number;
  where: Scope | null;
  appliance: string | null;
  problems: string[];
  problemText: string;
  photos: Photo[];
  name: string;
  phone: string;
  address: string;
  zip: string;
  visitTime: string;
  visitDate: string;
  notes: string;
  source: string;
}

const STORE_KEY = 'sdar_qs_v1';

let data: QuoteData;
let dlg: HTMLDialogElement;
let elBody: HTMLElement;
let elHeading: HTMLElement;
let elCounter: HTMLElement;
let elBack: HTMLButtonElement;
let elClose: HTMLButtonElement;
let elPrimary: HTMLButtonElement;
let elFootNote: HTMLElement;

let state: State = blank();
let booted = false;
let open = false;
let submitting = false;
let doneView = false;
let priceSeen = false;
const errors: Record<string, string> = {};

// ── helpers ──────────────────────────────────────────────────────────────────

function blank(): State {
  return {
    step: 0,
    where: null,
    appliance: null,
    problems: [],
    problemText: '',
    photos: [],
    name: '',
    phone: '',
    address: '',
    zip: '',
    visitTime: '',
    visitDate: '',
    notes: '',
    source: 'unknown',
  };
}

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default: return '&#39;';
    }
  });
}

function track(event: string, extra: Record<string, unknown> = {}): void {
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...extra });
}

function digits(s: string): string {
  return String(s || '').replace(/\D/g, '');
}

function formatPhone(raw: string): string {
  const d = digits(raw).slice(0, 10);
  if (d.length > 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length > 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  if (d.length > 0) return `(${d}`;
  return '';
}

function telHref(display: string): string {
  return 'tel:+1' + digits(display);
}

function zipToBranch(zip: string): string {
  const z = digits(zip).slice(0, 5);
  if (z.length < 5) return data.zone.mainSlug;
  return data.zone.exact[z] || data.zone.prefix3[z.slice(0, 3)] || data.zone.mainSlug;
}

function inZone(zip: string): boolean {
  const z = digits(zip).slice(0, 5);
  if (z.length < 5) return false;
  return Boolean(data.zone.exact[z] || data.zone.prefix3[z.slice(0, 3)]);
}

function branchPhone(slug: string): string {
  return data.phones.branches[slug]?.phone || data.phones.main;
}

function branchName(slug: string): string {
  return data.phones.branches[slug]?.name || slug;
}

function appliancesFor(scope: Scope): Appliance[] {
  return data.appliances[scope] || [];
}

function currentAppliance(): Appliance | null {
  if (!state.where || !state.appliance) return null;
  return appliancesFor(state.where).find((a) => a.id === state.appliance) || null;
}

function isDirty(): boolean {
  return Boolean(
    state.where ||
      state.appliance ||
      state.problems.length ||
      state.problemText ||
      state.photos.length ||
      state.name ||
      state.phone ||
      state.address ||
      state.zip ||
      state.notes
  );
}

// ── persistence ──────────────────────────────────────────────────────────────

function save(): void {
  try {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — resume is a convenience, never a requirement */
  }
}

function restore(): void {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as Partial<State>;
    if (!saved || typeof saved !== 'object') return;
    state = { ...blank(), ...saved };
    // Object URLs from the previous page load are dead; keep only uploaded photos.
    state.photos = (state.photos || []).filter((p) => p && p.state === 'done' && p.url)
      .map((p) => ({ ...p, localUrl: '' }));
    if (typeof state.step !== 'number' || state.step < 0 || state.step >= data.copy.totalSteps) {
      state.step = 0;
    }
  } catch {
    state = blank();
  }
}

function clearSaved(): void {
  try {
    sessionStorage.removeItem(STORE_KEY);
  } catch {
    /* nothing to do */
  }
}

// ── boot ─────────────────────────────────────────────────────────────────────

function boot(): boolean {
  if (booted) return true;
  const node = document.getElementById('qs-data');
  const d = document.getElementById('quote-sheet') as HTMLDialogElement | null;
  if (!node || !d) return false;
  try {
    data = JSON.parse(node.textContent || '{}') as QuoteData;
  } catch {
    return false;
  }
  dlg = d;
  elBody = document.getElementById('qs-body') as HTMLElement;
  elHeading = document.getElementById('qs-heading') as HTMLElement;
  elCounter = document.getElementById('qs-counter') as HTMLElement;
  elBack = document.getElementById('qs-back') as HTMLButtonElement;
  elClose = document.getElementById('qs-close') as HTMLButtonElement;
  elPrimary = document.getElementById('qs-primary') as HTMLButtonElement;
  elFootNote = document.getElementById('qs-foot-note') as HTMLElement;

  elBack.addEventListener('click', () => {
    if (state.step > 0) history.back();
  });
  elClose.addEventListener('click', requestClose);
  elPrimary.addEventListener('click', onPrimary);
  elBody.addEventListener('click', onBodyClick);
  elBody.addEventListener('input', onBodyInput);
  elBody.addEventListener('change', onBodyChange);

  // Esc closes through the same confirm path as the × button.
  dlg.addEventListener('cancel', (ev) => {
    ev.preventDefault();
    requestClose();
  });

  window.addEventListener('popstate', onPopState);

  booted = true;
  return true;
}

// ── open / close ─────────────────────────────────────────────────────────────

export function openSheet(source: string): void {
  if (!boot()) return;
  if (open) return;

  restore();
  state.source = source || state.source || 'unknown';
  doneView = false;
  submitting = false;
  priceSeen = false;
  for (const k of Object.keys(errors)) delete errors[k];

  open = true;
  document.documentElement.classList.add('qs-open');
  if (!dlg.open) dlg.showModal();
  history.pushState({ qsStep: state.step }, '');
  track('quote_open', { source: state.source, step: state.step });
  render();
}

function closeSheet(reason: string): void {
  if (!open) return;
  open = false;
  document.documentElement.classList.remove('qs-open');
  if (dlg.open) dlg.close();
  track('quote_close', { reason, step: state.step });
}

function requestClose(): void {
  if (doneView) {
    clearSaved();
    state = blank();
    closeSheet('done');
    return;
  }
  if (!isDirty()) {
    closeSheet('empty');
    return;
  }
  // Inline confirm — never a native confirm(), which a modal dialog would sit under.
  const existing = elBody.querySelector('.qs-close-confirm');
  if (existing) return;
  const box = document.createElement('div');
  box.className = 'qs-note qs-note-warn qs-close-confirm';
  box.innerHTML =
    '<div>Close the sheet? Your answers stay saved — reopening picks up here.</div>' +
    '<div class="qs-confirm">' +
    '<button type="button" class="qs-stay" data-act="stay">Keep going</button>' +
    '<button type="button" class="qs-discard" data-act="leave">Close</button>' +
    '</div>';
  elBody.prepend(box);
  (box.querySelector('[data-act="stay"]') as HTMLButtonElement | null)?.focus();
}

// ── history ──────────────────────────────────────────────────────────────────

function go(next: number): void {
  const clamped = Math.max(0, Math.min(next, data.copy.totalSteps - 1));
  if (clamped === state.step) return;
  state.step = clamped;
  save();
  history.pushState({ qsStep: clamped }, '');
  track('quote_step', { step: clamped + 1, step_id: data.copy.steps[clamped]?.id });
  render();
}

function onPopState(ev: PopStateEvent): void {
  if (!open) return;
  const target = (ev.state as { qsStep?: number } | null)?.qsStep;
  if (typeof target === 'number') {
    state.step = Math.max(0, Math.min(target, data.copy.totalSteps - 1));
    save();
    render();
    return;
  }
  // Popped past our first entry. Back must never close the sheet, so put an entry
  // back and stay where we are.
  history.pushState({ qsStep: state.step }, '');
  render();
}

// ── rendering ────────────────────────────────────────────────────────────────

function render(): void {
  if (doneView) return renderDone();

  const step = data.copy.steps[state.step];
  elHeading.textContent = step.heading;
  elCounter.textContent = `${state.step + 1} / ${data.copy.totalSteps}`;
  elBack.hidden = state.step === 0;
  elFootNote.textContent = '';

  const parts: string[] = [`<h2 id="qs-heading" class="qs-h">${esc(step.heading)}</h2>`];
  switch (step.id) {
    case 'where': parts.push(viewWhere()); break;
    case 'appliance': parts.push(viewAppliance()); break;
    case 'problem': parts.push(viewProblem()); break;
    case 'photos': parts.push(viewPhotos()); break;
    case 'price': parts.push(viewPrice()); break;
    case 'contact': parts.push(viewContact()); break;
  }
  elBody.innerHTML = parts.join('');
  elHeading = document.getElementById('qs-heading') as HTMLElement;
  elBody.scrollTop = 0;

  elPrimary.hidden = false;
  elPrimary.disabled = false;
  elPrimary.textContent = primaryLabel(step.id);

  if (step.id === 'price' && !priceSeen) {
    priceSeen = true;
    track('quote_price_shown', {
      where: state.where,
      price: state.where ? data.price[state.where] : '',
    });
  }
}

function primaryLabel(stepId: string): string {
  if (stepId === 'photos') return 'Continue';
  if (stepId === 'price') return 'Continue';
  if (stepId === 'contact') return submitting ? 'Sending…' : 'Send request';
  return 'Continue';
}

function viewWhere(): string {
  const tiles = [
    { id: 'residential', label: data.copy.price.residentialLabel, hint: 'House, condo, apartment' },
    { id: 'commercial', label: data.copy.price.commercialLabel, hint: 'Restaurant, bar, hotel, shop' },
  ];
  return (
    `<p class="qs-sub">This sets the diagnostic price and which crew we send.</p>` +
    `<div class="qs-tiles">` +
    tiles
      .map(
        (t) =>
          `<button type="button" class="qs-tile" data-act="where" data-val="${esc(t.id)}"` +
          ` aria-pressed="${state.where === t.id}">` +
          `<span>${esc(t.label)}</span><span class="qs-tile-hint">${esc(t.hint)}</span></button>`
      )
      .join('') +
    `</div>`
  );
}

function viewAppliance(): string {
  const list = state.where ? appliancesFor(state.where) : [];
  return (
    `<p class="qs-sub">Pick the closest one.</p>` +
    `<div class="qs-tiles qs-two">` +
    list
      .map(
        (a) =>
          `<button type="button" class="qs-tile" data-act="appliance" data-val="${esc(a.id)}"` +
          ` aria-pressed="${state.appliance === a.id}">${esc(a.label)}</button>`
      )
      .join('') +
    `</div>` +
    (errors.appliance ? `<span class="qs-err">${esc(errors.appliance)}</span>` : '')
  );
}

function viewProblem(): string {
  const app = currentAppliance();
  const list = app ? app.problems : [];
  return (
    `<p class="qs-sub">Tap anything that fits. More than one is fine.</p>` +
    `<div class="qs-tiles qs-two">` +
    list
      .map(
        (p) =>
          `<button type="button" class="qs-tile" data-act="problem" data-val="${esc(p)}"` +
          ` aria-pressed="${state.problems.includes(p)}">${esc(p)}</button>`
      )
      .join('') +
    `</div>` +
    `<label class="qs-field"><span>Anything else? <em>(optional)</em></span>` +
    `<textarea class="qs-textarea" id="qs-freetext" data-field="problemText"` +
    ` placeholder="Model number, when it started, noises…">${esc(state.problemText)}</textarea></label>` +
    (errors.problem ? `<span class="qs-err">${esc(errors.problem)}</span>` : '')
  );
}

function viewPhotos(): string {
  const max = data.copy.photos.max;
  const full = state.photos.length >= max;
  return (
    `<p class="qs-sub">${esc(data.copy.photos.hint)}</p>` +
    `<div class="qs-photos">` +
    state.photos
      .map(
        (p, i) =>
          `<div class="qs-thumb qs-thumb-${esc(p.state)}">` +
          `<img src="${esc(p.localUrl || p.url)}" alt="${esc(p.name)}" />` +
          (p.state === 'uploading' ? `<span class="qs-thumb-badge">Uploading…</span>` : '') +
          (p.state === 'failed' ? `<span class="qs-thumb-badge qs-thumb-bad">Not attached</span>` : '') +
          `<button type="button" data-act="rmphoto" data-val="${i}" aria-label="Remove photo">×</button></div>`
      )
      .join('') +
    `</div>` +
    (full
      ? ''
      : `<label class="qs-field"><span>Add a photo <em>(up to ${max})</em></span>` +
        `<input class="qs-input" type="file" id="qs-photo-input" accept="image/*" data-act="photo" /></label>`) +
    `<div id="qs-photo-status" class="qs-foot-note"></div>` +
    `<button type="button" class="qs-skip" data-act="skip-photos">${esc(data.copy.photos.skip)}</button>`
  );
}

function viewPrice(): string {
  const scope: Scope = state.where === 'commercial' ? 'commercial' : 'residential';
  const amount = data.price[scope];
  const label =
    scope === 'commercial' ? data.copy.price.commercialLabel : data.copy.price.residentialLabel;
  return (
    `<div class="qs-price">` +
    `<span class="qs-price-eyebrow">${esc(label)}</span>` +
    `<span class="qs-price-amount">${esc(amount)}</span>` +
    `</div>` +
    `<ul class="qs-terms">` +
    data.copy.terms.map((t) => `<li>${esc(t)}</li>`).join('') +
    `</ul>` +
    `<p class="qs-price-note">${esc(data.copy.price.note)}</p>` +
    `<p class="qs-hours">${esc(data.copy.hours)}</p>`
  );
}

function viewContact(): string {
  const zoneWarn = state.zip.length === 5 && !inZone(state.zip);
  const showDate = state.visitTime === 'pick_date';
  return (
    `<p class="qs-sub">Last step. A dispatcher calls to confirm the window.</p>` +
    field('Your name', 'qs-name', 'name', 'text', { autocomplete: 'name', placeholder: 'First name' }) +
    field('Phone', 'qs-phone', 'phone', 'tel', {
      autocomplete: 'tel',
      inputmode: 'numeric',
      placeholder: '(000) 000-0000',
    }) +
    field('Address', 'qs-address', 'address', 'text', {
      autocomplete: 'street-address',
      placeholder: 'Street address',
    }) +
    field('ZIP', 'qs-zip', 'zip', 'text', {
      autocomplete: 'postal-code',
      inputmode: 'numeric',
      placeholder: '90048',
      maxlength: '5',
    }) +
    (zoneWarn ? `<div class="qs-note qs-note-warn" id="qs-zone-note">${esc(data.copy.outOfZone)}</div>` : '') +
    `<div class="qs-field"><span>When works?</span><div class="qs-tiles">` +
    data.copy.visitTimes
      .map(
        (t) =>
          `<button type="button" class="qs-tile" data-act="visit" data-val="${esc(t.id)}"` +
          ` aria-pressed="${state.visitTime === t.id}">` +
          `<span>${esc(t.label)}</span><span class="qs-tile-hint">${esc(t.hint)}</span></button>`
      )
      .join('') +
    `</div></div>` +
    (showDate
      ? `<label class="qs-field"><span>Which day? <em>(we're closed Sundays)</em></span>` +
        `<input class="qs-input" type="date" id="qs-date" data-field="visitDate"` +
        ` min="${esc(minDate())}" value="${esc(state.visitDate)}" /></label>` +
        (errors.visitDate ? `<span class="qs-err">${esc(errors.visitDate)}</span>` : '')
      : '') +
    `<label class="qs-field"><span>Anything we should know? <em>(optional)</em></span>` +
    `<textarea class="qs-textarea" id="qs-notes" data-field="notes"` +
    ` placeholder="Gate code, parking, best time to call…">${esc(state.notes)}</textarea></label>`
  );
}

function field(
  label: string,
  id: string,
  fieldName: keyof State,
  type: string,
  attrs: Record<string, string>
): string {
  const extra = Object.entries(attrs)
    .map(([k, v]) => `${k}="${esc(v)}"`)
    .join(' ');
  const err = errors[fieldName as string];
  return (
    `<label class="qs-field"><span>${esc(label)}</span>` +
    `<input class="qs-input" type="${esc(type)}" id="${esc(id)}" data-field="${esc(fieldName)}"` +
    ` value="${esc(state[fieldName] as string)}" ${extra}` +
    (err ? ` aria-invalid="true"` : '') +
    ` />` +
    (err ? `<span class="qs-err">${esc(err)}</span>` : '') +
    `</label>`
  );
}

function minDate(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function renderDone(): void {
  const slug = zipToBranch(state.zip);
  const ph = branchPhone(slug);
  elCounter.textContent = '';
  elBack.hidden = true;
  elFootNote.textContent = '';
  elBody.innerHTML =
    `<div class="qs-done">` +
    `<div class="qs-done-mark" aria-hidden="true">✓</div>` +
    `<h3 id="qs-heading">${esc(data.copy.callback.heading)} ${esc(data.copy.callback.body)}</h3>` +
    `<p>${esc(data.copy.hours)}</p>` +
    `<p>${esc(data.copy.callback.callPrompt)}</p>` +
    `<a class="qs-call" href="${esc(telHref(ph))}">${esc(ph)}</a>` +
    `</div>`;
  elHeading = document.getElementById('qs-heading') as HTMLElement;
  elPrimary.textContent = 'Done';
  elPrimary.disabled = false;
  elPrimary.hidden = false;
}

// ── interaction ──────────────────────────────────────────────────────────────

function onBodyClick(ev: Event): void {
  const btn = (ev.target as Element | null)?.closest?.('[data-act]') as HTMLElement | null;
  if (!btn) return;
  const act = btn.getAttribute('data-act');
  const val = btn.getAttribute('data-val') || '';

  switch (act) {
    case 'where':
      if (state.where !== val) {
        // Switching scope invalidates the appliance and problem picks.
        state.appliance = null;
        state.problems = [];
      }
      state.where = val as Scope;
      priceSeen = false;
      save();
      go(state.step + 1);
      break;

    case 'appliance':
      if (state.appliance !== val) state.problems = [];
      state.appliance = val;
      delete errors.appliance;
      save();
      go(state.step + 1);
      break;

    case 'problem': {
      const i = state.problems.indexOf(val);
      if (i >= 0) state.problems.splice(i, 1);
      else state.problems.push(val);
      delete errors.problem;
      save();
      render();
      break;
    }

    case 'visit':
      state.visitTime = val;
      if (val !== 'pick_date') state.visitDate = '';
      delete errors.visitDate;
      save();
      render();
      break;

    case 'rmphoto': {
      const [gone] = state.photos.splice(Number(val), 1);
      if (gone?.localUrl) {
        try { URL.revokeObjectURL(gone.localUrl); } catch { /* already released */ }
      }
      save();
      render();
      break;
    }

    case 'skip-photos':
      state.photos = [];
      save();
      go(state.step + 1);
      break;

    case 'stay':
      btn.closest('.qs-close-confirm')?.remove();
      break;

    case 'leave':
      // Deliberately does NOT clear sessionStorage: reopening resumes here.
      save();
      closeSheet('leave');
      break;
  }
}

function onBodyInput(ev: Event): void {
  const el = ev.target as HTMLInputElement | HTMLTextAreaElement | null;
  if (!el) return;
  const key = el.getAttribute('data-field');
  if (!key) return;

  if (key === 'phone') {
    el.value = formatPhone(el.value);
  } else if (key === 'zip') {
    el.value = digits(el.value).slice(0, 5);
  }

  (state as unknown as Record<string, string>)[key] = el.value;
  if (errors[key]) {
    delete errors[key];
    el.removeAttribute('aria-invalid');
    el.parentElement?.querySelector('.qs-err')?.remove();
  }
  save();

  // The out-of-zone note appears and disappears live, without a re-render that
  // would blur the field the visitor is typing in.
  if (key === 'zip') syncZoneNote();
}

function syncZoneNote(): void {
  const existing = document.getElementById('qs-zone-note');
  const warn = state.zip.length === 5 && !inZone(state.zip);
  if (warn && !existing) {
    const zipField = document.getElementById('qs-zip')?.closest('.qs-field');
    if (!zipField) return;
    const note = document.createElement('div');
    note.className = 'qs-note qs-note-warn';
    note.id = 'qs-zone-note';
    note.textContent = data.copy.outOfZone;
    zipField.after(note);
  } else if (!warn && existing) {
    existing.remove();
  }
}

function onBodyChange(ev: Event): void {
  const el = ev.target as HTMLInputElement | null;
  if (!el) return;
  if (el.getAttribute('data-act') === 'photo' && el.files && el.files[0]) {
    void uploadPhoto(el.files[0]);
  }
}

// ── photos ───────────────────────────────────────────────────────────────────

function photoSession(): string {
  return 'quote-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

async function uploadPhoto(file: File): Promise<void> {
  // Phone cameras routinely clear the endpoint's 5 MB ceiling. Say so now rather
  // than after a slow upload that was always going to be rejected.
  if (file.size > data.copy.photos.maxBytes) {
    const status = document.getElementById('qs-photo-status');
    if (status) status.textContent = data.copy.photos.tooBig;
    return;
  }

  // The thumbnail goes up immediately from a local object URL — the visitor sees
  // their photo the moment they pick it, whatever the network is doing.
  const localUrl = URL.createObjectURL(file);
  const photo: Photo = { url: '', localUrl, name: file.name, state: 'uploading' };
  state.photos.push(photo);
  render();

  const finish = (nextState: Photo['state'], remoteUrl = '') => {
    photo.state = nextState;
    photo.url = remoteUrl;
    // Only the remote URL is worth persisting; an object URL dies with the page.
    save();
    render();
    const status = document.getElementById('qs-photo-status');
    if (status && nextState === 'failed') {
      status.textContent = "Couldn't attach — continuing without photo.";
    }
  };

  try {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('session_id', photoSession());
    fd.append('page_path', location.pathname);
    const res = await fetch('/api/chat/upload', { method: 'POST', body: fd });
    const body = (await res.json().catch(() => ({}))) as { public_url?: string };
    if (!res.ok || !body.public_url) throw new Error('upload');
    finish('done', body.public_url);
  } catch {
    // A photo is a nice-to-have. Never let it stall the lead.
    finish('failed');
  }
}

// ── validation + submit ──────────────────────────────────────────────────────

function validateContact(): boolean {
  for (const k of Object.keys(errors)) delete errors[k];
  if (!state.name.trim()) errors.name = 'Please enter your name.';
  if (digits(state.phone).length < 10) errors.phone = 'Enter a 10-digit phone number.';
  if (!state.address.trim()) errors.address = 'We need the address to route a truck.';
  if (digits(state.zip).length !== 5) errors.zip = 'Enter your 5-digit ZIP.';
  if (state.visitTime === 'pick_date') {
    if (!state.visitDate) {
      errors.visitDate = 'Pick a day.';
    } else if (new Date(state.visitDate + 'T12:00:00').getDay() === 0) {
      errors.visitDate = "We're closed Sundays — pick another day.";
    }
  }
  return Object.keys(errors).length === 0;
}

function onPrimary(): void {
  if (doneView) {
    clearSaved();
    state = blank();
    closeSheet('done');
    return;
  }

  const step = data.copy.steps[state.step];

  if (step.id === 'appliance' && !state.appliance) {
    errors.appliance = 'Pick what needs fixing.';
    render();
    return;
  }
  if (step.id === 'problem' && !state.problems.length && !state.problemText.trim()) {
    errors.problem = 'Tap a symptom, or type what it is doing.';
    render();
    return;
  }
  if (step.id === 'contact') {
    void submit();
    return;
  }
  go(state.step + 1);
}

async function submit(): Promise<void> {
  if (submitting) return;
  if (!validateContact()) {
    render();
    const firstBad = Object.keys(errors)[0];
    const map: Record<string, string> = {
      name: 'qs-name', phone: 'qs-phone', address: 'qs-address',
      zip: 'qs-zip', visitDate: 'qs-date',
    };
    document.getElementById(map[firstBad] || '')?.focus();
    return;
  }

  submitting = true;
  elPrimary.disabled = true;
  elPrimary.textContent = primaryLabel('contact');
  elFootNote.textContent = '';

  const branch = zipToBranch(state.zip);
  const app = currentAppliance();

  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'quote',
        brand_site: 'samedayappliance.repair',
        where: state.where,
        appliance: state.appliance,
        appliance_label: app ? app.label : '',
        // Rendered by the sheet from quote-copy.ts so the Telegram card prints the
        // same fee and the same wording the visitor just read.
        price_display: state.where ? data.price[state.where] : '',
        scope_label: state.where ? data.copy.scopeLabels[state.where] : '',
        branch_label: branchName(branch),
        branch_phone: branchPhone(branch),
        problems: state.problems,
        problem_text: state.problemText,
        photos: state.photos.filter((p) => p.state === 'done' && p.url).map((p) => p.url),
        name: state.name,
        phone: state.phone,
        address: state.address,
        zip: state.zip,
        city: branch,
        out_of_zone: !inZone(state.zip),
        visit_time: state.visitTime,
        visit_date: state.visitDate,
        notes: state.notes,
        source: state.source,
        page_url: location.href,
        _hp: '',
      }),
    });

    if (res.status === 429) {
      elFootNote.textContent = data.copy.errors.rateLimited;
      return;
    }
    let ok = res.ok;
    try {
      const body = (await res.json()) as { ok?: boolean };
      ok = ok && body.ok !== false;
    } catch {
      /* a non-JSON 200 still counts as delivered */
    }
    if (!ok) {
      elFootNote.textContent = data.copy.errors.failed;
      return;
    }

    track('quote_submit', {
      where: state.where,
      appliance: state.appliance,
      branch,
      out_of_zone: !inZone(state.zip),
      photos: state.photos.length,
      source: state.source,
    });
    doneView = true;
    clearSaved();
    renderDone();
  } catch {
    elFootNote.textContent = data.copy.errors.failed;
  } finally {
    submitting = false;
    if (!doneView) {
      elPrimary.disabled = false;
      elPrimary.textContent = primaryLabel('contact');
    }
  }
}
