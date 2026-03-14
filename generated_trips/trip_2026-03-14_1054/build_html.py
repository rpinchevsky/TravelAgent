#!/usr/bin/env python3
"""Build trip_full_ru.html from source markdown files."""
import os

CSS_PATH = "C:/VscodeProjects/Budapest/rendering_style_config.css"
with open(CSS_PATH, "r", encoding="utf-8") as f:
    css_content = f.read()

css_content += """

/* --------------------------------------------------------------------------
   15. MAP LINK
   -------------------------------------------------------------------------- */
.map-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-brand-accent-alt);
  text-decoration: none;
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-interactive);
  margin-top: var(--space-2);
  margin-bottom: var(--space-2);
  transition: background-color var(--transition-fast), border-color var(--transition-fast);
}
.map-link:hover {
  background-color: var(--color-surface-raised);
  border-color: var(--color-brand-accent-alt);
  opacity: 1;
}
"""

# SVG constants
SVG_MAP = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
SVG_WEB = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
SVG_PHOTO = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>'
SVG_TIP = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
SVG_WARN = '<svg class="advisory__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="20" height="20"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
SVG_INFO = '<svg class="advisory__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
SVG_FLAG = '<svg width="28" height="20" viewBox="0 0 28 20" role="img" aria-label="Hungary flag" style="display:inline-block;vertical-align:middle;border-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,0.15)"><rect y="0" width="28" height="6.67" fill="#CE2939"/><rect y="6.67" width="28" height="6.67" fill="#FFFFFF"/><rect y="13.33" width="28" height="6.67" fill="#477050"/></svg>'

SVG_SB_OVERVIEW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>'
SVG_SB_CLOCK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
SVG_SB_PLANE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
SVG_SB_COMPASS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 10h-4V6"/><path d="M14 10l7.5-7.5"/><circle cx="12" cy="12" r="10"/></svg>'
SVG_SB_HOME = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
SVG_SB_MAP = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>'
SVG_SB_USER = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
SVG_SB_DOLLAR = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'


def poi_card(day, idx, tag_emoji, tag_text, hu_name, ru_name, desc, links, tip):
    name_display = f"{hu_name} / {ru_name}" if hu_name else ru_name
    lh = ""
    for lk in links:
        lb, hr = lk["label"], lk["href"]
        ic = SVG_MAP if ("maps" in hr.lower() or "Maps" in lb) else (SVG_PHOTO if "isch" in hr else SVG_WEB)
        lh += f'            <a class="poi-card__link" href="{hr}" target="_blank" rel="noopener">{ic}{lb}</a>\n'
    th = f'          <div class="pro-tip">{SVG_TIP}<span>{tip}</span></div>' if tip else ''
    return f"""      <div class="poi-card" id="poi-day-{day}-{idx}">
        <div class="poi-card__body">
          <span class="poi-card__tag">{tag_emoji} {tag_text}</span>
          <h3 class="poi-card__name">{name_display}</h3>
          <p class="poi-card__description">{desc}</p>
          <div class="poi-card__links">
{lh}          </div>
{th}
        </div>
      </div>
"""


def plan_b(title, body):
    return f"""    <div class="advisory advisory--info mt-4">
      {SVG_INFO}
      <div>
        <div class="advisory__title">{title}</div>
        <div class="advisory__body">{body}</div>
      </div>
    </div>
"""


def pricing(cells):
    h = '    <div class="pricing-grid">\n'
    for lb, am, cu in cells:
        h += f'      <div class="pricing-cell"><div class="pricing-cell__label">{lb}</div><div class="pricing-cell__amount">{am}</div><div class="pricing-cell__currency">{cu}</div></div>\n'
    h += '    </div>\n'
    return h


p = []

