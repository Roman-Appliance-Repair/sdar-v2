// src/components/AIDiagnosticSheet.client.ts
//
// AID-2. Everything the hero card needs once someone actually reaches for it:
// React, the diagnostic island, and the handoff into the quote sheet.
//
// This module is only ever reached through a dynamic import(), so the whole lot —
// React included — is one chunk the homepage does not request until the card is
// hovered (prefetch) or used (import). Nothing here runs at page load.

import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import AIDiagnostic from './AIDiagnostic.jsx';
import { mapDiagnosticToQuote } from '../data/aid-to-quote-map';

/** The quote sheet's own session key. Writing it is how the handoff speaks to it —
 *  the sheet already restores from here on open, so no new API between them. */
const QUOTE_STORE_KEY = 'sdar_qs_v1';

let dlg: HTMLDialogElement | null = null;
let root: Root | null = null;
let open = false;
let wired = false;

function track(event: string, extra?: Record<string, unknown>): void {
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...(extra || {}) });
}

function phone(): string {
  try {
    const node = document.getElementById('aid-data');
    return (JSON.parse(node?.textContent || '{}') as { phone?: string }).phone || '';
  } catch {
    return '';
  }
}

/**
 * Which step the quote sheet should resume on, given what the diagnosis already
 * answered. The sheet's own step order is where · appliance · problem · photos ·
 * price · contact; photos are optional, so a complete diagnosis lands on price.
 */
function seedStep(seed: { where: unknown; appliance: unknown; problems: string[] }): number {
  if (!seed.where) return 0;
  if (!seed.appliance) return 1;
  if (!seed.problems.length) return 2;
  return 4;
}

/**
 * The handoff. Fires in the capture phase on the sheet, so it has written the
 * session before the site-wide /book/ handler (bubble phase, on document) opens the
 * quote sheet. The link keeps its href, so with the quote sheet unavailable for any
 * reason the click is still a navigation to the booking page.
 */
function onVerdictClick(ev: Event): void {
  const a = (ev.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a || a.origin !== location.origin) return;
  if (a.pathname !== '/book/' && a.pathname !== '/book') return;

  const seed = mapDiagnosticToQuote({
    category: a.dataset.aidCategory,
    appliance: a.dataset.aidAppliance,
    symptom: a.dataset.aidSymptom,
    detail: a.dataset.aidDetail,
    brand: a.dataset.aidBrand,
  });

  try {
    sessionStorage.setItem(
      QUOTE_STORE_KEY,
      JSON.stringify({
        step: seedStep(seed),
        where: seed.where,
        appliance: seed.appliance,
        problems: seed.problems,
        problemText: seed.detail,
        // AID-3. The brand the visitor picked in the diagnostic, carried across so
        // the sheet's chip says what they answered rather than what the page was
        // about. The sheet only ever fills a BLANK brand from its own page context,
        // so writing it here means the answer wins and the page still covers for a
        // diagnosis that carried none.
        brand: seed.brandSlug || '',
        brandLabel: seed.brandLabel || '',
        source: 'ai-diagnostic',
        aidHandoff: true,
      })
    );
  } catch {
    /* private mode — the quote sheet then opens empty, which is the old behaviour */
  }

  track('aid_handoff_to_quote', {
    where: seed.where,
    appliance: seed.appliance,
    problem: seed.problems[0] || '',
    brand: seed.brandLabel || '',
    appliance_mapped: Boolean(seed.appliance),
    problem_mapped: seed.problems.length > 0,
  });

  // Get out of the way so the quote sheet is the only thing on screen. The history
  // entry this sheet pushed stays behind it; popstate below is a no-op once closed.
  closeAidSheet('handoff');
}

function onPopState(): void {
  if (open) closeAidSheet('back');
}

/**
 * AID-3. What the page already knows, read straight off the card it is printed on.
 *
 * The card computes this at build time from its own URL (see getDiagnosticPrefill),
 * so there is no second classifier in the browser and no way for the two to
 * disagree. Missing attributes mean an unmapped page — the island then opens at
 * step 1, exactly as it does on the homepage.
 */
function cardPrefill(): { category: string; appliance: string; brand: string } {
  const el = document.querySelector('[data-aid-card]') as HTMLElement | null;
  return {
    category: el?.dataset.aidPreCategory || '',
    appliance: el?.dataset.aidPreAppliance || '',
    brand: el?.dataset.aidPreBrand || '',
  };
}

function mount(initialDetail: string): void {
  const host = document.getElementById('aid-body');
  if (!host) return;
  if (!root) root = createRoot(host);
  const pre = cardPrefill();
  root.render(
    createElement(AIDiagnostic as never, {
      phone: phone(),
      initialDetail,
      initialCategory: pre.category,
      initialAppliance: pre.appliance,
      initialBrand: pre.brand,
      pageUrl: location.href,
    })
  );
}

export function openAidSheet(initialDetail: string, source: string): void {
  dlg = dlg || (document.getElementById('aid-sheet') as HTMLDialogElement | null);
  if (!dlg || open) return;

  if (!wired) {
    document.getElementById('aid-close')?.addEventListener('click', () => history.back());
    dlg.addEventListener('cancel', (ev) => {
      ev.preventDefault();
      history.back();
    });
    // Capture, so the seed is written before the site-wide /book/ handler reads it.
    dlg.addEventListener('click', onVerdictClick, true);
    window.addEventListener('popstate', onPopState);
    wired = true;
  }

  mount(initialDetail);

  // Blur BEFORE showModal, not after. A modal dialog remembers whichever element had
  // focus when it opened and hands focus back to it on close — and the card's input
  // is a trigger, so restoring focus to it reopened the sheet the instant it closed,
  // including on top of the quote sheet after a handoff. Blurring first means there
  // is nothing to restore to.
  (document.getElementById('aid-card-input') as HTMLInputElement | null)?.blur();

  open = true;
  document.documentElement.classList.add('aid-open');
  if (!dlg.open) dlg.showModal();
  history.pushState({ aidSheet: true }, '');

  const pre = cardPrefill();
  track('aid_card_open', {
    source,
    prefilled: initialDetail.length > 0,
    page_prefilled: Boolean(pre.category || pre.appliance || pre.brand),
    page_url: location.pathname,
  });
}

export function closeAidSheet(reason: string): void {
  if (!open || !dlg) return;
  open = false;
  document.documentElement.classList.remove('aid-open');
  // Stamped synchronously, because <dialog>.close() fires its `close` event in a
  // later task — by which time a focus-triggered reopen has already happened.
  dlg.dataset.closedAt = String(Date.now());
  if (dlg.open) dlg.close();
  track('aid_card_close', { reason });
  // The history entry is not unwound here. A Back-close has already popped it, and
  // on a handoff it stays behind the quote sheet's own entries, where the quote
  // sheet's popstate handler reaches it only after every step is behind the visitor.
}