# HEAD
p.append(f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Budapest 2026 &#8212; &#1057;&#1077;&#1084;&#1077;&#1081;&#1085;&#1099;&#1081; &#1084;&#1072;&#1088;&#1096;&#1088;&#1091;&#1090;</title>
  <style>
{css_content}
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body>
<div class="page-wrapper">
""")

# SIDEBAR
p.append(f"""<aside class="sidebar" aria-label="Desktop Navigation">
    <div class="sidebar__logo"><span>&#127760; TravelUI</span></div>
    <nav class="sidebar__nav">
        <a class="sidebar__link is-active" href="#overview" aria-current="page">{SVG_SB_OVERVIEW}\u041e\u0431\u0437\u043e\u0440</a>
        <a class="sidebar__link" href="#day-0">{SVG_SB_PLANE}\u0414\u0435\u043d\u044c 0 \u2014 \u041f\u0440\u0438\u043b\u0451\u0442</a>
        <a class="sidebar__link" href="#day-1">{SVG_SB_CLOCK}\u0414\u0435\u043d\u044c 1 \u2014 \u041c\u0430\u0440\u0433\u0438\u0442-\u0441\u0438\u0433\u0435\u0442</a>
        <a class="sidebar__link" href="#day-2">{SVG_SB_CLOCK}\u0414\u0435\u043d\u044c 2 \u2014 \u0417\u043e\u043e\u043f\u0430\u0440\u043a</a>
        <a class="sidebar__link" href="#day-3">{SVG_SB_COMPASS}\u0414\u0435\u043d\u044c 3 \u2014 \u0411\u0443\u0434\u0430\u0439\u0441\u043a\u0438\u0435 \u0445\u043e\u043b\u043c\u044b</a>
        <a class="sidebar__link" href="#day-4">{SVG_SB_CLOCK}\u0414\u0435\u043d\u044c 4 \u2014 \u041a\u0440\u0435\u043f\u043e\u0441\u0442\u044c</a>
        <a class="sidebar__link" href="#day-5">{SVG_SB_CLOCK}\u0414\u0435\u043d\u044c 5 \u2014 \u0414\u0432\u043e\u0440\u0435\u0446 \u0447\u0443\u0434\u0435\u0441</a>
        <a class="sidebar__link" href="#day-6">{SVG_SB_HOME}\u0414\u0435\u043d\u044c 6 \u2014 \u0426\u0435\u043d\u0442\u0440 \u041f\u0435\u0448\u0442\u0430</a>
        <a class="sidebar__link" href="#day-7">{SVG_SB_CLOCK}\u0414\u0435\u043d\u044c 7 \u2014 \u041f\u043e\u0435\u0437\u0434\u0430 + \u0414\u0443\u043d\u0430\u0439</a>
        <a class="sidebar__link" href="#day-8">{SVG_SB_MAP}\u0414\u0435\u043d\u044c 8 \u2014 \u041c\u0435\u0434\u0432\u0435\u0434\u0438</a>
        <a class="sidebar__link" href="#day-9">{SVG_SB_CLOCK}\u0414\u0435\u043d\u044c 9 \u2014 \u0422\u0440\u043e\u043f\u0438\u043a\u0430\u0440\u0438\u0443\u043c</a>
        <a class="sidebar__link" href="#day-10">{SVG_SB_USER}\u0414\u0435\u043d\u044c 10 \u2014 \u0414\u0435\u043d\u044c \u0440\u043e\u0436\u0434\u0435\u043d\u0438\u044f!</a>
        <a class="sidebar__link" href="#day-11">{SVG_SB_PLANE}\u0414\u0435\u043d\u044c 11 \u2014 \u041e\u0442\u044a\u0435\u0437\u0434</a>
        <a class="sidebar__link" href="#budget">{SVG_SB_DOLLAR}\u0411\u044e\u0434\u0436\u0435\u0442</a>
    </nav>
</aside>

<nav class="mobile-nav" aria-label="Mobile Navigation">
  <div class="mobile-nav__scroll">
    <a class="mobile-nav__pill is-active" href="#overview">\u041e\u0431\u0437\u043e\u0440</a>
    <a class="mobile-nav__pill" href="#day-0">\u0414\u0435\u043d\u044c 0</a>
    <a class="mobile-nav__pill" href="#day-1">\u0414\u0435\u043d\u044c 1</a>
    <a class="mobile-nav__pill" href="#day-2">\u0414\u0435\u043d\u044c 2</a>
    <a class="mobile-nav__pill" href="#day-3">\u0414\u0435\u043d\u044c 3</a>
    <a class="mobile-nav__pill" href="#day-4">\u0414\u0435\u043d\u044c 4</a>
    <a class="mobile-nav__pill" href="#day-5">\u0414\u0435\u043d\u044c 5</a>
    <a class="mobile-nav__pill" href="#day-6">\u0414\u0435\u043d\u044c 6</a>
    <a class="mobile-nav__pill" href="#day-7">\u0414\u0435\u043d\u044c 7</a>
    <a class="mobile-nav__pill" href="#day-8">\u0414\u0435\u043d\u044c 8</a>
    <a class="mobile-nav__pill" href="#day-9">\u0414\u0435\u043d\u044c 9</a>
    <a class="mobile-nav__pill" href="#day-10">\u0414\u0435\u043d\u044c 10</a>
    <a class="mobile-nav__pill" href="#day-11">\u0414\u0435\u043d\u044c 11</a>
    <a class="mobile-nav__pill" href="#budget">\u0411\u044e\u0434\u0436\u0435\u0442</a>
  </div>
</nav>

<main id="main-content" class="main-content">

<h1 class="page-title">Budapest 2026 \u2014 \u0421\u0435\u043c\u0435\u0439\u043d\u044b\u0439 \u043c\u0430\u0440\u0448\u0440\u0443\u0442 {SVG_FLAG}</h1>
<p class="page-subtitle">20\u201331 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026 \u00b7 \u0420\u043e\u0431\u0435\u0440\u0442 (45), \u0410\u043d\u043d\u0430 (44), \u0422\u0430\u043c\u0438\u0440 (8), \u0410\u0440\u0438\u044d\u043b\u044c (6), \u0418\u0442\u0430\u0439 (3&#8594;4!)</p>

<div class="advisory advisory--warning mt-4">
  {SVG_WARN}
  <div>
    <div class="advisory__title">\u041f\u0440\u0430\u0437\u0434\u043d\u0438\u0447\u043d\u043e\u0435 \u043f\u0440\u0435\u0434\u0443\u043f\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u0435 \u2014 \u0414\u0435\u043d\u044c \u0421\u0432\u044f\u0442\u043e\u0433\u043e \u0418\u0448\u0442\u0432\u0430\u043d\u0430 (20 \u0430\u0432\u0433\u0443\u0441\u0442\u0430)</div>
    <div class="advisory__body">
      \u0414\u0435\u043d\u044c \u043f\u0440\u0438\u043b\u0451\u0442\u0430 \u0441\u043e\u0432\u043f\u0430\u0434\u0430\u0435\u0442 \u0441 \u0433\u043b\u0430\u0432\u043d\u044b\u043c \u043d\u0430\u0446\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u044b\u043c \u043f\u0440\u0430\u0437\u0434\u043d\u0438\u043a\u043e\u043c \u0412\u0435\u043d\u0433\u0440\u0438\u0438 \u2014 <strong>\u0414\u0435\u043d\u044c \u043e\u0441\u043d\u043e\u0432\u0430\u043d\u0438\u044f \u0433\u043e\u0441\u0443\u0434\u0430\u0440\u0441\u0442\u0432\u0430 (Szent Istv&aacute;n &uuml;nnepe)</strong>. \u0413\u0440\u0430\u043d\u0434\u0438\u043e\u0437\u043d\u044b\u0439 \u0444\u0435\u0439\u0435\u0440\u0432\u0435\u0440\u043a \u043d\u0430\u0434 \u0414\u0443\u043d\u0430\u0435\u043c \u0432 21:00.<br>
      <strong>\u0417\u0430\u043a\u0440\u044b\u0442\u0438\u044f:</strong> \u041c\u0430\u0433\u0430\u0437\u0438\u043d\u044b \u0438 \u0442\u043e\u0440\u0433\u043e\u0432\u044b\u0435 \u0446\u0435\u043d\u0442\u0440\u044b \u0437\u0430\u043a\u0440\u044b\u0442\u044b. \u0411\u043e\u043b\u044c\u0448\u0438\u043d\u0441\u0442\u0432\u043e \u043c\u0443\u0437\u0435\u0435\u0432 \u0438 \u0442\u0435\u0440\u043c\u0430\u043b\u044c\u043d\u044b\u0445 \u043a\u0443\u043f\u0430\u043b\u0435\u043d \u0440\u0430\u0431\u043e\u0442\u0430\u044e\u0442. \u0420\u0435\u0441\u0442\u043e\u0440\u0430\u043d\u044b \u0432 \u0446\u0435\u043d\u0442\u0440\u0435 \u043e\u0442\u043a\u0440\u044b\u0442\u044b.<br>
      <strong>\u0422\u0440\u0430\u043d\u0441\u043f\u043e\u0440\u0442:</strong> \u041c\u043e\u0441\u0442\u044b \u0421\u0432\u043e\u0431\u043e\u0434\u044b, \u042d\u0440\u0436\u0435\u0431\u0435\u0442 \u0438 \u041c\u0430\u0440\u0433\u0438\u0442 \u0437\u0430\u043a\u0440\u044b\u0432\u0430\u044e\u0442\u0441\u044f \u0441 18:00. \u0422\u0440\u0430\u043c\u0432\u0430\u0438 4/6 \u043d\u0435 \u043e\u0441\u0442\u0430\u043d\u0430\u0432\u043b\u0438\u0432\u0430\u044e\u0442\u0441\u044f \u043d\u0430 \u043c\u043e\u0441\u0442\u0443 \u041c\u0430\u0440\u0433\u0438\u0442.<br>
      <strong>\u0410\u0442\u043c\u043e\u0441\u0444\u0435\u0440\u0430:</strong> \u0424\u0435\u0441\u0442\u0438\u0432\u0430\u043b\u044c \u043d\u0430\u0440\u043e\u0434\u043d\u043e\u0433\u043e \u0442\u0432\u043e\u0440\u0447\u0435\u0441\u0442\u0432\u0430 \u0432 \u0411\u0443\u0434\u0430\u0439\u0441\u043a\u043e\u0439 \u043a\u0440\u0435\u043f\u043e\u0441\u0442\u0438, &laquo;\u0423\u043b\u0438\u0446\u0430 \u0432\u0435\u043d\u0433\u0435\u0440\u0441\u043a\u0438\u0445 \u0432\u043a\u0443\u0441\u043e\u0432&raquo; \u0432 V&aacute;rkert Baz&aacute;r. \u0421\u0435\u043c\u0435\u0439\u043d\u044b\u0439 \u0444\u0435\u0441\u0442\u0438\u0432\u0430\u043b\u044c Var&aacute;zsliget \u0432 \u043f\u0430\u0440\u043a\u0435 \u0412\u0430\u0440\u043e\u0448\u043b\u0438\u0433\u0435\u0442.
    </div>
  </div>
</div>
""")

# OVERVIEW
p.append("""<section id="overview" class="mb-5">
  <h2 class="section-title">\u041e\u0431\u0437\u043e\u0440\u043d\u0430\u044f \u0442\u0430\u0431\u043b\u0438\u0446\u0430</h2>
  <div class="itinerary-table-wrapper">
    <table class="itinerary-table">
      <thead>
        <tr><th>\u0414\u0435\u043d\u044c</th><th>\u0414\u0430\u0442\u0430</th><th>\u0414\u0435\u043d\u044c \u043d\u0435\u0434\u0435\u043b\u0438</th><th>\u0420\u0430\u0439\u043e\u043d</th><th>\u041e\u0441\u043d\u043e\u0432\u043d\u044b\u0435 \u0430\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u0438</th><th>\u0422\u0440\u0430\u043d\u0441\u043f\u043e\u0440\u0442</th></tr>
      </thead>
      <tbody>
        <tr><td>0</td><td>20.08</td><td>\u0427\u0435\u0442\u0432\u0435\u0440\u0433</td><td>\u0410\u044d\u0440\u043e\u043f\u043e\u0440\u0442 &#8594; \u041e\u0442\u0435\u043b\u044c</td><td>\u041f\u0440\u0438\u043b\u0451\u0442 22:00</td><td>\u0422\u0440\u0430\u043d\u0441\u0444\u0435\u0440</td></tr>
        <tr><td>1</td><td>21.08</td><td>\u041f\u044f\u0442\u043d\u0438\u0446\u0430</td><td>\u041c\u0430\u0440\u0433\u0438\u0442-\u0441\u0438\u0433\u0435\u0442</td><td>Palatinus Strand, \u042f\u043f\u043e\u043d\u0441\u043a\u0438\u0439 \u0441\u0430\u0434, \u041c\u0443\u0437\u044b\u043a\u0430\u043b\u044c\u043d\u044b\u0439 \u0444\u043e\u043d\u0442\u0430\u043d, \u041c\u0438\u043d\u0438-\u0437\u043e\u043e\u043f\u0430\u0440\u043a, \u0412\u0435\u043b\u043e\u0440\u0438\u043a\u0448\u0430</td><td>\u0422\u0440\u0430\u043c\u0432\u0430\u0439 4/6</td></tr>
        <tr><td>2</td><td>22.08</td><td>\u0421\u0443\u0431\u0431\u043e\u0442\u0430</td><td>\u0412\u0430\u0440\u043e\u0448\u043b\u0438\u0433\u0435\u0442</td><td>\u0417\u043e\u043e\u043f\u0430\u0440\u043a, \u0417\u0430\u043c\u043e\u043a \u0412\u0430\u0439\u0434\u0430\u0445\u0443\u043d\u044f\u0434, Holnemvolt Park</td><td>\u041c\u0435\u0442\u0440\u043e M1</td></tr>
        <tr><td>3</td><td>23.08</td><td>\u0412\u043e\u0441\u043a\u0440\u0435\u0441\u0435\u043d\u044c\u0435</td><td>\u0411\u0443\u0434\u0430\u0439\u0441\u043a\u0438\u0435 \u0445\u043e\u043b\u043c\u044b</td><td>\u0417\u0443\u0431\u0447\u0430\u0442\u0430\u044f \u0436/\u0434, \u0414\u0435\u0442\u0441\u043a\u0430\u044f \u0436/\u0434, \u0421\u043c\u043e\u0442\u0440\u043e\u0432\u0430\u044f \u0415\u043b\u0438\u0437\u0430\u0432\u0435\u0442\u044b</td><td>\u0422\u0440\u0430\u043c\u0432\u0430\u0439 + \u0436/\u0434</td></tr>
        <tr><td>4</td><td>24.08</td><td>\u041f\u043e\u043d\u0435\u0434\u0435\u043b\u044c\u043d\u0438\u043a</td><td>\u0411\u0443\u0434\u0430</td><td>\u0411\u0443\u0434\u0430\u0439\u0441\u043a\u0430\u044f \u043a\u0440\u0435\u043f\u043e\u0441\u0442\u044c, \u0420\u044b\u0431\u0430\u0446\u043a\u0438\u0439 \u0431\u0430\u0441\u0442\u0438\u043e\u043d, \u041f\u0435\u0449\u0435\u0440\u0430 \u0421\u0435\u043c\u043b\u0451-\u0445\u0435\u0434\u0438</td><td>\u0424\u0443\u043d\u0438\u043a\u0443\u043b\u0451\u0440 + \u0430\u0432\u0442\u043e\u0431\u0443\u0441</td></tr>
        <tr><td>5</td><td>25.08</td><td>\u0412\u0442\u043e\u0440\u043d\u0438\u043a</td><td>\u041e\u0431\u0443\u0434\u0430</td><td>\u0414\u0432\u043e\u0440\u0435\u0446 \u0447\u0443\u0434\u0435\u0441 (\u0432\u0435\u0441\u044c \u0434\u0435\u043d\u044c), VakVarj&uacute;</td><td>\u0410\u0432\u0442\u043e\u0431\u0443\u0441 / H&Eacute;V</td></tr>
        <tr><td>6</td><td>26.08</td><td>\u0421\u0440\u0435\u0434\u0430</td><td>\u0426\u0435\u043d\u0442\u0440 \u041f\u0435\u0448\u0442\u0430</td><td>\u041c\u0438\u043d\u0438\u0432\u0435\u0440\u0441\u0443\u043c, \u0426\u0435\u043d\u0442\u0440\u0430\u043b\u044c\u043d\u044b\u0439 \u0440\u044b\u043d\u043e\u043a, V&aacute;ci utca</td><td>\u041f\u0435\u0448\u043a\u043e\u043c / \u043c\u0435\u0442\u0440\u043e</td></tr>
        <tr><td>7</td><td>27.08</td><td>\u0427\u0435\u0442\u0432\u0435\u0440\u0433</td><td>\u041f\u0435\u0448\u0442 / \u0414\u0443\u043d\u0430\u0439</td><td>\u0416/\u0434 \u043c\u0443\u0437\u0435\u0439, \u0414\u0443\u043d\u0430\u0439\u0441\u043a\u0438\u0439 \u043a\u0440\u0443\u0438\u0437</td><td>\u0410\u0432\u0442\u043e\u0431\u0443\u0441 + \u0440\u0435\u0447\u043d\u043e\u0439 \u0442\u0440\u0430\u043c\u0432\u0430\u0439</td></tr>
        <tr><td>8</td><td>28.08</td><td>\u041f\u044f\u0442\u043d\u0438\u0446\u0430</td><td>\u0417\u0430 \u0433\u043e\u0440\u043e\u0434\u043e\u043c</td><td>\u041c\u0435\u0434\u0432\u0435\u0436\u044c\u044f \u0444\u0435\u0440\u043c\u0430, \u0411\u0443\u0434\u0430\u043a\u0435\u0441\u0438</td><td>\u0410\u0440\u0435\u043d\u0434\u0430 \u0430\u0432\u0442\u043e</td></tr>
        <tr><td>9</td><td>29.08</td><td>\u0421\u0443\u0431\u0431\u043e\u0442\u0430</td><td>\u042e\u0433 \u0411\u0443\u0434\u0430\u043f\u0435\u0448\u0442\u0430</td><td>\u0422\u0440\u043e\u043f\u0438\u043a\u0430\u0440\u0438\u0443\u043c, Premier Outlet</td><td>\u0410\u0440\u0435\u043d\u0434\u0430 \u0430\u0432\u0442\u043e</td></tr>
        <tr><td>10</td><td>30.08</td><td>\u0412\u043e\u0441\u043a\u0440\u0435\u0441\u0435\u043d\u044c\u0435</td><td>\u0421\u0435\u0432\u0435\u0440 \u0411\u0443\u0434\u0430\u043f\u0435\u0448\u0442\u0430</td><td>\u0414\u0435\u043d\u044c \u0440\u043e\u0436\u0434\u0435\u043d\u0438\u044f \u0418\u0442\u0430\u044f! Aquaworld</td><td>\u0422\u0430\u043a\u0441\u0438 / \u0430\u0432\u0442\u043e\u0431\u0443\u0441</td></tr>
        <tr><td>11</td><td>31.08</td><td>\u041f\u043e\u043d\u0435\u0434\u0435\u043b\u044c\u043d\u0438\u043a</td><td>\u041e\u0442\u0435\u043b\u044c &#8594; \u0410\u044d\u0440\u043e\u043f\u043e\u0440\u0442</td><td>\u0421\u0431\u043e\u0440\u044b, \u0432\u044b\u043b\u0435\u0442 11:55</td><td>\u0422\u0440\u0430\u043d\u0441\u0444\u0435\u0440</td></tr>
      </tbody>
    </table>
  </div>
</section>
""")

# Helper to build day cards - load from a data structure
days_data = [
    # Day 0
    {
        "id": 0, "date": "\u0427\u0435\u0442\u0432\u0435\u0440\u0433, 20 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026",
        "emoji": "&#9992;&#65039;", "title": "\u0414\u0435\u043d\u044c 0 \u2014 \u041f\u0440\u0438\u043b\u0451\u0442",
        "schedule": [
            ("22:00", None, "&#9992;&#65039; \u041f\u0440\u0438\u043b\u0451\u0442 \u0432 \u0411\u0443\u0434\u0430\u043f\u0435\u0448\u0442", "\u0410\u044d\u0440\u043e\u043f\u043e\u0440\u0442 BUD, \u0422\u0435\u0440\u043c\u0438\u043d\u0430\u043b 2"),
            ("22:30", None, "&#129523; \u041f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u0435 \u0431\u0430\u0433\u0430\u0436\u0430", ""),
            ("23:00", "#poi-day-0-1", "&#128663; \u0422\u0440\u0430\u043d\u0441\u0444\u0435\u0440 \u0432 \u043e\u0442\u0435\u043b\u044c", "Bolt/\u0442\u0430\u043a\u0441\u0438, ~35 \u043c\u0438\u043d\u0443\u0442"),
            ("23:35", None, "&#127976; \u0417\u0430\u0441\u0435\u043b\u0435\u043d\u0438\u0435", "\u041e\u0442\u0434\u044b\u0445 \u043f\u043e\u0441\u043b\u0435 \u043f\u0435\u0440\u0435\u043b\u0451\u0442\u0430"),
        ],
        "map_url": "https://www.google.com/maps/dir/Budapest+Ferenc+Liszt+International+Airport/Budapest+city+center/",
        "pois": [
            (1, "&#9992;&#65039;", "\u041f\u0420\u0418\u041b\u0401\u0422", "Budapest Ferenc Liszt (BUD)", "\u0410\u044d\u0440\u043e\u043f\u043e\u0440\u0442 \u0424\u0435\u0440\u0435\u043d\u0446 \u041b\u0438\u0441\u0442",
             "\u041c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u044b\u0439 \u0430\u044d\u0440\u043e\u043f\u043e\u0440\u0442 \u0411\u0443\u0434\u0430\u043f\u0435\u0448\u0442\u0430 \u0432 16 \u043a\u043c \u043e\u0442 \u0446\u0435\u043d\u0442\u0440\u0430. \u0421\u0435\u0433\u043e\u0434\u043d\u044f \u2014 \u0414\u0435\u043d\u044c \u0421\u0432\u044f\u0442\u043e\u0433\u043e \u0418\u0448\u0442\u0432\u0430\u043d\u0430. \u041c\u0430\u0433\u0430\u0437\u0438\u043d\u044b \u0437\u0430\u043a\u0440\u044b\u0442\u044b \u2014 \u043a\u0443\u043f\u0438\u0442\u0435 \u0432\u043e\u0434\u0443 \u0438 \u0441\u043d\u044d\u043a\u0438 \u0432 \u0430\u044d\u0440\u043e\u043f\u043e\u0440\u0442\u0443 (Relay, Inmedio).",
             [{"label": "Google Maps", "href": "https://maps.google.com/?q=Budapest+Ferenc+Liszt+International+Airport"},
              {"label": "\u0421\u0430\u0439\u0442 \u0430\u044d\u0440\u043e\u043f\u043e\u0440\u0442\u0430", "href": "https://www.bud.hu/en"},
              {"label": "\u0424\u043e\u0442\u043e", "href": "https://www.google.com/search?q=Budapest+Ferenc+Liszt+Airport+Terminal+2&tbm=isch"}],
             "\u0417\u0430\u043a\u0430\u0436\u0438\u0442\u0435 Bolt \u0437\u0430\u0440\u0430\u043d\u0435\u0435. F\u0151taxi \u2014 \u0444\u0438\u043a\u0441\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u0430\u044f \u0446\u0435\u043d\u0430 ~7 900 HUF."),
        ],
        "planb_title": "\u0417\u0430\u043f\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u0430\u043d \u2014 \u0417\u0430\u0434\u0435\u0440\u0436\u043a\u0430 \u0440\u0435\u0439\u0441\u0430",
        "planb_body": "SkyCourt Lounge (~30 EUR/\u0447\u0435\u043b). F\u0151taxi \u0438 Bolt \u0440\u0430\u0431\u043e\u0442\u0430\u044e\u0442 24/7.",
        "pricing": [("\u0422\u0440\u0430\u043d\u0441\u0444\u0435\u0440", "10 000", "HUF"), ("\u0421\u043d\u044d\u043a\u0438", "2 000", "HUF"), ("\u0418\u0442\u043e\u0433\u043e", "12 000", "HUF (~30 EUR)")]
    },
]

# Instead of the huge data structure, let me just inline the HTML for each day directly
# I already have the exact structure from the reference file

# Build each day's HTML inline
def sched_row(time, href, label, detail):
    if href:
        act = f'<a class="activity-label" href="{href}">{label}</a>'
    else:
        act = f'<span class="activity-label">{label}</span>'
    return f'          <tr><td class="col-time">{time}</td><td>{act}</td><td>{detail}</td></tr>'

def day_start(day_id, date_str, emoji_title):
    return f"""<!-- ================================================================ -->
<!-- DAY {day_id} -->
<!-- ================================================================ -->
<div class="day-card" id="day-{day_id}">
  <div class="day-card__banner">
    <div class="day-card__banner-date">{date_str}</div>
    <div class="day-card__banner-title">{emoji_title}</div>
  </div>
  <div class="day-card__content">

    <div class="itinerary-table-wrapper mb-4">
      <table class="itinerary-table">
        <thead><tr><th>\u0412\u0440\u0435\u043c\u044f</th><th>\u0410\u043a\u0442\u0438\u0432\u043d\u043e\u0441\u0442\u044c</th><th>\u0414\u0435\u0442\u0430\u043b\u0438</th></tr></thead>
        <tbody>
"""

def day_mid(map_url):
    return f"""        </tbody>
      </table>
    </div>

    <a class="map-link" href="{map_url}" target="_blank" rel="noopener">&#128506;&#65039; \u041e\u0442\u043a\u0440\u044b\u0442\u044c \u043c\u0430\u0440\u0448\u0440\u0443\u0442 \u0434\u043d\u044f \u043d\u0430 Google Maps</a>

    <div class="itinerary-grid">
"""

def day_end():
    return """
  </div>
</div>

"""

# DAY 0
p.append(day_start(0, "\u0427\u0435\u0442\u0432\u0435\u0440\u0433, 20 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026", "&#9992;&#65039; \u0414\u0435\u043d\u044c 0 \u2014 \u041f\u0440\u0438\u043b\u0451\u0442"))
p.append(sched_row("22:00", None, "&#9992;&#65039; \u041f\u0440\u0438\u043b\u0451\u0442 \u0432 \u0411\u0443\u0434\u0430\u043f\u0435\u0448\u0442", "\u0410\u044d\u0440\u043e\u043f\u043e\u0440\u0442 BUD, \u0422\u0435\u0440\u043c\u0438\u043d\u0430\u043b 2") + "\n")
p.append(sched_row("22:30", None, "&#129523; \u041f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u0435 \u0431\u0430\u0433\u0430\u0436\u0430", "") + "\n")
p.append(sched_row("23:00", "#poi-day-0-1", "&#128663; \u0422\u0440\u0430\u043d\u0441\u0444\u0435\u0440 \u0432 \u043e\u0442\u0435\u043b\u044c", "Bolt/\u0442\u0430\u043a\u0441\u0438, ~35 \u043c\u0438\u043d\u0443\u0442") + "\n")
p.append(sched_row("23:35", None, "&#127976; \u0417\u0430\u0441\u0435\u043b\u0435\u043d\u0438\u0435", "\u041e\u0442\u0434\u044b\u0445 \u043f\u043e\u0441\u043b\u0435 \u043f\u0435\u0440\u0435\u043b\u0451\u0442\u0430") + "\n")
p.append(day_mid("https://www.google.com/maps/dir/Budapest+Ferenc+Liszt+International+Airport/Budapest+city+center/"))
p.append(poi_card(0, 1, "&#9992;&#65039;", "\u041f\u0420\u0418\u041b\u0401\u0422", "Budapest Ferenc Liszt (BUD)", "\u0410\u044d\u0440\u043e\u043f\u043e\u0440\u0442 \u0424\u0435\u0440\u0435\u043d\u0446 \u041b\u0438\u0441\u0442",
    "\u041c\u0435\u0436\u0434\u0443\u043d\u0430\u0440\u043e\u0434\u043d\u044b\u0439 \u0430\u044d\u0440\u043e\u043f\u043e\u0440\u0442 \u0411\u0443\u0434\u0430\u043f\u0435\u0448\u0442\u0430 \u0432 16 \u043a\u043c \u043e\u0442 \u0446\u0435\u043d\u0442\u0440\u0430. \u0421\u0435\u0433\u043e\u0434\u043d\u044f \u2014 \u0414\u0435\u043d\u044c \u0421\u0432\u044f\u0442\u043e\u0433\u043e \u0418\u0448\u0442\u0432\u0430\u043d\u0430. \u041c\u0430\u0433\u0430\u0437\u0438\u043d\u044b \u0437\u0430\u043a\u0440\u044b\u0442\u044b \u2014 \u043a\u0443\u043f\u0438\u0442\u0435 \u0432\u043e\u0434\u0443 \u0438 \u0441\u043d\u044d\u043a\u0438 \u0432 \u0430\u044d\u0440\u043e\u043f\u043e\u0440\u0442\u0443 (Relay, Inmedio).",
    [{"label": "Google Maps", "href": "https://maps.google.com/?q=Budapest+Ferenc+Liszt+International+Airport"},
     {"label": "\u0421\u0430\u0439\u0442 \u0430\u044d\u0440\u043e\u043f\u043e\u0440\u0442\u0430", "href": "https://www.bud.hu/en"},
     {"label": "\u0424\u043e\u0442\u043e", "href": "https://www.google.com/search?q=Budapest+Ferenc+Liszt+Airport+Terminal+2&tbm=isch"}],
    "\u0417\u0430\u043a\u0430\u0436\u0438\u0442\u0435 Bolt \u0437\u0430\u0440\u0430\u043d\u0435\u0435. F\u0151taxi \u2014 \u0444\u0438\u043a\u0441. \u0446\u0435\u043d\u0430 ~7 900 HUF."
))
p.append("    </div>\n\n")
p.append(plan_b("\u0417\u0430\u043f\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u0430\u043d \u2014 \u0417\u0430\u0434\u0435\u0440\u0436\u043a\u0430 \u0440\u0435\u0439\u0441\u0430",
    "SkyCourt Lounge (~30 EUR/\u0447\u0435\u043b), Relay \u0438 Inmedio \u0440\u0430\u0431\u043e\u0442\u0430\u044e\u0442 \u0434\u043e\u043f\u043e\u0437\u0434\u043d\u0430. F\u0151taxi \u0438 Bolt 24/7."))
p.append(pricing([("\u0422\u0440\u0430\u043d\u0441\u0444\u0435\u0440", "10 000", "HUF"), ("\u0421\u043d\u044d\u043a\u0438", "2 000", "HUF"), ("\u0418\u0442\u043e\u0433\u043e", "12 000", "HUF (~30 EUR)")]))
p.append(day_end())

# DAY 1
p.append(day_start(1, "\u041f\u044f\u0442\u043d\u0438\u0446\u0430, 21 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026", "&#127946; \u0414\u0435\u043d\u044c 1 \u2014 \u041c\u0430\u0440\u0433\u0438\u0442-\u0441\u0438\u0433\u0435\u0442 &#127754;"))
p.append(sched_row("10:00", None, "&#128651; \u0412\u044b\u0435\u0437\u0434 \u0438\u0437 \u043e\u0442\u0435\u043b\u044f", "\u0422\u0440\u0430\u043c\u0432\u0430\u0439 4/6 \u0434\u043e \u043c\u043e\u0441\u0442\u0430 \u041c\u0430\u0440\u0433\u0438\u0442") + "\n")
p.append(sched_row("10:30", "#poi-day-1-1", "&#128166; Palatinus Strand / \u041f\u0430\u043b\u0430\u0442\u0438\u043d\u0443\u0441", "\u0410\u043a\u0432\u0430\u043f\u0430\u0440\u043a: \u0431\u0430\u0441\u0441\u0435\u0439\u043d\u044b, \u0433\u043e\u0440\u043a\u0438") + "\n")
p.append(sched_row("13:00", None, "&#127869;&#65039; \u041f\u0438\u043a\u043d\u0438\u043a \u043d\u0430 \u043e\u0441\u0442\u0440\u043e\u0432\u0435", "\u0417\u0430\u043f\u0430\u0441\u044b \u0438\u0437 SPAR + \u043b\u0430\u043d\u0433\u043e\u0448") + "\n")
p.append(sched_row("14:00", "#poi-day-1-2", "&#127807; Jap&aacute;nkert / \u042f\u043f\u043e\u043d\u0441\u043a\u0438\u0439 \u0441\u0430\u0434", "\u041f\u0440\u0443\u0434\u044b \u0441 \u043a\u0430\u0440\u043f\u0430\u043c\u0438 \u043a\u043e\u0438") + "\n")
p.append(sched_row("14:40", "#poi-day-1-3", "&#127925; Zen&eacute;l&#337; sz&ouml;k&#337;k&uacute;t / \u041c\u0443\u0437\u044b\u043a\u0430\u043b\u044c\u043d\u044b\u0439 \u0444\u043e\u043d\u0442\u0430\u043d", "\u0428\u043e\u0443 \u043a\u0430\u0436\u0434\u044b\u0439 \u0447\u0430\u0441") + "\n")
p.append(sched_row("15:00", None, "&#128733; \u0414\u0435\u0442\u0441\u043a\u0430\u044f \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430", "\u0411\u043e\u043b\u044c\u0448\u0430\u044f \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430 \u0443 \u043c\u043e\u0441\u0442\u0430 \u041c\u0430\u0440\u0433\u0438\u0442") + "\n")
p.append(sched_row("16:00", "#poi-day-1-4", "&#128062; Kis &Aacute;llatkert / \u041c\u0438\u043d\u0438-\u0437\u043e\u043e\u043f\u0430\u0440\u043a", "\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439: \u043e\u043b\u0435\u043d\u0438, \u043f\u0430\u0432\u043b\u0438\u043d\u044b, \u043a\u043e\u0437\u044b") + "\n")
p.append(sched_row("16:30", "#poi-day-1-5", "&#128690; Bring&oacute;hint&oacute; / \u0412\u0435\u043b\u043e\u0440\u0438\u043a\u0448\u0430", "\u0421\u0435\u043c\u0435\u0439\u043d\u044b\u0439 \u043f\u0435\u0434\u0430\u043b\u044c\u043d\u044b\u0439 \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u044c") + "\n")
p.append(sched_row("18:00", None, "&#128651; \u0412\u043e\u0437\u0432\u0440\u0430\u0449\u0435\u043d\u0438\u0435 \u0432 \u043e\u0442\u0435\u043b\u044c", "\u0422\u0440\u0430\u043c\u0432\u0430\u0439 4/6") + "\n")
p.append(day_mid("https://www.google.com/maps/dir/Palatinus+Strand+Budapest/Jap%C3%A1nkert+Margitsziget+Budapest/Zen%C3%A9l%C5%91+sz%C3%B6k%C5%91k%C3%BAt+Margitsziget+Budapest/Margitsziget+J%C3%A1tsz%C3%B3t%C3%A9r+Budapest/"))
p.append(poi_card(1,1,"&#128166;","\u0410\u041a\u0412\u0410\u041f\u0410\u0420\u041a","Palatinus Strand","\u041f\u0430\u043b\u0430\u0442\u0438\u043d\u0443\u0441",
    "\u041a\u0440\u0443\u043f\u043d\u0435\u0439\u0448\u0438\u0439 \u043e\u0442\u043a\u0440\u044b\u0442\u044b\u0439 \u0430\u043a\u0432\u0430\u043f\u0430\u0440\u043a \u0411\u0443\u0434\u0430\u043f\u0435\u0448\u0442\u0430 \u043d\u0430 \u043e\u0441\u0442\u0440\u043e\u0432\u0435 \u041c\u0430\u0440\u0433\u0438\u0442. 11 \u0431\u0430\u0441\u0441\u0435\u0439\u043d\u043e\u0432, \u0432\u043e\u043b\u043d\u043e\u0432\u043e\u0439 \u0431\u0430\u0441\u0441\u0435\u0439\u043d, \u0442\u0440\u0438 \u0433\u043e\u0440\u043a\u0438. \u0414\u043b\u044f \u0418\u0442\u0430\u044f \u2014 \u043c\u0435\u043b\u043a\u0438\u0439 &laquo;\u043b\u044f\u0433\u0443\u0448\u0430\u0442\u043d\u0438\u043a&raquo;. \u0412\u0437\u0440\u043e\u0441\u043b\u044b\u0435 ~6 200 HUF, \u0434\u0435\u0442\u0438 ~4 500 HUF.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Palatinus+Strand+Budapest"},
     {"label":"\u0421\u0430\u0439\u0442","href":"https://www.palatinusstrand.hu/en"},
     {"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Palatinus+Strand+Budapest&tbm=isch"}],
    "\u041f\u0440\u0438\u0445\u043e\u0434\u0438\u0442\u0435 \u043a \u043e\u0442\u043a\u0440\u044b\u0442\u0438\u044e (10:00). \u0428\u043a\u0430\u0444\u0447\u0438\u043a \u2014 500 HUF. \u041a\u0440\u0435\u043c \u043e\u0442 \u0441\u043e\u043b\u043d\u0446\u0430 \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d!"))
p.append(poi_card(1,2,"&#127807;","\u041f\u0420\u0418\u0420\u041e\u0414\u0410","Jap&aacute;nkert","\u042f\u043f\u043e\u043d\u0441\u043a\u0438\u0439 \u0441\u0430\u0434",
    "\u041a\u0440\u043e\u0448\u0435\u0447\u043d\u044b\u0439 \u044f\u043f\u043e\u043d\u0441\u043a\u0438\u0439 \u0441\u0430\u0434 \u0441 \u043c\u043e\u0441\u0442\u0438\u043a\u0430\u043c\u0438 \u0438 \u043f\u0440\u0443\u0434\u0430\u043c\u0438 \u0441 \u043a\u0430\u0440\u043f\u0430\u043c\u0438 \u043a\u043e\u0438. \u0412\u0445\u043e\u0434 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439, 15\u201320 \u043c\u0438\u043d\u0443\u0442.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Japanese+Garden+Margaret+Island+Budapest"},
     {"label":"\u0421\u0430\u0439\u0442","href":"https://www.tripadvisor.com/Attraction_Review-g274887-d20950927-Reviews-Japanese_Garden-Budapest_Central_Hungary.html"},
     {"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Jap%C3%A1nkert+Margitsziget+Budapest&tbm=isch"}],
    "\u041a\u043e\u0440\u043c \u0434\u043b\u044f \u043a\u0430\u0440\u043f\u043e\u0432 \u2014 200 HUF \u043d\u0430 \u0432\u0445\u043e\u0434\u0435. \u041b\u0443\u0447\u0448\u0435\u0435 \u0432\u0440\u0435\u043c\u044f \u2014 \u043f\u043e\u0441\u043b\u0435 \u043e\u0431\u0435\u0434\u0430."))
p.append(poi_card(1,3,"&#127925;","\u0420\u0410\u0417\u0412\u041b\u0415\u0427\u0415\u041d\u0418\u0415","Zen&eacute;l&#337; sz&ouml;k&#337;k&uacute;t","\u041c\u0443\u0437\u044b\u043a\u0430\u043b\u044c\u043d\u044b\u0439 \u0444\u043e\u043d\u0442\u0430\u043d",
    "\u0421\u0430\u043c\u044b\u0439 \u043a\u0440\u0430\u0441\u0438\u0432\u044b\u0439 \u0444\u043e\u043d\u0442\u0430\u043d \u0411\u0443\u0434\u0430\u043f\u0435\u0448\u0442\u0430: \u0441\u0442\u0440\u0443\u0438 \u0432\u043e\u0434\u044b \u0442\u0430\u043d\u0446\u0443\u044e\u0442 \u043f\u043e\u0434 \u043c\u0443\u0437\u044b\u043a\u0443. \u0428\u043e\u0443 ~15 \u043c\u0438\u043d\u0443\u0442 \u043a\u0430\u0436\u0434\u044b\u0439 \u0447\u0430\u0441 11:00\u201321:00. \u0412\u0445\u043e\u0434 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Musical+Fountain+Margaret+Island+Budapest"},
     {"label":"\u0421\u0430\u0439\u0442","href":"https://www.tripadvisor.com/Attraction_Review-g274887-d6936772-Reviews-Music_Fountain-Budapest_Central_Hungary.html"},
     {"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Zen%C3%A9l%C5%91+sz%C3%B6k%C5%91k%C3%BAt+Margitsziget+Budapest&tbm=isch"}],
    "\u0417\u0430\u0439\u043c\u0438\u0442\u0435 \u043c\u0435\u0441\u0442\u0430 \u0437\u0430 5 \u043c\u0438\u043d\u0443\u0442 \u0434\u043e \u043d\u0430\u0447\u0430\u043b\u0430. \u0412\u0435\u0447\u0435\u0440\u043d\u0435\u0435 \u0448\u043e\u0443 \u0441 \u043f\u043e\u0434\u0441\u0432\u0435\u0442\u043a\u043e\u0439 \u2014 \u0441\u0430\u043c\u043e\u0435 \u0432\u043f\u0435\u0447\u0430\u0442\u043b\u044f\u044e\u0449\u0435\u0435."))
p.append(poi_card(1,4,"&#128062;","\u0416\u0418\u0412\u041e\u0422\u041d\u042b\u0415","Kis &Aacute;llatkert","\u041c\u0438\u043d\u0438-\u0437\u043e\u043e\u043f\u0430\u0440\u043a \u043e\u0441\u0442\u0440\u043e\u0432\u0430 \u041c\u0430\u0440\u0433\u0438\u0442",
    "\u0423\u044e\u0442\u043d\u044b\u0439 \u043c\u0438\u043d\u0438-\u0437\u043e\u043e\u043f\u0430\u0440\u043a: \u043b\u0430\u043d\u0438, \u043f\u0430\u0432\u043b\u0438\u043d\u044b, \u043a\u043e\u0437\u044b, \u0443\u0442\u043a\u0438. \u041f\u043e\u043d\u0438-\u0440\u0430\u0439\u0434\u044b. \u0412\u0445\u043e\u0434 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439, 15\u201320 \u043c\u0438\u043d\u0443\u0442.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Mini+Zoo+Margaret+Island+Budapest"},
     {"label":"\u0421\u0430\u0439\u0442","href":"https://zoobudapest.com/en/for-visitors/margitsziget-mini-zoo/"},
     {"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Kis+%C3%81llatkert+Margitsziget+Budapest&tbm=isch"}],
    "\u041f\u0430\u0432\u043b\u0438\u043d\u044b \u0438\u043d\u043e\u0433\u0434\u0430 \u0440\u0430\u0441\u043f\u0443\u0441\u043a\u0430\u044e\u0442 \u0445\u0432\u043e\u0441\u0442\u044b \u043f\u0440\u044f\u043c\u043e \u043f\u0435\u0440\u0435\u0434 \u043f\u043e\u0441\u0435\u0442\u0438\u0442\u0435\u043b\u044f\u043c\u0438!"))
p.append(poi_card(1,5,"&#128690;","\u0422\u0420\u0410\u041d\u0421\u041f\u041e\u0420\u0422","Bring&oacute;hint&oacute;","\u0421\u0435\u043c\u0435\u0439\u043d\u0430\u044f \u0432\u0435\u043b\u043e\u0440\u0438\u043a\u0448\u0430",
    "\u041e\u0441\u0442\u0440\u043e\u0432 \u041c\u0430\u0440\u0433\u0438\u0442 \u2014 \u0437\u043e\u043d\u0430 \u0431\u0435\u0437 \u0430\u0432\u0442\u043e\u043c\u043e\u0431\u0438\u043b\u0435\u0439. 6-\u043c\u0435\u0441\u0442\u043d\u0430\u044f \u043c\u043e\u0434\u0435\u043b\u044c \u0441 \u043d\u0430\u0432\u0435\u0441\u043e\u043c. ~4 000 HUF/\u0447\u0430\u0441 (~10 EUR).",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Bring%C3%B3hint%C3%B3+Margitsziget+Budapest"},
     {"label":"\u0421\u0430\u0439\u0442","href":"https://www.budapestinfo.hu/en/bike-carriage-bringohinto"},
     {"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Bring%C3%B3hint%C3%B3+Margitsziget+Budapest&tbm=isch"}],
    "30\u201360 \u043c\u0438\u043d\u0443\u0442 \u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e. \u0410\u043b\u043b\u0435\u044f \u043f\u043b\u0430\u0442\u0430\u043d\u043e\u0432 \u2014 \u043a\u0430\u043a \u0442\u0443\u043d\u043d\u0435\u043b\u044c \u0438\u0437 \u0437\u0435\u043b\u0435\u043d\u0438."))
p.append("    </div>\n\n")
p.append(plan_b("\u0417\u0430\u043f\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u0430\u043d \u2014 \u0414\u043e\u0436\u0434\u043b\u0438\u0432\u044b\u0439 \u0434\u0435\u043d\u044c",
    "\u041e\u0442\u043f\u0440\u0430\u0432\u044c\u0442\u0435\u0441\u044c \u0432 Tropicarium (\u0430\u043a\u0443\u043b\u044b, \u0422\u0426 Campona) \u0438\u043b\u0438 Csod&aacute;k Palot&aacute;ja (\u0414\u0432\u043e\u0440\u0435\u0446 \u0447\u0443\u0434\u0435\u0441). \u041e\u0431\u0430 \u043f\u043e\u043b\u043d\u043e\u0441\u0442\u044c\u044e \u043a\u0440\u044b\u0442\u044b\u0435."))
p.append(pricing([("\u041f\u0430\u043b\u0430\u0442\u0438\u043d\u0443\u0441","21 400","HUF"),("\u0412\u0435\u043b\u043e\u0440\u0438\u043a\u0448\u0430","4 000","HUF"),("\u0422\u0440\u0430\u043d\u0441\u043f\u043e\u0440\u0442","5 000","HUF"),("\u0418\u0442\u043e\u0433\u043e","39 400","HUF (~99 EUR)")]))
p.append(day_end())

# The remaining days (2-11) follow the same pattern. Due to the size, I'll continue in a second part file.
# For now, write what we have to check structure, then append the rest.

# Save part 1 marker
part1_end = len(p)

print(f"Part 1: {part1_end} segments, ~{sum(len(x) for x in p)} chars")
print("Script loaded OK, writing rest...")

# I'll write the remaining days inline since the function helpers are defined

# DAY 2
p.append(day_start(2,"\u0421\u0443\u0431\u0431\u043e\u0442\u0430, 22 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026","&#129409; \u0414\u0435\u043d\u044c 2 \u2014 \u0412\u0430\u0440\u043e\u0448\u043b\u0438\u0433\u0435\u0442 / \u0417\u043e\u043e\u043f\u0430\u0440\u043a"))
p.append(sched_row("10:00",None,"&#128647; \u0412\u044b\u0435\u0437\u0434 \u0438\u0437 \u043e\u0442\u0435\u043b\u044f","\u041c\u0435\u0442\u0440\u043e M1")+"\n")
p.append(sched_row("10:20","#poi-day-2-1","&#129409; &Aacute;llatkert / \u0417\u043e\u043e\u043f\u0430\u0440\u043a \u0411\u0443\u0434\u0430\u043f\u0435\u0448\u0442\u0430","1 000+ \u0432\u0438\u0434\u043e\u0432")+"\n")
p.append(sched_row("13:00","#poi-day-2-2","&#127869;&#65039; V&aacute;rosliget Caf&eacute; / \u0412\u0430\u0440\u043e\u0448\u043b\u0438\u0433\u0435\u0442 \u041a\u0430\u0444\u0435","\u0422\u0435\u0440\u0440\u0430\u0441\u0430 \u0443 \u043e\u0437\u0435\u0440\u0430")+"\n")
p.append(sched_row("14:00","#poi-day-2-3","&#127984; Vajdahunyad v&aacute;r / \u0417\u0430\u043c\u043e\u043a \u0412\u0430\u0439\u0434\u0430\u0445\u0443\u043d\u044f\u0434","\u0421\u043a\u0430\u0437\u043e\u0447\u043d\u044b\u0439 \u0437\u0430\u043c\u043e\u043a")+"\n")
p.append(sched_row("15:00",None,"&#128733; \u041f\u043b\u043e\u0449\u0430\u0434\u043a\u0430 \u0412\u0430\u0440\u043e\u0448\u043b\u0438\u0433\u0435\u0442","\u041d\u043e\u0432\u0430\u044f \u043c\u0435\u0433\u0430-\u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430")+"\n")
p.append(sched_row("16:00","#poi-day-2-4","&#127914; Holnemvolt Park / \u041f\u0430\u0440\u043a \u00ab\u041d\u0435\u0431\u044b\u0432\u0430\u043b\u044b\u0439\u00bb","\u041a\u0430\u0440\u0443\u0441\u0435\u043b\u044c \u0428\u0435\u0444\u0442\u043d\u0435\u0440")+"\n")
p.append(sched_row("17:00",None,"&#127846; \u041c\u043e\u0440\u043e\u0436\u0435\u043d\u043e\u0435 \u0432 \u043f\u0430\u0440\u043a\u0435","")+"\n")
p.append(sched_row("18:00",None,"&#128647; \u0412\u043e\u0437\u0432\u0440\u0430\u0449\u0435\u043d\u0438\u0435","\u041c\u0435\u0442\u0440\u043e M1")+"\n")
p.append(day_mid("https://www.google.com/maps/dir/Budapest+Zoo+and+Botanical+Garden/V%C3%A1rosliget+Caf%C3%A9+Budapest/Vajdahunyad+Castle+Budapest/Holnemvolt+Park+Budapest/"))
p.append(poi_card(2,1,"&#129409;","\u0417\u041e\u041e\u041f\u0410\u0420\u041a","&Aacute;llatkert","\u0417\u043e\u043e\u043f\u0430\u0440\u043a \u0411\u0443\u0434\u0430\u043f\u0435\u0448\u0442\u0430","1 000+ \u0432\u0438\u0434\u043e\u0432 (1866). \u041a\u043e\u043d\u0442\u0430\u043a\u0442\u043d\u0430\u044f \u0444\u0435\u0440\u043c\u0430: \u043c\u0430\u043d\u0433\u0430\u043b\u0438\u0446\u0430, \u043f\u0443\u043c\u0438. \u041a\u0430\u0440\u0443\u0441\u0435\u043b\u044c \u0428\u0435\u0444\u0442\u043d\u0435\u0440. \u0412\u0437\u0440\u043e\u0441\u043b\u044b\u0435 5 900 HUF, \u0434\u0435\u0442\u0438 4 200 HUF.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Budapest+Zoo+and+Botanical+Garden"},{"label":"\u0421\u0430\u0439\u0442","href":"https://zoobudapest.com/en/home/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Budapest+Zoo+%C3%81llatkert&tbm=isch"}],
    "\u0421\u0443\u0431\u0431\u043e\u0442\u0430 \u2014 \u043c\u043d\u043e\u0433\u043e\u043b\u044e\u0434\u043d\u043e. \u041f\u0440\u0438\u0445\u043e\u0434\u0438\u0442\u0435 \u043a 09:00. \u042e\u0436\u043d\u044b\u0439 \u0432\u0445\u043e\u0434 \u043c\u0435\u043d\u0435\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d."))
p.append(poi_card(2,2,"&#127869;&#65039;","\u0420\u0415\u0421\u0422\u041e\u0420\u0410\u041d","V&aacute;rosliget Caf&eacute;","\u0412\u0430\u0440\u043e\u0448\u043b\u0438\u0433\u0435\u0442 \u041a\u0430\u0444\u0435","\u0422\u0435\u0440\u0440\u0430\u0441\u0430 \u0443 \u043e\u0437\u0435\u0440\u0430, \u0432\u0438\u0434 \u043d\u0430 \u0437\u0430\u043c\u043e\u043a. \u0414\u0435\u0442\u0441\u043a\u043e\u0435 \u043c\u0435\u043d\u044e, \u0433\u0443\u043b\u044f\u0448. 4 000\u20136 000 HUF/\u0447\u0435\u043b.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=V%C3%A1rosliget+Caf%C3%A9+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://www.tripadvisor.com/Restaurant_Review-g274887-d10351987-Reviews-Varosliget_Cafe_Restaurant-Budapest_Central_Hungary.html"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=V%C3%A1rosliget+Caf%C3%A9+Budapest&tbm=isch"}],
    "\u0411\u0440\u043e\u043d\u0438\u0440\u0443\u0439\u0442\u0435 \u0441\u0442\u043e\u043b\u0438\u043a \u043d\u0430 \u0442\u0435\u0440\u0440\u0430\u0441\u0435 \u0437\u0430\u0440\u0430\u043d\u0435\u0435."))
p.append(poi_card(2,3,"&#127984;","\u0410\u0420\u0425\u0418\u0422\u0415\u041a\u0422\u0423\u0420\u0410","Vajdahunyad v&aacute;r","\u0417\u0430\u043c\u043e\u043a \u0412\u0430\u0439\u0434\u0430\u0445\u0443\u043d\u044f\u0434","\u0421\u043a\u0430\u0437\u043e\u0447\u043d\u044b\u0439 \u0437\u0430\u043c\u043e\u043a \u043d\u0430 \u043e\u0441\u0442\u0440\u043e\u0432\u043a\u0435 \u043e\u0437\u0435\u0440\u0430 (1896). \u0421\u0442\u0430\u0442\u0443\u044f \u0410\u043d\u043e\u043d\u0438\u043c\u0443\u0441\u0430 \u2014 \u043f\u043e\u0442\u0440\u0438\u0442\u0435 \u043f\u0435\u0440\u043e &laquo;\u043d\u0430 \u0443\u0434\u0430\u0447\u0443&raquo;. \u0422\u0435\u0440\u0440\u0438\u0442\u043e\u0440\u0438\u044f \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0430.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Vajdahunyad+Castle+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://www.tripadvisor.com/Attraction_Review-g274887-d276866-Reviews-Vajdahunyad_Castle-Budapest_Central_Hungary.html"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Vajdahunyad+v%C3%A1r+Budapest&tbm=isch"}],
    "\u041f\u0440\u043e\u043a\u0430\u0442 \u043b\u043e\u0434\u043e\u043a ~3 000 HUF/30 \u043c\u0438\u043d. 30\u201340 \u043c\u0438\u043d\u0443\u0442 \u043d\u0430 \u043e\u0441\u043c\u043e\u0442\u0440."))
p.append(poi_card(2,4,"&#127914;","\u0410\u0422\u0422\u0420\u0410\u041a\u0426\u0418\u041e\u041d\u042b","Holnemvolt Park","\u041f\u0430\u0440\u043a \u00ab\u041d\u0435\u0431\u044b\u0432\u0430\u043b\u044b\u0439\u00bb","\u0420\u0435\u0442\u0440\u043e-\u043f\u0430\u0440\u043a: \u043a\u0430\u0440\u0443\u0441\u0435\u043b\u0438, \u043c\u0438\u043d\u0438-\u043f\u043e\u0435\u0437\u0434. \u041a\u0430\u0440\u0443\u0441\u0435\u043b\u044c \u0428\u0435\u0444\u0442\u043d\u0435\u0440 XIX \u0432\u0435\u043a\u0430. \u0414\u043b\u044f \u043c\u0430\u043b\u044b\u0448\u0435\u0439 \u0438 \u043c\u043b\u0430\u0434\u0448\u0435\u0433\u043e \u0448\u043a\u043e\u043b\u044c\u043d\u043e\u0433\u043e \u0432\u043e\u0437\u0440\u0430\u0441\u0442\u0430.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Holnemvolt+Park+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://zoobudapest.com/en/places-to-visit/holnemvolt-park/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Holnemvolt+Park+Budapest&tbm=isch"}],
    "\u0410\u0442\u0442\u0440\u0430\u043a\u0446\u0438\u043e\u043d\u044b ~500\u2013800 HUF. 30\u201345 \u043c\u0438\u043d\u0443\u0442."))
p.append("    </div>\n\n")
p.append(plan_b("\u0417\u0430\u043f\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u0430\u043d \u2014 \u041f\u043b\u043e\u0445\u0430\u044f \u043f\u043e\u0433\u043e\u0434\u0430","Csod&aacute;k Palot&aacute;ja (250+ \u044d\u043a\u0441\u043f\u043e\u043d\u0430\u0442\u043e\u0432) \u0438\u043b\u0438 Aquaworld (\u043a\u0440\u044b\u0442\u044b\u0439 \u0430\u043a\u0432\u0430\u043f\u0430\u0440\u043a)."))
p.append(pricing([("\u0417\u043e\u043e\u043f\u0430\u0440\u043a","20 600","HUF"),("\u041e\u0431\u0435\u0434","22 000","HUF"),("\u0410\u0442\u0442\u0440\u0430\u043a\u0446\u0438\u043e\u043d\u044b","3 500","HUF"),("\u0418\u0442\u043e\u0433\u043e","54 100","HUF (~137 EUR)")]))
p.append(day_end())

# For days 3-11, I'll use a more compact approach - just write the raw HTML
# This file is getting very long already. Let me write a separate continuation file.

# Actually let me just finish by reading the reference HTML for the remaining days structure
# and adapting it. The reference shows the pattern clearly.

# DAY 3-11 follow same pattern. Writing them all inline:

# DAY 3
p.append(day_start(3,"\u0412\u043e\u0441\u043a\u0440\u0435\u0441\u0435\u043d\u044c\u0435, 23 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026","&#128642; \u0414\u0435\u043d\u044c 3 \u2014 \u0411\u0443\u0434\u0430\u0439\u0441\u043a\u0438\u0435 \u0445\u043e\u043b\u043c\u044b"))
for r in [("10:00",None,"&#128651; \u0412\u044b\u0435\u0437\u0434 \u0438\u0437 \u043e\u0442\u0435\u043b\u044f","\u0422\u0440\u0430\u043c\u0432\u0430\u0439 \u0434\u043e V&aacute;rosmajor"),
    ("10:30","#poi-day-3-1","&#128642; Fogaskerek&#369; / \u0417\u0443\u0431\u0447\u0430\u0442\u0430\u044f \u0436/\u0434","\u041f\u043e\u0434\u044a\u0451\u043c \u043d\u0430 Sz&eacute;chenyihegy"),
    ("11:15","#poi-day-3-2","&#128642; Gyermekvas&uacute;t / \u0414\u0435\u0442\u0441\u043a\u0430\u044f \u0436/\u0434","\u041e\u0431\u0441\u043b\u0443\u0436\u0438\u0432\u0430\u044e\u0442 \u0434\u0435\u0442\u0438!"),
    ("12:30","#poi-day-3-3","&#127869;&#65039; Normafa L&aacute;ngos / \u041b\u0430\u043d\u0433\u043e\u0448","\u041b\u0443\u0447\u0448\u0438\u0439 \u043b\u0430\u043d\u0433\u043e\u0448 \u0432 \u0411\u0443\u0434\u0435"),
    ("13:30","#poi-day-3-4","&#128733; Normafa Playground / \u041f\u043b\u043e\u0449\u0430\u0434\u043a\u0430","\u041b\u0435\u0441\u043d\u0430\u044f \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430"),
    ("14:30","#poi-day-3-5","&#127956;&#65039; Erzs&eacute;bet-kil&aacute;t&oacute; / \u0421\u043c\u043e\u0442\u0440\u043e\u0432\u0430\u044f","\u041f\u0430\u043d\u043e\u0440\u0430\u043c\u0430 360\u00b0"),
    ("16:30",None,"&#128642; Gyermekvas&uacute;t \u043e\u0431\u0440\u0430\u0442\u043d\u043e","\u0414\u043e H&#369;v&ouml;sv&ouml;lgy"),
    ("17:00",None,"&#128651; \u0412\u043e\u0437\u0432\u0440\u0430\u0449\u0435\u043d\u0438\u0435","\u0422\u0440\u0430\u043c\u0432\u0430\u0439 61")]:
    p.append(sched_row(*r)+"\n")
p.append(day_mid("https://www.google.com/maps/dir/V%C3%A1rosmajor+Budapest/Sz%C3%A9chenyi-hegy+Budapest/Normafa+Budapest/Erzs%C3%A9bet-kil%C3%A1t%C3%B3+Budapest/H%C5%B1v%C3%B6sv%C3%B6lgy+Budapest/"))
p.append(poi_card(3,1,"&#128642;","\u0422\u0420\u0410\u041d\u0421\u041f\u041e\u0420\u0422","Fogaskerek&#369;","\u0417\u0443\u0431\u0447\u0430\u0442\u0430\u044f \u0436\u0435\u043b\u0435\u0437\u043d\u0430\u044f \u0434\u043e\u0440\u043e\u0433\u0430","\u0415\u0434\u0438\u043d\u0441\u0442\u0432\u0435\u043d\u043d\u0430\u044f \u0437\u0443\u0431\u0447\u0430\u0442\u0430\u044f \u0436/\u0434 \u0432 \u0411\u0443\u0434\u0430\u043f\u0435\u0448\u0442\u0435. 327 \u043c \u0432\u044b\u0441\u043e\u0442\u044b \u0437\u0430 20 \u043c\u0438\u043d\u0443\u0442. \u0420\u0435\u0442\u0440\u043e-\u0432\u0430\u0433\u043e\u043d\u044b. \u0412\u0445\u043e\u0434\u0438\u0442 \u0432 \u043f\u0440\u043e\u0435\u0437\u0434\u043d\u043e\u0439 BKK.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Fogaskerek%C5%B1+V%C3%A1rosmajor+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://bkk.hu/en/travel-information/public-transport/cogwheel-railway/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Fogaskerek%C5%B1+Budapest&tbm=isch"}],
    "\u0421\u044f\u0434\u044c\u0442\u0435 \u0441\u043f\u0440\u0430\u0432\u0430 \u2014 \u043b\u0443\u0447\u0448\u0438\u0439 \u0432\u0438\u0434. \u041e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u043a\u0430\u0436\u0434\u044b\u0435 15\u201320 \u043c\u0438\u043d\u0443\u0442."))
p.append(poi_card(3,2,"&#128642;","\u0414\u041e\u0421\u0422\u041e\u041f\u0420\u0418\u041c\u0415\u0427\u0410\u0422\u0415\u041b\u042c\u041d\u041e\u0421\u0422\u042c","Gyermekvas&uacute;t","\u0414\u0435\u0442\u0441\u043a\u0430\u044f \u0436\u0435\u043b\u0435\u0437\u043d\u0430\u044f \u0434\u043e\u0440\u043e\u0433\u0430","\u0415\u0434\u0438\u043d\u0441\u0442\u0432\u0435\u043d\u043d\u0430\u044f \u0432 \u043c\u0438\u0440\u0435 \u0436/\u0434, \u0433\u0434\u0435 \u043f\u0435\u0440\u0441\u043e\u043d\u0430\u043b \u2014 \u0434\u0435\u0442\u0438 10\u201314 \u043b\u0435\u0442! 11,2 \u043a\u043c \u0447\u0435\u0440\u0435\u0437 \u043b\u0435\u0441\u0430. \u0421\u0435\u043c\u0435\u0439\u043d\u044b\u0439 \u0431\u0438\u043b\u0435\u0442 4 000 HUF.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Gyermekvas%C3%BAt+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://gyermekvasut.hu/en/home/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Gyermekvas%C3%BAt+Budapest&tbm=isch"}],
    "\u0412\u044b\u0439\u0434\u0438\u0442\u0435 \u043d\u0430 \u0441\u0442\u0430\u043d\u0446\u0438\u0438 Normafa. \u0422\u043e\u043b\u044c\u043a\u043e \u043d\u0430\u043b\u0438\u0447\u043d\u044b\u0435!"))
p.append(poi_card(3,3,"&#127869;&#65039;","\u0415\u0414\u0410","Normafa L&aacute;ngos","\u041b\u0430\u043d\u0433\u043e\u0448 \u0443 \u041d\u043e\u0440\u043c\u0430\u0444\u0430","\u041b\u0435\u0433\u0435\u043d\u0434\u0430\u0440\u043d\u044b\u0439 \u043b\u0430\u043d\u0433\u043e\u0448-\u043a\u0438\u043e\u0441\u043a \u0432 \u043b\u0435\u0441\u0443. \u0421\u043c\u0435\u0442\u0430\u043d\u0430 + \u0441\u044b\u0440. ~1 200\u20131 800 HUF/\u0448\u0442.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Normafa+l%C3%A1ngos+Budapest"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Normafa+l%C3%A1ngos+Budapest&tbm=isch"}],
    "\u041d\u0430\u043b\u0438\u0447\u043d\u044b\u0435! \u0414\u043b\u044f \u0434\u0435\u0442\u0435\u0439 \u0431\u0435\u0437 \u0447\u0435\u0441\u043d\u043e\u043a\u0430."))
p.append(poi_card(3,4,"&#128733;","\u041f\u041b\u041e\u0429\u0410\u0414\u041a\u0410","Normafa Playground","\u041f\u043b\u043e\u0449\u0430\u0434\u043a\u0430 \u041d\u043e\u0440\u043c\u0430\u0444\u0430","\u0411\u043e\u043b\u044c\u0448\u0430\u044f \u043b\u0435\u0441\u043d\u0430\u044f \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430 \u043d\u0430 480 \u043c. \u0413\u043e\u0440\u043a\u0438, \u043a\u0430\u043d\u0430\u0442\u043d\u044b\u0435 \u0434\u043e\u0440\u043e\u0436\u043a\u0438. \u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Normafa+Playground+Budapest"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Normafa+j%C3%A1tsz%C3%B3t%C3%A9r+Budapest&tbm=isch"}],
    "\u041a\u0430\u043d\u0430\u0442\u043d\u044b\u0439 \u043c\u043e\u0441\u0442 \u2014 \u0422\u0430\u043c\u0438\u0440 \u043e\u0446\u0435\u043d\u0438\u0442. \u0414\u0435\u0440\u0435\u0432\u044f\u043d\u043d\u0430\u044f \u043a\u0440\u0435\u043f\u043e\u0441\u0442\u044c \u0434\u043b\u044f \u0418\u0442\u0430\u044f."))
p.append(poi_card(3,5,"&#127956;&#65039;","\u041f\u0410\u041d\u041e\u0420\u0410\u041c\u0410","Erzs&eacute;bet-kil&aacute;t&oacute;","\u0421\u043c\u043e\u0442\u0440\u043e\u0432\u0430\u044f \u0431\u0430\u0448\u043d\u044f \u0415\u043b\u0438\u0437\u0430\u0432\u0435\u0442\u044b","\u0421\u0430\u043c\u0430\u044f \u0432\u044b\u0441\u043e\u043a\u0430\u044f \u0442\u043e\u0447\u043a\u0430 \u0411\u0443\u0434\u0430\u043f\u0435\u0448\u0442\u0430 (527 \u043c). \u041f\u0430\u043d\u043e\u0440\u0430\u043c\u0430 360\u00b0, 77 \u0441\u0442\u0443\u043f\u0435\u043d\u0435\u0439. ~1 000 HUF.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Erzs%C3%A9bet-kil%C3%A1t%C3%B3+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://www.tripadvisor.com/Attraction_Review-g274887-d2176236-Reviews-Elizabeth_Lookout-Budapest_Central_Hungary.html"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Erzs%C3%A9bet-kil%C3%A1t%C3%B3+Budapest&tbm=isch"}],
    "\u041a\u043e\u043c\u043f\u0430\u0441 \u043d\u0430 \u043f\u043e\u043b\u0443 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442 \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u043a \u0441\u0442\u043e\u043b\u0438\u0446\u0430\u043c. 20 \u043c\u0438\u043d \u043f\u0435\u0448\u043a\u043e\u043c \u043e\u0442 \u041d\u043e\u0440\u043c\u0430\u0444\u0430."))
p.append("    </div>\n\n")
p.append(plan_b("\u0417\u0430\u043f\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u0430\u043d \u2014 \u0414\u043e\u0436\u0434\u044c \u0432 \u0433\u043e\u0440\u0430\u0445","\u0412 \u0434\u043e\u0436\u0434\u044c \u0445\u043e\u043b\u043c\u044b \u0441\u043a\u043e\u043b\u044c\u0437\u043a\u0438\u0435. Miniversum (600 \u0437\u0434\u0430\u043d\u0438\u0439, 100 \u043f\u043e\u0435\u0437\u0434\u043e\u0432) \u0438\u043b\u0438 \u041c\u0443\u0437\u0435\u0439 \u0435\u0441\u0442\u0435\u0441\u0442\u0432\u043e\u0437\u043d\u0430\u043d\u0438\u044f (\u0434\u0438\u043d\u043e\u0437\u0430\u0432\u0440\u044b)."))
p.append(pricing([("\u0414\u0435\u0442\u0441\u043a\u0430\u044f \u0436/\u0434","4 000","HUF"),("\u041b\u0430\u043d\u0433\u043e\u0448","8 000","HUF"),("\u0421\u043c\u043e\u0442\u0440\u043e\u0432\u0430\u044f","3 000","HUF"),("\u0418\u0442\u043e\u0433\u043e","22 500","HUF (~56 EUR)")]))
p.append(day_end())

# Due to the extreme length, I'll write remaining days (4-11) and budget to a second file
# and concatenate. But first let me write what we have so we can verify.

# Actually, let's just keep going - the file will be big but Python handles it fine.
# I'll write days 4-11 + budget section in a continuation

# Read the continuation from a separate helper
# For brevity, let me generate days 4-11 using the same compact pattern

# DAY 4
p.append(day_start(4,"\u041f\u043e\u043d\u0435\u0434\u0435\u043b\u044c\u043d\u0438\u043a, 24 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026","&#127984; \u0414\u0435\u043d\u044c 4 \u2014 \u0411\u0443\u0434\u0430\u0439\u0441\u043a\u0430\u044f \u043a\u0440\u0435\u043f\u043e\u0441\u0442\u044c + \u041f\u0435\u0449\u0435\u0440\u0430"))
for r in [("10:00",None,"&#128651; \u0412\u044b\u0435\u0437\u0434","\u0422\u0440\u0430\u043c\u0432\u0430\u0439 19/41"),("10:15",None,"&#128673; \u0424\u0443\u043d\u0438\u043a\u0443\u043b\u0451\u0440",""),("10:30","#poi-day-4-1","&#127984; Budai V&aacute;r / \u0411\u0443\u0434\u0430\u0439\u0441\u043a\u0430\u044f \u043a\u0440\u0435\u043f\u043e\u0441\u0442\u044c","\u0414\u0432\u043e\u0440\u044b, \u0441\u043c\u0435\u043d\u0430 \u043a\u0430\u0440\u0430\u0443\u043b\u0430"),("11:30","#poi-day-4-2","&#127963;&#65039; Hal&aacute;szb&aacute;stya / \u0420\u044b\u0431\u0430\u0446\u043a\u0438\u0439 \u0431\u0430\u0441\u0442\u0438\u043e\u043d","\u041f\u0430\u043d\u043e\u0440\u0430\u043c\u0430"),("12:30","#poi-day-4-3","&#127869;&#65039; Riso Ristorante / \u0420\u0438\u0437\u043e","\u0418\u0442\u0430\u043b\u044c\u044f\u043d\u0441\u043a\u0430\u044f \u043a\u0443\u0445\u043d\u044f + \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430"),("14:00",None,"&#128652; \u041f\u0435\u0440\u0435\u0435\u0437\u0434","\u0410\u0432\u0442\u043e\u0431\u0443\u0441 29"),("14:30","#poi-day-4-4","&#128371;&#65039; Szeml&#337;-hegyi-barlang / \u041f\u0435\u0449\u0435\u0440\u0430","~45 \u043c\u0438\u043d"),("16:30",None,"&#128652; \u0412\u043e\u0437\u0432\u0440\u0430\u0449\u0435\u043d\u0438\u0435","")]:
    p.append(sched_row(*r)+"\n")
p.append(day_mid("https://www.google.com/maps/dir/Budav%C3%A1ri+Sikl%C3%B3+Budapest/Buda+Castle+Budapest/Hal%C3%A1szb%C3%A1stya+Budapest/Riso+Ristorante+Budapest/Szeml%C5%91-hegyi-barlang+Budapest/"))
p.append(poi_card(4,1,"&#127984;","\u042e\u041d\u0415\u0421\u041a\u041e","Budai V&aacute;r","\u0411\u0443\u0434\u0430\u0439\u0441\u043a\u0430\u044f \u043a\u0440\u0435\u043f\u043e\u0441\u0442\u044c","\u0421\u0440\u0435\u0434\u043d\u0435\u0432\u0435\u043a\u043e\u0432\u0430\u044f \u043a\u0440\u0435\u043f\u043e\u0441\u0442\u044c \u044e\u041d\u0415\u0421\u041a\u041e. \u0411\u0430\u0448\u043d\u0438, \u043f\u043e\u0434\u0437\u0435\u043c\u0435\u043b\u044c\u044f, \u0432\u0438\u0434\u044b. \u0424\u043e\u043d\u0442\u0430\u043d \u041c\u0430\u0442\u044c\u044f\u0448\u0430. \u0422\u0435\u0440\u0440\u0438\u0442\u043e\u0440\u0438\u044f \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0430.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Buda+Castle+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://budacastlebudapest.com/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Budai+V%C3%A1r+Budapest&tbm=isch"}],
    "\u041f\u043e\u043d\u0435\u0434\u0435\u043b\u044c\u043d\u0438\u043a \u2014 \u043c\u0443\u0437\u0435\u0438 \u0437\u0430\u043a\u0440\u044b\u0442\u044b, \u043d\u043e \u0442\u0435\u0440\u0440\u0438\u0442\u043e\u0440\u0438\u044f \u043e\u0442\u043a\u0440\u044b\u0442\u0430. \u0423\u0434\u043e\u0431\u043d\u0430\u044f \u043e\u0431\u0443\u0432\u044c!"))
p.append(poi_card(4,2,"&#127963;&#65039;","\u041f\u0410\u041d\u041e\u0420\u0410\u041c\u0410","Hal&aacute;szb&aacute;stya","\u0420\u044b\u0431\u0430\u0446\u043a\u0438\u0439 \u0431\u0430\u0441\u0442\u0438\u043e\u043d","7 \u0431\u0430\u0448\u0435\u043d \u2014 \u043b\u0443\u0447\u0448\u0438\u0439 \u0432\u0438\u0434 \u043d\u0430 \u041f\u0430\u0440\u043b\u0430\u043c\u0435\u043d\u0442. \u041d\u0438\u0436\u043d\u044f\u044f \u0442\u0435\u0440\u0440\u0430\u0441\u0430 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0430.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Hal%C3%A1szb%C3%A1stya+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://fishermansbastion.com/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Hal%C3%A1szb%C3%A1stya+Budapest&tbm=isch"}],
    "\u0423\u0442\u0440\u043e\u043c \u0441\u0432\u0435\u0442 \u0438\u0434\u0435\u0430\u043b\u044c\u043d\u044b\u0439. \u041d\u0438\u0436\u043d\u044f\u044f \u0442\u0435\u0440\u0440\u0430\u0441\u0430 \u043d\u0435 \u0445\u0443\u0436\u0435 \u0432\u0435\u0440\u0445\u043d\u0435\u0439!"))
p.append(poi_card(4,3,"&#127869;&#65039;","\u0420\u0415\u0421\u0422\u041e\u0420\u0410\u041d","Riso Ristorante","\u0420\u0438\u0437\u043e \u0420\u0435\u0441\u0442\u043e\u0440\u0430\u043d","\u0418\u0442\u0430\u043b\u044c\u044f\u043d\u0441\u043a\u0438\u0439 \u0440\u0435\u0441\u0442\u043e\u0440\u0430\u043d \u0441 \u0434\u0435\u0442\u0441\u043a\u043e\u0439 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u043e\u0439 \u0432\u043e \u0434\u0432\u043e\u0440\u0435. \u041f\u0438\u0446\u0446\u0430 \u0438\u0437 \u0434\u0440\u043e\u0432\u044f\u043d\u043e\u0439 \u043f\u0435\u0447\u0438. 4 000\u20136 000 HUF/\u0447\u0435\u043b.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Riso+Ristorante+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://www.tripadvisor.com/Restaurant_Review-g274887-d10367621-Reviews-Riso_Ristorante-Budapest_Central_Hungary.html"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Riso+Ristorante+Budapest&tbm=isch"}],
    "\u0411\u0440\u043e\u043d\u0438\u0440\u0443\u0439\u0442\u0435 \u0442\u0435\u0440\u0440\u0430\u0441\u0443."))
p.append(poi_card(4,4,"&#128371;&#65039;","\u041f\u0415\u0429\u0415\u0420\u0410","Szeml&#337;-hegyi-barlang","\u041f\u0435\u0449\u0435\u0440\u0430 \u0421\u0435\u043c\u043b\u0451-\u0445\u0435\u0434\u0438","\u0422\u0435\u0440\u043c\u0430\u043b\u044c\u043d\u0430\u044f \u043f\u0435\u0449\u0435\u0440\u0430 \u0441 &laquo;\u043a\u0430\u043c\u0435\u043d\u043d\u044b\u043c\u0438 \u0446\u0432\u0435\u0442\u0430\u043c\u0438&raquo;. 12\u00b0C \u2014 \u0432\u043e\u0437\u044c\u043c\u0438\u0442\u0435 \u043a\u043e\u0444\u0442\u0443! 45 \u043c\u0438\u043d\u0443\u0442. \u0412\u0437\u0440\u043e\u0441\u043b\u044b\u0435 ~2 400, \u0434\u0435\u0442\u0438 ~1 500 HUF.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Szeml%C5%91-hegyi-barlang+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://szemlo-hegyi-barlang.hu/?lang=en"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Szeml%C5%91-hegyi-barlang+Budapest&tbm=isch"}],
    "\u0422\u0443\u0440\u044b \u043a\u0430\u0436\u0434\u044b\u0439 \u0447\u0430\u0441 10:00\u201316:00. \u041f\u043e\u043d\u0435\u0434\u0435\u043b\u044c\u043d\u0438\u043a \u2014 \u0442\u0438\u0445\u043e."))
p.append("    </div>\n\n")
p.append(plan_b("\u0417\u0430\u043f\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u0430\u043d","P&aacute;lv&ouml;lgyi-barlang (500 \u043c \u043e\u0442 \u0421\u0435\u043c\u043b\u0451-\u0445\u0435\u0434\u0438) \u0438\u043b\u0438 G&uuml;l Baba t&uuml;rb&eacute;je (\u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e)."))
p.append(pricing([("\u0424\u0443\u043d\u0438\u043a\u0443\u043b\u0451\u0440","12 600","HUF"),("\u041e\u0431\u0435\u0434","22 000","HUF"),("\u041f\u0435\u0449\u0435\u0440\u0430","8 000","HUF"),("\u0418\u0442\u043e\u0433\u043e","47 600","HUF (~120 EUR)")]))
p.append(day_end())

# DAY 5
p.append(day_start(5,"\u0412\u0442\u043e\u0440\u043d\u0438\u043a, 25 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026","&#128300; \u0414\u0435\u043d\u044c 5 \u2014 \u0414\u0432\u043e\u0440\u0435\u0446 \u0447\u0443\u0434\u0435\u0441"))
for r in [("10:00",None,"&#128652; \u0412\u044b\u0435\u0437\u0434","\u0410\u0432\u0442\u043e\u0431\u0443\u0441 / H\u00c9V"),("10:30","#poi-day-5-1","&#128300; Csod&aacute;k Palot&aacute;ja / \u0414\u0432\u043e\u0440\u0435\u0446 \u0447\u0443\u0434\u0435\u0441","250+ \u044d\u043a\u0441\u043f\u043e\u043d\u0430\u0442\u043e\u0432"),("12:30",None,"&#127869;&#65039; \u041e\u0431\u0435\u0434 \u0432 \u043a\u0430\u0444\u0435 \u043c\u0443\u0437\u0435\u044f",""),("15:30","#poi-day-5-2","&#128733; Kopaszi-g&aacute;t / \u0414\u0430\u043c\u0431\u0430 \u041a\u043e\u043f\u0430\u0441\u0438","\u041d\u0430\u0431\u0435\u0440\u0435\u0436\u043d\u0430\u044f"),("17:30","#poi-day-5-3","&#127869;&#65039; VakVarj&uacute; / \u0412\u0430\u043a\u0412\u0430\u0440\u044c\u044e","\u0423\u0436\u0438\u043d + \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430"),("19:00",None,"&#128651; \u0412\u043e\u0437\u0432\u0440\u0430\u0449\u0435\u043d\u0438\u0435","\u0422\u0440\u0430\u043c\u0432\u0430\u0439")]:
    p.append(sched_row(*r)+"\n")
p.append(day_mid("https://www.google.com/maps/dir/Csod%C3%A1k+Palot%C3%A1ja+Budapest/Kopaszi+g%C3%A1t+Budapest/VakVarj%C3%BA+%C3%89tterem+Budapest/"))
p.append(poi_card(5,1,"&#128300;","\u041d\u0410\u0423\u041a\u0410","Csod&aacute;k Palot&aacute;ja","\u0414\u0432\u043e\u0440\u0435\u0446 \u0447\u0443\u0434\u0435\u0441","250+ \u044d\u043a\u0441\u043f\u043e\u043d\u0430\u0442\u043e\u0432 \u043d\u0430 5 000 \u043c\u00b2. \u041b\u0435\u043a\u0446\u0438\u0438 \u0441 \u0436\u0438\u0434\u043a\u0438\u043c \u0430\u0437\u043e\u0442\u043e\u043c. \u041c\u044b\u043b\u044c\u043d\u044b\u0435 \u043f\u0443\u0437\u044b\u0440\u0438. \u0412\u0437\u0440\u043e\u0441\u043b\u044b\u0435 ~4 800, \u0434\u0435\u0442\u0438 ~3 600 HUF.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Csod%C3%A1k+Palot%C3%A1ja+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://www.csopa.hu/en/home/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Csod%C3%A1k+Palot%C3%A1ja+Budapest&tbm=isch"}],
    "\u0412\u0442\u043e\u0440\u043d\u0438\u043a \u2014 \u043c\u0430\u043b\u043e \u043f\u043e\u0441\u0435\u0442\u0438\u0442\u0435\u043b\u0435\u0439. \u041f\u043e\u0441\u043b\u0435\u0434\u043d\u044f\u044f \u043b\u0435\u043a\u0446\u0438\u044f \u0432 15:00. 4\u20135 \u0447\u0430\u0441\u043e\u0432."))
p.append(poi_card(5,2,"&#128733;","\u041f\u0420\u041e\u0413\u0423\u041b\u041a\u0410","Kopaszi-g&aacute;t","\u0414\u0430\u043c\u0431\u0430 \u041a\u043e\u043f\u0430\u0441\u0438","\u041d\u0430\u0431\u0435\u0440\u0435\u0436\u043d\u0430\u044f \u0441 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430\u043c\u0438 \u0438 \u0432\u0438\u0434\u043e\u043c \u043d\u0430 \u0414\u0443\u043d\u0430\u0439. \u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Kopaszi+g%C3%A1t+Budapest"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Kopaszi+g%C3%A1t+Budapest&tbm=isch"}],
    "\u0420\u044f\u0434\u043e\u043c VakVarj&uacute; \u2014 \u043f\u043b\u0430\u0432\u043d\u044b\u0439 \u043f\u0435\u0440\u0435\u0445\u043e\u0434 \u043a \u0443\u0436\u0438\u043d\u0443."))
p.append(poi_card(5,3,"&#127869;&#65039;","\u0420\u0415\u0421\u0422\u041e\u0420\u0410\u041d","VakVarj&uacute;","\u0412\u0430\u043a\u0412\u0430\u0440\u044c\u044e","\u0421\u0430\u043c\u044b\u0439 child-friendly \u0440\u0435\u0441\u0442\u043e\u0440\u0430\u043d. \u041e\u0433\u0440\u043e\u043c\u043d\u0430\u044f \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430: \u0433\u043e\u0440\u043a\u0438, \u043a\u0430\u0447\u0435\u043b\u0438, \u043f\u0435\u0441\u043e\u0447\u043d\u0438\u0446\u0430. \u0413\u0443\u043b\u044f\u0448, \u043f\u0430\u043b\u0430\u0447\u0438\u043d\u0442\u0430.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=VakVarj%C3%BA+%C3%89tterem+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://www.vakvarjuetterem.hu/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=VakVarj%C3%BA+%C3%89tterem+Budapest&tbm=isch"}],
    "\u0411\u0440\u043e\u043d\u0438\u0440\u0443\u0439\u0442\u0435 \u0442\u0435\u0440\u0440\u0430\u0441\u0443! \u041f\u043b\u043e\u0449\u0430\u0434\u043a\u0430 \u0432\u0438\u0434\u043d\u0430 \u0441\u043e \u0432\u0441\u0435\u0445 \u0441\u0442\u043e\u043b\u0438\u043a\u043e\u0432."))
p.append("    </div>\n\n")
p.append(plan_b("\u0417\u0430\u043f\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u0430\u043d","\u0416/\u0434 \u043c\u0443\u0437\u0435\u0439 (100+ \u043b\u043e\u043a\u043e\u043c\u043e\u0442\u0438\u0432\u043e\u0432) \u0438\u043b\u0438 Tropicarium (\u0430\u043a\u0443\u043b\u044b). \u0423\u0436\u0438\u043d \u0432 VakVarj&uacute; \u043e\u0441\u0442\u0430\u0432\u044c\u0442\u0435."))
p.append(pricing([("\u0414\u0432\u043e\u0440\u0435\u0446 \u0447\u0443\u0434\u0435\u0441","16 800","HUF"),("\u041e\u0431\u0435\u0434","8 000","HUF"),("\u0423\u0436\u0438\u043d","28 000","HUF"),("\u0418\u0442\u043e\u0433\u043e","57 800","HUF (~145 EUR)")]))
p.append(day_end())

# DAY 6
p.append(day_start(6,"\u0421\u0440\u0435\u0434\u0430, 26 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026","&#128717;&#65039; \u0414\u0435\u043d\u044c 6 \u2014 \u0426\u0435\u043d\u0442\u0440 \u041f\u0435\u0448\u0442\u0430"))
for r in [("10:00",None,"&#128647; \u0412\u044b\u0435\u0437\u0434","\u041c\u0435\u0442\u0440\u043e M1"),("10:15","#poi-day-6-1","&#128642; Miniversum / \u041c\u0438\u043d\u0438\u0432\u0435\u0440\u0441\u0443\u043c","\u041f\u043e\u0435\u0437\u0434\u0430, \u0433\u043e\u0440\u043e\u0434\u0430"),("12:30","#poi-day-6-2","&#127963;&#65039; Nagycsarnok / \u0426\u0435\u043d\u0442\u0440. \u0440\u044b\u043d\u043e\u043a","\u041b\u0430\u043d\u0433\u043e\u0448, \u043a\u043e\u043b\u0431\u0430\u0441\u044b"),("14:00","#poi-day-6-3","&#128717;&#65039; V&aacute;ci utca + \u0418\u0433\u0440\u0443\u0448\u043a\u0438","k&uuml;rt&#337;skal&aacute;cs"),("15:30",None,"&#127754; \u041d\u0430\u0431\u0435\u0440\u0435\u0436\u043d\u0430\u044f \u0414\u0443\u043d\u0430\u044f","\u041c\u0435\u043c\u043e\u0440\u0438\u0430\u043b &laquo;\u0422\u0443\u0444\u043b\u0438&raquo;"),("16:00","#poi-day-6-4","&#127918; Family Fun Center / \u0410\u0440\u043a\u0430\u0434\u044b","\u0418\u0433\u0440\u043e\u0432\u044b\u0435 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u044b"),("17:00",None,"&#127869;&#65039; \u0423\u0436\u0438\u043d",""),("18:00",None,"&#128647; \u0412\u043e\u0437\u0432\u0440\u0430\u0449\u0435\u043d\u0438\u0435","")]:
    p.append(sched_row(*r)+"\n")
p.append(day_mid("https://www.google.com/maps/dir/Miniversum+Budapest/Nagycsarnok+Budapest/V%C3%A1ci+utca+Budapest/Cip%C5%91k+a+Duna-parton+Budapest/"))
p.append(poi_card(6,1,"&#128642;","\u041c\u0418\u041d\u0418\u0410\u0422\u042e\u0420\u042b","Miniversum","\u041c\u0438\u043d\u0438\u0432\u0435\u0440\u0441\u0443\u043c","330 \u043c\u00b2, 100 \u043f\u043e\u0435\u0437\u0434\u043e\u0432, 600 \u0437\u0434\u0430\u043d\u0438\u0439. \u041d\u043e\u0447\u043d\u043e\u0439 \u0440\u0435\u0436\u0438\u043c \u043a\u0430\u0436\u0434\u044b\u0435 15 \u043c\u0438\u043d. \u0412\u0437\u0440\u043e\u0441\u043b\u044b\u0435 ~3 900, \u0434\u0435\u0442\u0438 ~2 900 HUF.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Miniversum+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://www.miniversum.hu/en/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Miniversum+Budapest&tbm=isch"}],
    "\u0421\u0440\u0435\u0434\u0430 \u2014 \u043c\u0430\u043b\u043e \u043f\u043e\u0441\u0435\u0442\u0438\u0442\u0435\u043b\u0435\u0439. M1, Opera \u2014 2 \u043c\u0438\u043d \u043f\u0435\u0448\u043a\u043e\u043c."))
p.append(poi_card(6,2,"&#127963;&#65039;","\u0420\u042b\u041d\u041e\u041a","Nagycsarnok","\u0426\u0435\u043d\u0442\u0440\u0430\u043b\u044c\u043d\u044b\u0439 \u0440\u044b\u043d\u043e\u043a","\u041a\u0440\u0443\u043f\u043d\u0435\u0439\u0448\u0438\u0439 \u043a\u0440\u044b\u0442\u044b\u0439 \u0440\u044b\u043d\u043e\u043a (1897). \u041b\u0430\u043d\u0433\u043e\u0448 \u043d\u0430 2-\u043c \u044d\u0442\u0430\u0436\u0435, \u044f\u0433\u043e\u0434\u044b, \u043a\u043e\u043b\u0431\u0430\u0441\u0430, \u043f\u0430\u043f\u0440\u0438\u043a\u0430. \u0412\u0445\u043e\u0434 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0439.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Nagycsarnok+Budapest+Central+Market+Hall"},{"label":"\u0421\u0430\u0439\u0442","href":"https://www.piaconline.hu/en/central_market_hall"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Nagycsarnok+Budapest&tbm=isch"}],
    "\u0417\u0430\u043a\u0440\u044b\u0442 \u0432 \u0432\u043e\u0441\u043a\u0440\u0435\u0441\u0435\u043d\u044c\u0435, \u043d\u043e \u043c\u044b \u0438\u0434\u0451\u043c \u0432 \u0441\u0440\u0435\u0434\u0443."))
p.append(poi_card(6,3,"&#128717;&#65039;","\u0428\u041e\u041f\u041f\u0418\u041d\u0413","V&aacute;ci utca","\u0412\u0430\u0446\u0438 + \u041c\u0430\u0433\u0430\u0437\u0438\u043d\u044b \u0438\u0433\u0440\u0443\u0448\u0435\u043a","\u041f\u0435\u0448\u0435\u0445\u043e\u0434\u043d\u0430\u044f \u0443\u043b\u0438\u0446\u0430. K&uuml;rt&#337;skal&aacute;cs (\u0442\u0440\u0434\u0435\u043b\u044c\u043d\u0438\u043a, ~1 000 HUF). Bobapark \u2014 \u0438\u0433\u0440\u0443\u0448\u043a\u0438.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=V%C3%A1ci+utca+Budapest"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=V%C3%A1ci+utca+Budapest&tbm=isch"}],
    "\u0421\u0443\u0432\u0435\u043d\u0438\u0440\u044b \u043b\u0443\u0447\u0448\u0435 \u043d\u0430 \u0440\u044b\u043d\u043a\u0435 \u2014 \u0434\u0435\u0448\u0435\u0432\u043b\u0435."))
p.append(poi_card(6,4,"&#127918;","\u0420\u0410\u0417\u0412\u041b\u0415\u0427\u0415\u041d\u0418\u0415","Family Fun Center","\u0410\u0440\u043a\u0430\u0434\u043d\u044b\u0435 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u044b","\u0413\u043e\u043d\u043e\u0447\u043d\u044b\u0435 \u0441\u0438\u043c\u0443\u043b\u044f\u0442\u043e\u0440\u044b, \u0430\u044d\u0440\u043e\u0445\u043e\u043a\u043a\u0435\u0439, claw machines. 30\u201345 \u043c\u0438\u043d, ~200\u2013500 HUF/\u0438\u0433\u0440\u0430.",
    [{"label":"WestEnd City Center","href":"https://maps.google.com/?q=WestEnd+City+Center+Budapest"}],
    "\u0411\u044e\u0434\u0436\u0435\u0442 ~3 000 HUF. Claw machines \u0440\u0435\u0434\u043a\u043e \u0432\u044b\u0438\u0433\u0440\u044b\u0432\u0430\u044e\u0442!"))
p.append("    </div>\n\n")
p.append(plan_b("\u0417\u0430\u043f\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u0430\u043d","Bors GasztroBar (\u0441\u0443\u043f\u044b \u0432 \u0445\u043b\u0435\u0431\u043d\u044b\u0445 \u0447\u0430\u0448\u0430\u0445) \u0438\u043b\u0438 Karav&aacute;n Street Food."))
p.append(pricing([("\u041c\u0438\u043d\u0438\u0432\u0435\u0440\u0441\u0443\u043c","13 600","HUF"),("\u0420\u044b\u043d\u043e\u043a","10 000","HUF"),("\u0410\u0440\u043a\u0430\u0434\u044b","3 000","HUF"),("\u0423\u0436\u0438\u043d","20 000","HUF"),("\u0418\u0442\u043e\u0433\u043e","54 600","HUF (~137 EUR)")]))
p.append(day_end())

# DAY 7
p.append(day_start(7,"\u0427\u0435\u0442\u0432\u0435\u0440\u0433, 27 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026","&#128642; \u0414\u0435\u043d\u044c 7 \u2014 \u0416/\u0434 \u043c\u0443\u0437\u0435\u0439 + \u0414\u0443\u043d\u0430\u0439"))
for r in [("10:00",None,"&#128652; \u0412\u044b\u0435\u0437\u0434","\u0410\u0432\u0442\u043e\u0431\u0443\u0441 30"),("10:30","#poi-day-7-1","&#128642; Vas&uacute;tt&ouml;rt&eacute;neti Park / \u0416/\u0434 \u043c\u0443\u0437\u0435\u0439","100+ \u043b\u043e\u043a\u043e\u043c\u043e\u0442\u0438\u0432\u043e\u0432"),("13:00",None,"&#127869;&#65039; \u041e\u0431\u0435\u0434",""),("14:30","#poi-day-7-2","&#128733; \u041f\u043b\u043e\u0449\u0430\u0434\u043a\u0430 \u0443 \u041f\u0430\u0440\u043b\u0430\u043c\u0435\u043d\u0442\u0430","Kossuth Lajos t&eacute;r"),("15:30","#poi-day-7-3","&#128674; \u0414\u0443\u043d\u0430\u0439\u0441\u043a\u0438\u0439 \u043a\u0440\u0443\u0438\u0437","1 \u0447\u0430\u0441"),("17:00",None,"&#127846; \u041c\u043e\u0440\u043e\u0436\u0435\u043d\u043e\u0435",""),("18:30",None,"&#128651; \u0412\u043e\u0437\u0432\u0440\u0430\u0449\u0435\u043d\u0438\u0435","")]:
    p.append(sched_row(*r)+"\n")
p.append(day_mid("https://www.google.com/maps/dir/Vas%C3%BAtt%C3%B6rt%C3%A9neti+Park+Budapest/Kossuth+Lajos+t%C3%A9r+Budapest/Vigad%C3%B3+t%C3%A9r+Budapest/"))
p.append(poi_card(7,1,"&#128642;","\u041c\u0423\u0417\u0415\u0419","Vas&uacute;tt&ouml;rt&eacute;neti Park","\u0416\u0435\u043b\u0435\u0437\u043d\u043e\u0434\u043e\u0440\u043e\u0436\u043d\u044b\u0439 \u043c\u0443\u0437\u0435\u0439","\u041a\u0440\u0443\u043f\u043d\u0435\u0439\u0448\u0438\u0439 \u0436/\u0434 \u043c\u0443\u0437\u0435\u0439 \u0415\u0432\u0440\u043e\u043f\u044b. 100+ \u043b\u043e\u043a\u043e\u043c\u043e\u0442\u0438\u0432\u043e\u0432. \u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u043f\u0430\u0440\u043e\u0432\u043e\u0437\u043e\u043c, \u0434\u0440\u0435\u0437\u0438\u043d\u0430, \u043c\u0438\u043d\u0438-\u043f\u043e\u0435\u0437\u0434. \u0421\u0435\u043c\u0435\u0439\u043d\u044b\u0439 ~6 000 HUF.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Vas%C3%BAtt%C3%B6rt%C3%A9neti+Park+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://vasuttortenetipark.hu/en/home/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Vas%C3%BAtt%C3%B6rt%C3%A9neti+Park+Budapest&tbm=isch"}],
    "\u0427\u0435\u0442\u0432\u0435\u0440\u0433 \u2014 \u043c\u0430\u043b\u043e \u043f\u043e\u0441\u0435\u0442\u0438\u0442\u0435\u043b\u0435\u0439. 2,5\u20133 \u0447\u0430\u0441\u0430."))
p.append(poi_card(7,2,"&#128733;","\u041f\u041b\u041e\u0429\u0410\u0414\u041a\u0410","Kossuth Lajos t&eacute;r","\u041f\u043b\u043e\u0449\u0430\u0434\u043a\u0430 \u0443 \u041f\u0430\u0440\u043b\u0430\u043c\u0435\u043d\u0442\u0430","\u0424\u043e\u043d\u0442\u0430\u043d\u044b, \u0433\u0430\u0437\u043e\u043d\u044b, \u0441\u043c\u0435\u043d\u0430 \u043a\u0430\u0440\u0430\u0443\u043b\u0430. \u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Kossuth+Lajos+t%C3%A9r+Budapest"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Kossuth+Lajos+t%C3%A9r+Budapest&tbm=isch"}],
    "15 \u043c\u0438\u043d \u043d\u0430 \u0444\u043e\u0442\u043e + 15 \u043c\u0438\u043d \u043d\u0430 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0435."))
p.append(poi_card(7,3,"&#128674;","\u041a\u0420\u0423\u0418\u0417","Dunai haj&oacute;z&aacute;s","\u0414\u0443\u043d\u0430\u0439\u0441\u043a\u0438\u0439 \u043a\u0440\u0443\u0438\u0437","\u041f\u0430\u0440\u043b\u0430\u043c\u0435\u043d\u0442, \u043a\u0440\u0435\u043f\u043e\u0441\u0442\u044c, \u043c\u043e\u0441\u0442\u044b \u0441 \u0432\u043e\u0434\u044b. \u0420\u0435\u0447\u043d\u043e\u0439 \u0442\u0440\u0430\u043c\u0432\u0430\u0439 D11 (\u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e \u043f\u043e \u043f\u0440\u043e\u0435\u0437\u0434\u043d\u043e\u043c\u0443) \u0438\u043b\u0438 \u0442\u0443\u0440\u0438\u0441\u0442. \u043a\u0440\u0443\u0438\u0437 ~5 000 HUF/\u0447\u0435\u043b.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Vigad%C3%B3+t%C3%A9r+pier+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://www.legenda.hu/en"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Danube+cruise+Budapest&tbm=isch"}],
    "\u0412\u0438\u0434 \u043d\u0430 \u041f\u0430\u0440\u043b\u0430\u043c\u0435\u043d\u0442 \u0432 \u0437\u0430\u043a\u0430\u0442\u043d\u043e\u043c \u0441\u0432\u0435\u0442\u0435 \u2014 \u0437\u043e\u043b\u043e\u0442\u043e\u0439."))
p.append("    </div>\n\n")
p.append(plan_b("\u0417\u0430\u043f\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u0430\u043d \u2014 \u0414\u043e\u0436\u0434\u044c","\u0416/\u0434 \u043c\u0443\u0437\u0435\u0439 \u043e\u0442\u043a\u0440\u044b\u0442\u044b\u0439. Miniversum \u0438\u043b\u0438 Budapest Eye (\u043a\u0440\u044b\u0442\u044b\u0435 \u043a\u0430\u0431\u0438\u043d\u044b)."))
p.append(pricing([("\u0416/\u0434 \u043c\u0443\u0437\u0435\u0439","7 200","HUF"),("\u041e\u0431\u0435\u0434","12 000","HUF"),("\u041a\u0440\u0443\u0438\u0437","19 000","HUF"),("\u0423\u0436\u0438\u043d","18 000","HUF"),("\u0418\u0442\u043e\u0433\u043e","64 200","HUF (~161 EUR)")]))
p.append(day_end())

# DAY 8
p.append(day_start(8,"\u041f\u044f\u0442\u043d\u0438\u0446\u0430, 28 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026","&#128059; \u0414\u0435\u043d\u044c 8 \u2014 \u041c\u0435\u0434\u0432\u0435\u0434\u0438 + \u0411\u0443\u0434\u0430\u043a\u0435\u0441\u0438"))
for r in [("09:00",None,"&#128663; \u041f\u043e\u043b\u0443\u0447\u0435\u043d\u0438\u0435 \u0430\u0432\u0442\u043e",""),("10:15","#poi-day-8-1","&#128059; Medveotthon / \u041c\u0435\u0434\u0432\u0435\u0436\u044c\u044f \u0444\u0435\u0440\u043c\u0430","\u041c\u0435\u0434\u0432\u0435\u0434\u0438, \u0432\u043e\u043b\u043a\u0438, \u043b\u044c\u0432\u044b"),("12:30",None,"&#127869;&#65039; \u041f\u0438\u043a\u043d\u0438\u043a",""),("14:00","#poi-day-8-2","&#129420; Budakeszi Vadaspark / \u0411\u0443\u0434\u0430\u043a\u0435\u0441\u0438","\u041e\u043b\u0435\u043d\u0438, \u043a\u0430\u0431\u0430\u043d\u044b, \u0440\u044b\u0441\u0438"),("16:00",None,"&#128663; \u0412\u043e\u0437\u0432\u0440\u0430\u0449\u0435\u043d\u0438\u0435",""),("17:30",None,"&#127869;&#65039; \u0423\u0436\u0438\u043d","")]:
    p.append(sched_row(*r)+"\n")
p.append(day_mid("https://www.google.com/maps/dir/Budapest+city+center/Medveotthon+Veresegyh%C3%A1z/Budakeszi+Vadaspark/Budapest+city+center/"))
p.append(poi_card(8,1,"&#128059;","\u0417\u0410\u041f\u041e\u0412\u0415\u0414\u041d\u0418\u041a","Medveotthon","\u041c\u0435\u0434\u0432\u0435\u0436\u044c\u044f \u0444\u0435\u0440\u043c\u0430 \u0412\u0435\u0440\u0435\u0448\u0435\u0434\u044c\u0445\u0430\u0437","\u0415\u0434\u0438\u043d\u0441\u0442\u0432\u0435\u043d\u043d\u044b\u0439 \u043c\u0435\u0434\u0432\u0435\u0436\u0438\u0439 \u0437\u0430\u043f\u043e\u0432\u0435\u0434\u043d\u0438\u043a. 42 \u043c\u0435\u0434\u0432\u0435\u0434\u044f, 24 \u0432\u043e\u043b\u043a\u0430, 12 \u043b\u044c\u0432\u043e\u0432. \u041a\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0435 \u043c\u0451\u0434\u043e\u043c! \u0412\u0437\u0440\u043e\u0441\u043b\u044b\u0435 2 900, \u0434\u0435\u0442\u0438 2 400 HUF.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Medveotthon+Veresegyh%C3%A1z"},{"label":"\u0421\u0430\u0439\u0442","href":"https://medveotthon.hu/en/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Medveotthon+Veresegyh%C3%A1z&tbm=isch"}],
    "\u041c\u0451\u0434 ~800 HUF \u0432 \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u0435 \u043d\u0430 \u0432\u0445\u043e\u0434\u0435. \u041f\u0430\u0440\u043a\u043e\u0432\u043a\u0430 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0430\u044f."))
p.append(poi_card(8,2,"&#129420;","\u041b\u0415\u0421\u041d\u041e\u0419 \u0417\u041e\u041e\u041f\u0410\u0420\u041a","Budakeszi Vadaspark","\u0411\u0443\u0434\u0430\u043a\u0435\u0441\u0438","50+ \u0432\u0438\u0434\u043e\u0432: \u043e\u043b\u0435\u043d\u0438, \u043a\u0430\u0431\u0430\u043d\u044b, \u0440\u044b\u0441\u0438. \u041f\u0430\u0440\u043a \u0434\u0438\u043d\u043e\u0437\u0430\u0432\u0440\u043e\u0432, \u043a\u043e\u043d\u0442\u0430\u043a\u0442\u043d\u044b\u0439 \u0437\u043e\u043e\u043f\u0430\u0440\u043a. \u0412\u0437\u0440\u043e\u0441\u043b\u044b\u0435 2 300, \u0434\u0435\u0442\u0438 ~1 000 HUF.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Budakeszi+Vadaspark"},{"label":"\u0421\u0430\u0439\u0442","href":"https://budakeszivadaspark.hu/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Budakeszi+Vadaspark&tbm=isch"}],
    "\u041f\u043e\u0441\u043b\u0435 14:00 \u2014 \u0431\u043e\u043b\u044c\u0448\u0435 \u0442\u0435\u043d\u0438. \u0423\u0434\u043e\u0431\u043d\u0430\u044f \u043e\u0431\u0443\u0432\u044c."))
p.append("    </div>\n\n")
p.append(plan_b("\u0417\u0430\u043f\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u0430\u043d","\u0414\u0432\u043e\u0440\u0435\u0446 \u0413\u0451\u0434\u0451\u043b\u043b\u0451 (30 \u043c\u0438\u043d \u043d\u0430 H\u00c9V H8, \u0431\u0435\u0437 \u043c\u0430\u0448\u0438\u043d\u044b)."))
p.append(pricing([("\u0410\u0440\u0435\u043d\u0434\u0430 \u0430\u0432\u0442\u043e","12 000","HUF"),("\u041c\u0435\u0434\u0432\u0435\u0434\u0438","10 600","HUF"),("\u0411\u0443\u0434\u0430\u043a\u0435\u0441\u0438","6 600","HUF"),("\u041f\u0438\u043a\u043d\u0438\u043a+\u0443\u0436\u0438\u043d","21 000","HUF"),("\u0418\u0442\u043e\u0433\u043e","56 600","HUF (~142 EUR)")]))
p.append(day_end())

# DAY 9
p.append(day_start(9,"\u0421\u0443\u0431\u0431\u043e\u0442\u0430, 29 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026","&#129416; \u0414\u0435\u043d\u044c 9 \u2014 \u0410\u043a\u0443\u043b\u044b \u0438 \u0448\u043e\u043f\u043f\u0438\u043d\u0433"))
for r in [("10:00",None,"&#128663; \u0412\u044b\u0435\u0437\u0434","\u0410\u0432\u0442\u043e, 2-\u0439 \u0434\u0435\u043d\u044c"),("10:30","#poi-day-9-1","&#129416; Tropicarium / \u0422\u0440\u043e\u043f\u0438\u043a\u0430\u0440\u0438\u0443\u043c","\u0410\u043a\u0443\u043b\u044b, \u0441\u043a\u0430\u0442\u044b"),("12:30","#poi-day-9-2","&#127869;&#65039; Campona / \u0424\u0443\u0434-\u043a\u043e\u0440\u0442","\u041e\u0431\u0435\u0434 + \u0434\u0435\u0442\u0441\u043a\u0430\u044f \u0437\u043e\u043d\u0430"),("14:45","#poi-day-9-3","&#128722; Premier Outlet / \u0410\u0443\u0442\u043b\u0435\u0442","Nike, Adidas, Tommy"),("17:30",None,"&#128663; \u0412\u043e\u0437\u0432\u0440\u0430\u0442 \u0430\u0432\u0442\u043e",""),("18:30","#poi-day-9-4","&#127869;&#65039; IDE Pizzeria / \u041f\u0438\u0446\u0446\u0435\u0440\u0438\u044f \u0418\u0414\u0415","\u041f\u0438\u0446\u0446\u0430 + \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430"),("19:30",None,"&#128647; \u0412\u043e\u0437\u0432\u0440\u0430\u0449\u0435\u043d\u0438\u0435","")]:
    p.append(sched_row(*r)+"\n")
p.append(day_mid("https://www.google.com/maps/dir/Tropicarium+Budapest/Campona+Budapest/Premier+Outlet+Center+Biatorbágy/IDE+Pizzeria+Arany+János+Budapest/"))
p.append(poi_card(9,1,"&#129416;","\u0410\u041a\u0412\u0410\u0420\u0418\u0423\u041c","Tropicarium","\u0422\u0440\u043e\u043f\u0438\u043a\u0430\u0440\u0438\u0443\u043c","12-\u043c\u0435\u0442\u0440\u043e\u0432\u044b\u0439 \u0442\u043e\u043d\u043d\u0435\u043b\u044c \u043f\u043e\u0434 \u0430\u043a\u0443\u043b\u0430\u043c\u0438, \u043a\u043e\u043d\u0442\u0430\u043a\u0442\u043d\u044b\u0439 \u0431\u0430\u0441\u0441\u0435\u0439\u043d \u0441\u043e \u0441\u043a\u0430\u0442\u0430\u043c\u0438. \u0412\u0437\u0440\u043e\u0441\u043b\u044b\u0435 4 500, \u0434\u0435\u0442\u0438 3 200 HUF, \u0434\u043e 4 \u043b\u0435\u0442 \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Tropicarium+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://tropicarium.hu/en"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Tropicarium+Budapest&tbm=isch"}],
    "\u041f\u0440\u0438\u0435\u0437\u0436\u0430\u0439\u0442\u0435 \u043a 10:00. \u041f\u0430\u0440\u043a\u043e\u0432\u043a\u0430 \u0432 Campona \u0431\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u0430\u044f."))
p.append(poi_card(9,2,"&#127869;&#65039;","\u0415\u0414\u0410","Campona Food Court","\u0424\u0443\u0434-\u043a\u043e\u0440\u0442 + \u0434\u0435\u0442\u0441\u043a\u0430\u044f \u0437\u043e\u043d\u0430","15+ \u0440\u0435\u0441\u0442\u043e\u0440\u0430\u043d\u043e\u0432. \u041a\u0440\u044b\u0442\u0430\u044f \u0434\u0435\u0442\u0441\u043a\u0430\u044f \u0437\u043e\u043d\u0430: \u0433\u043e\u0440\u043a\u0438, \u043b\u0430\u0431\u0438\u0440\u0438\u043d\u0442. 2 500\u20134 000 HUF/\u0447\u0435\u043b.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Campona+Shopping+Center+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://www.campona.hu/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Campona+Budapest&tbm=isch"}],
    "\u0411\u044b\u0441\u0442\u0440\u044b\u0439 \u043e\u0431\u0435\u0434 + 30 \u043c\u0438\u043d \u0434\u0435\u0442\u0441\u043a\u043e\u0439 \u0437\u043e\u043d\u044b."))
p.append(poi_card(9,3,"&#128722;","\u0428\u041e\u041f\u041f\u0418\u041d\u0413","Premier Outlet Center","\u041f\u0440\u0435\u043c\u044c\u0435\u0440 \u0410\u0443\u0442\u043b\u0435\u0442","100+ \u043c\u0430\u0433\u0430\u0437\u0438\u043d\u043e\u0432, \u0441\u043a\u0438\u0434\u043a\u0438 30\u201370%. Nike, Adidas, Tommy, Calvin Klein, Boss.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Premier+Outlet+Center+Biatorbágy"},{"label":"\u0421\u0430\u0439\u0442","href":"https://www.premieroutlet.hu/"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Premier+Outlet+Center+Biatorbágy&tbm=isch"}],
    "\u041f\u043b\u0430\u043d\u0438\u0440\u0443\u0439\u0442\u0435 2,5\u20133 \u0447\u0430\u0441\u0430. \u0414\u0435\u0442\u0441\u043a\u0438\u0435 \u043a\u0440\u043e\u0441\u0441\u043e\u0432\u043a\u0438 \u043e\u0442 10 EUR!"))
p.append(poi_card(9,4,"&#127869;&#65039;","\u0420\u0415\u0421\u0422\u041e\u0420\u0410\u041d","IDE Pizzeria","\u041f\u0438\u0446\u0446\u0435\u0440\u0438\u044f \u0418\u0414\u0415","\u0422\u043e\u043d\u043a\u0430\u044f \u0440\u0438\u043c\u0441\u043a\u0430\u044f \u043f\u0438\u0446\u0446\u0430, \u0434\u0435\u0442\u0441\u043a\u0430\u044f \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430 \u043d\u0430 \u0442\u0435\u0440\u0440\u0430\u0441\u0435. 3 500\u20135 000 HUF/\u0447\u0435\u043b.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=IDE+Pizzeria+Arany+J%C3%A1nos+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://www.tripadvisor.com/Restaurant_Review-g274887-d25370345-Reviews-IDE_Pizza_Arany-Budapest_Central_Hungary.html"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=IDE+Pizzeria+Budapest&tbm=isch"}],
    "\u0421\u0443\u0431\u0431\u043e\u0442\u043d\u0438\u0439 \u0432\u0435\u0447\u0435\u0440 \u2014 \u043f\u0440\u0438\u0445\u043e\u0434\u0438\u0442\u0435 \u043a 18:30."))
p.append("    </div>\n\n")
p.append(plan_b("\u0417\u0430\u043f\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u0430\u043d","Arena Mall (\u043a\u0440\u0443\u043f\u043d\u0435\u0439\u0448\u0438\u0439 \u0422\u0426, \u0440\u044f\u0434\u043e\u043c \u0441 Keleti)."))
p.append(pricing([("\u0422\u0440\u043e\u043f\u0438\u043a\u0430\u0440\u0438\u0443\u043c","15 400","HUF"),("\u041e\u0431\u0435\u0434","12 000","HUF"),("\u0428\u043e\u043f\u043f\u0438\u043d\u0433","60 000","HUF"),("\u0423\u0436\u0438\u043d","20 000","HUF"),("\u0418\u0442\u043e\u0433\u043e","121 800","HUF (~305 EUR)")]))
p.append(day_end())

# DAY 10
p.append(day_start(10,"\u0412\u043e\u0441\u043a\u0440\u0435\u0441\u0435\u043d\u044c\u0435, 30 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026","&#127874; \u0414\u0435\u043d\u044c 10 \u2014 \u0414\u0435\u043d\u044c \u0440\u043e\u0436\u0434\u0435\u043d\u0438\u044f \u0418\u0442\u0430\u044f + \u0410\u043a\u0432\u0430\u043c\u0438\u0440"))
for r in [("08:30",None,"&#127874; \u041f\u043e\u0437\u0434\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435!","\u0418\u0442\u0430\u044e 4 \u0433\u043e\u0434\u0430!"),("09:30",None,"&#128661; \u0412\u044b\u0435\u0437\u0434 \u0432 Aquaworld","\u0422\u0430\u043a\u0441\u0438/Bolt"),("10:00","#poi-day-10-1","&#127754; Aquaworld / \u0410\u043a\u0432\u0430\u043c\u0438\u0440","\u0413\u043e\u0440\u043a\u0438, \u0432\u043e\u043b\u043d\u044b, \u0434\u0435\u0442\u0441\u043a\u0430\u044f \u0437\u043e\u043d\u0430"),("12:30",None,"&#127869;&#65039; \u041e\u0431\u0435\u0434 \u0432 Aquaworld",""),("16:30",None,"&#128661; \u0412\u043e\u0437\u0432\u0440\u0430\u0449\u0435\u043d\u0438\u0435",""),("18:00","#poi-day-10-2","&#127874; \u041f\u0440\u0430\u0437\u0434\u043d\u0438\u0447\u043d\u044b\u0439 \u0443\u0436\u0438\u043d","\u0422\u043e\u0440\u0442 + \u0440\u0435\u0441\u0442\u043e\u0440\u0430\u043d"),("19:30",None,"&#128647; \u0412\u043e\u0437\u0432\u0440\u0430\u0449\u0435\u043d\u0438\u0435","")]:
    p.append(sched_row(*r)+"\n")
p.append(day_mid("https://www.google.com/maps/dir/Budapest+city+center/Aquaworld+Resort+Budapest/Budapest+city+center/"))
p.append(poi_card(10,1,"&#127754;","\u0410\u041a\u0412\u0410\u041f\u0410\u0420\u041a","Aquaworld","\u0410\u043a\u0432\u0430\u043c\u0438\u0440 \u0411\u0443\u0434\u0430\u043f\u0435\u0448\u0442","17 \u0433\u043e\u0440\u043e\u043a, \u0432\u043e\u043b\u043d\u043e\u0432\u043e\u0439 \u0431\u0430\u0441\u0441\u0435\u0439\u043d, Bongo Kids Club. \u0418\u0442\u0430\u044e \u0441\u0435\u0433\u043e\u0434\u043d\u044f 4! \u0412\u0437\u0440\u043e\u0441\u043b\u044b\u0435 ~10 000, \u0434\u0435\u0442\u0438 ~7 500 HUF.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Aquaworld+Resort+Budapest"},{"label":"\u0421\u0430\u0439\u0442","href":"https://www.aquaworldresort.hu/en/aquaworld"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Aquaworld+Budapest&tbm=isch"}],
    "\u041f\u0440\u0438\u0435\u0437\u0436\u0430\u0439\u0442\u0435 \u043a 10:00. \u0417\u0430\u043a\u0430\u0436\u0438\u0442\u0435 \u0442\u043e\u0440\u0442 \u0437\u0430\u0440\u0430\u043d\u0435\u0435 (Auguszt \u0438\u043b\u0438 Szamos)."))
p.append(poi_card(10,2,"&#127874;","\u041f\u0420\u0410\u0417\u0414\u041d\u0418\u041a","","\u041f\u0440\u0430\u0437\u0434\u043d\u0438\u0447\u043d\u044b\u0439 \u0443\u0436\u0438\u043d","\u0422\u043e\u0440\u0442 \u0438\u0437 Auguszt Cukr&aacute;szda (\u0441 1870). \u0423\u0436\u0438\u043d \u0432 Menza \u0438\u043b\u0438 VakVarj&uacute;. Boldog sz&uuml;linapot!",
    [{"label":"Auguszt","href":"https://maps.google.com/?q=Auguszt+Cukr%C3%A1szda+F%C3%A9ny+utca+Budapest"},{"label":"Menza","href":"https://maps.google.com/?q=Menza+%C3%89tterem+Budapest"}],
    "\u0411\u0440\u043e\u043d\u0438\u0440\u0443\u0439\u0442\u0435 \u0437\u0430\u0440\u0430\u043d\u0435\u0435. 4 \u0441\u0432\u0435\u0447\u043a\u0438 \u043d\u0430 \u0442\u043e\u0440\u0442\u0435!"))
p.append("    </div>\n\n")
p.append(plan_b("\u0417\u0430\u043f\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u0430\u043d","Palatinus Strand (\u043f\u043e\u0432\u0442\u043e\u0440\u043d\u043e) \u0438\u043b\u0438 \u0412\u0430\u0440\u043e\u0448\u043b\u0438\u0433\u0435\u0442. \u0413\u043b\u0430\u0432\u043d\u043e\u0435 \u2014 \u0442\u043e\u0440\u0442 \u0432\u0435\u0447\u0435\u0440\u043e\u043c!"))
p.append(pricing([("Aquaworld","42 500","HUF"),("\u041e\u0431\u0435\u0434","15 000","HUF"),("\u0422\u0430\u043a\u0441\u0438","8 000","HUF"),("\u0422\u043e\u0440\u0442","8 000","HUF"),("\u0423\u0436\u0438\u043d","30 000","HUF"),("\u0418\u0442\u043e\u0433\u043e","103 500","HUF (~259 EUR)")]))
p.append(day_end())

# DAY 11
p.append(day_start(11,"\u041f\u043e\u043d\u0435\u0434\u0435\u043b\u044c\u043d\u0438\u043a, 31 \u0430\u0432\u0433\u0443\u0441\u0442\u0430 2026","&#9992;&#65039; \u0414\u0435\u043d\u044c 11 \u2014 \u041e\u0442\u044a\u0435\u0437\u0434"))
for r in [("08:00",None,"&#129523; \u0421\u0431\u043e\u0440\u044b","\u0423\u043f\u0430\u043a\u043e\u0432\u043a\u0430"),("08:30","#poi-day-11-2","&#128722; SPAR","\u0421\u043d\u044d\u043a\u0438, \u0441\u0443\u0432\u0435\u043d\u0438\u0440\u044b"),("09:00",None,"&#127869;&#65039; \u0417\u0430\u0432\u0442\u0440\u0430\u043a",""),("09:30","#poi-day-11-1","&#128663; \u0412\u044b\u0435\u0437\u0434 \u0432 \u0430\u044d\u0440\u043e\u043f\u043e\u0440\u0442","Bolt, ~35 \u043c\u0438\u043d"),("10:00",None,"&#9992;&#65039; \u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f",""),("11:55",None,"&#9992;&#65039; \u0412\u044b\u043b\u0435\u0442","")]:
    p.append(sched_row(*r)+"\n")
p.append(day_mid("https://www.google.com/maps/dir/Budapest+city+center/Budapest+Ferenc+Liszt+International+Airport/"))
p.append(poi_card(11,1,"&#129523;","\u041b\u041e\u0413\u0418\u0421\u0422\u0418\u041a\u0410","","\u0421\u0431\u043e\u0440\u044b \u0438 \u043f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0435 \u043f\u043e\u043a\u0443\u043f\u043a\u0438","\u0412\u044b\u043b\u0435\u0442 11:55. \u041f\u0430\u0441\u043f\u043e\u0440\u0442\u0430, \u0437\u0430\u0440\u044f\u0434\u043a\u0438, \u0438\u0433\u0440\u0443\u0448\u043a\u0438, \u0441\u0443\u0432\u0435\u043d\u0438\u0440\u044b, \u0444\u043e\u0440\u0438\u043d\u0442\u044b.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=Budapest+Ferenc+Liszt+International+Airport"},{"label":"\u0421\u0430\u0439\u0442 \u0430\u044d\u0440\u043e\u043f\u043e\u0440\u0442\u0430","href":"https://www.bud.hu/en"},{"label":"\u0424\u043e\u0442\u043e","href":"https://www.google.com/search?q=Budapest+Ferenc+Liszt+Airport+Terminal+2&tbm=isch"}],
    "Duty Free, \u043a\u0430\u0444\u0435 \u0438 \u0434\u0435\u0442\u0441\u043a\u0430\u044f \u0437\u043e\u043d\u0430 \u0437\u0430 \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e\u0441\u0442\u044c\u044e."))
p.append(poi_card(11,2,"&#128722;","\u041c\u0410\u0413\u0410\u0417\u0418\u041d","","\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u0438\u0439 SPAR","T&uacute;r&oacute; Rudi \u0438 Piros Arany \u2014 \u043b\u0443\u0447\u0448\u0438\u0435 \u0441\u0443\u0432\u0435\u043d\u0438\u0440\u044b.",
    [{"label":"Google Maps","href":"https://maps.google.com/?q=SPAR+Budapest+center"}],
    "T&uacute;r&oacute; Rudi \u2014 \u0434\u0435\u0442\u0438 \u043e\u0431\u043e\u0436\u0430\u044e\u0442!"))
p.append("    </div>\n\n")
p.append(plan_b("\u0417\u0430\u043f\u0430\u0441\u043d\u043e\u0439 \u043f\u043b\u0430\u043d \u2014 \u0417\u0430\u0434\u0435\u0440\u0436\u043a\u0430","SkyCourt Lounge (~30 EUR), Duty Free. \u0410\u0432\u0442\u043e\u0431\u0443\u0441 100E \u043f\u0440\u0438 3+ \u0447\u0430\u0441\u0430\u0445."))
p.append(pricing([("\u0417\u0430\u0432\u0442\u0440\u0430\u043a","6 000","HUF"),("SPAR","4 000","HUF"),("\u0422\u0440\u0430\u043d\u0441\u0444\u0435\u0440","12 000","HUF"),("\u0418\u0442\u043e\u0433\u043e","22 000","HUF (~55 EUR)")]))
p.append(day_end())

# BUDGET
p.append(f"""<section id="budget" class="mb-5">
  <h2 class="section-title">\u0411\u044e\u0434\u0436\u0435\u0442 \u043f\u043e\u0435\u0437\u0434\u043a\u0438</h2>
  <div class="itinerary-table-wrapper mb-4">
    <table class="itinerary-table">
      <thead><tr><th>\u0414\u0435\u043d\u044c</th><th>\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435</th><th>HUF</th><th>EUR</th></tr></thead>
      <tbody>
        <tr><td>0</td><td>\u041f\u0440\u0438\u043b\u0451\u0442</td><td>12 000</td><td>30,00</td></tr>
        <tr><td>1</td><td>\u041c\u0430\u0440\u0433\u0438\u0442-\u0441\u0438\u0433\u0435\u0442</td><td>39 400</td><td>99,00</td></tr>
        <tr><td>2</td><td>\u0412\u0430\u0440\u043e\u0448\u043b\u0438\u0433\u0435\u0442 / \u0417\u043e\u043e\u043f\u0430\u0440\u043a</td><td>54 100</td><td>137,00</td></tr>
        <tr><td>3</td><td>\u0411\u0443\u0434\u0430\u0439\u0441\u043a\u0438\u0435 \u0445\u043e\u043b\u043c\u044b</td><td>22 500</td><td>56,25</td></tr>
        <tr><td>4</td><td>\u041a\u0440\u0435\u043f\u043e\u0441\u0442\u044c + \u041f\u0435\u0449\u0435\u0440\u0430</td><td>47 600</td><td>119,50</td></tr>
        <tr><td>5</td><td>\u0414\u0432\u043e\u0440\u0435\u0446 \u0447\u0443\u0434\u0435\u0441</td><td>57 800</td><td>144,50</td></tr>
        <tr><td>6</td><td>\u0426\u0435\u043d\u0442\u0440 \u041f\u0435\u0448\u0442\u0430</td><td>54 600</td><td>136,50</td></tr>
        <tr><td>7</td><td>\u0416/\u0434 \u043c\u0443\u0437\u0435\u0439 + \u0414\u0443\u043d\u0430\u0439</td><td>64 200</td><td>160,50</td></tr>
        <tr><td>8</td><td>\u041c\u0435\u0434\u0432\u0435\u0434\u0438 + \u0411\u0443\u0434\u0430\u043a\u0435\u0441\u0438</td><td>56 600</td><td>141,50</td></tr>
        <tr><td>9</td><td>\u0422\u0440\u043e\u043f\u0438\u043a\u0430\u0440\u0438\u0443\u043c + \u0410\u0443\u0442\u043b\u0435\u0442</td><td>121 800</td><td>304,50</td></tr>
        <tr><td>10</td><td>\u0414\u0435\u043d\u044c \u0440\u043e\u0436\u0434\u0435\u043d\u0438\u044f + \u0410\u043a\u0432\u0430\u043c\u0438\u0440</td><td>103 500</td><td>258,75</td></tr>
        <tr><td>11</td><td>\u041e\u0442\u044a\u0435\u0437\u0434</td><td>22 000</td><td>55,00</td></tr>
        <tr style="font-weight:600;background-color:rgba(201,151,43,0.08)"><td></td><td><strong>\u0418\u0442\u043e\u0433\u043e</strong></td><td><strong>656 100</strong></td><td><strong>1 643,00</strong></td></tr>
      </tbody>
    </table>
  </div>
  <h3 class="section-title mt-4">\u041f\u043e \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f\u043c</h3>
  <div class="pricing-grid">
    <div class="pricing-cell"><div class="pricing-cell__label">\u0410\u0442\u0442\u0440\u0430\u043a\u0446\u0438\u043e\u043d\u044b</div><div class="pricing-cell__amount">178 000</div><div class="pricing-cell__currency">HUF (27%)</div></div>
    <div class="pricing-cell"><div class="pricing-cell__label">\u041f\u0438\u0442\u0430\u043d\u0438\u0435</div><div class="pricing-cell__amount">262 000</div><div class="pricing-cell__currency">HUF (40%)</div></div>
    <div class="pricing-cell"><div class="pricing-cell__label">\u0422\u0440\u0430\u043d\u0441\u043f\u043e\u0440\u0442</div><div class="pricing-cell__amount">96 100</div><div class="pricing-cell__currency">HUF (15%)</div></div>
    <div class="pricing-cell"><div class="pricing-cell__label">\u0428\u043e\u043f\u043f\u0438\u043d\u0433</div><div class="pricing-cell__amount">72 000</div><div class="pricing-cell__currency">HUF (11%)</div></div>
    <div class="pricing-cell"><div class="pricing-cell__label">\u0414\u0435\u043d\u044c \u0440\u043e\u0436\u0434\u0435\u043d\u0438\u044f</div><div class="pricing-cell__amount">10 000</div><div class="pricing-cell__currency">HUF (2%)</div></div>
    <div class="pricing-cell"><div class="pricing-cell__label">\u0421\u043d\u044d\u043a\u0438</div><div class="pricing-cell__amount">38 000</div><div class="pricing-cell__currency">HUF (6%)</div></div>
  </div>
  <div class="advisory advisory--info mt-4">
    {SVG_INFO}
    <div>
      <div class="advisory__title">\u041f\u0440\u0438\u043c\u0435\u0447\u0430\u043d\u0438\u044f \u043a \u0431\u044e\u0434\u0436\u0435\u0442\u0443</div>
      <div class="advisory__body">
        <strong>\u041a\u0443\u0440\u0441:</strong> 1 EUR &#8776; 400 HUF.<br>
        <strong>\u041d\u0415 \u0432\u043a\u043b\u044e\u0447\u0435\u043d\u043e:</strong> \u041f\u0440\u043e\u0436\u0438\u0432\u0430\u043d\u0438\u0435 \u0438 \u0430\u0432\u0438\u0430\u0431\u0438\u043b\u0435\u0442\u044b.<br>
        <strong>\u0428\u043e\u043f\u043f\u0438\u043d\u0433:</strong> Premier Outlet (60 000 HUF) \u2014 \u043f\u0435\u0440\u0435\u043c\u0435\u043d\u043d\u0430\u044f \u0441\u0442\u0430\u0442\u044c\u044f.<br>
        <strong>\u041d\u0430\u043b\u0438\u0447\u043d\u044b\u0435:</strong> \u0414\u0435\u0442\u0441\u043a\u0430\u044f \u0436/\u0434, \u0440\u044b\u043d\u043e\u0447\u043d\u044b\u0435 \u043f\u0440\u0438\u043b\u0430\u0432\u043a\u0438 \u2014 \u0442\u043e\u043b\u044c\u043a\u043e \u043d\u0430\u043b\u0438\u0447\u043d\u044b\u0435.
      </div>
    </div>
  </div>
</section>

</main>
</div>
</body>
</html>""")

out = "C:/VscodeProjects/Budapest/generated_trips/trip_2026-03-14_1054/trip_full_ru.html"
with open(out, "w", encoding="utf-8") as f:
    f.write("".join(p))
print(f"OK: {len(''.join(p))} chars written to {out}")
