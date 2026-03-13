import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Trip HTML page.
 * Covers: header, navigation, day sections, POI cards, tables, budget.
 */
export class TripPage {
  readonly page: Page;

  // --- Header ---
  readonly pageTitle: Locator;
  readonly pageSubtitle: Locator;
  readonly holidayAdvisory: Locator;
  readonly holidayAdvisoryTitle: Locator;

  // --- Sidebar (desktop) ---
  readonly sidebar: Locator;
  readonly sidebarLinks: Locator;
  readonly sidebarActiveLink: Locator;

  // --- Mobile Nav ---
  readonly mobileNav: Locator;
  readonly mobilePills: Locator;
  readonly mobileActivePill: Locator;

  // --- Main content ---
  readonly mainContent: Locator;

  // --- Overview ---
  readonly overviewSection: Locator;
  readonly overviewTable: Locator;
  readonly overviewTableRows: Locator;

  // --- Day sections ---
  readonly daySections: Locator;
  readonly dayCards: Locator;
  readonly dayBanners: Locator;

  // --- POI cards ---
  readonly poiCards: Locator;

  // --- Activity labels (itinerary tables) ---
  readonly activityLabels: Locator;
  readonly clickableActivityLabels: Locator;

  // --- Budget ---
  readonly budgetSection: Locator;

  // --- Inline styles ---
  readonly inlineStyle: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header
    this.pageTitle = page.locator('h1.page-title');
    this.pageSubtitle = page.locator('p.page-subtitle');
    this.holidayAdvisory = page.locator('.advisory--warning');
    this.holidayAdvisoryTitle = page.locator('.advisory--warning .advisory__title');

    // Sidebar
    this.sidebar = page.locator('aside.sidebar');
    this.sidebarLinks = page.locator('.sidebar__nav .sidebar__link');
    this.sidebarActiveLink = page.locator('.sidebar__link.is-active');

    // Mobile nav
    this.mobileNav = page.locator('nav.mobile-nav');
    this.mobilePills = page.locator('.mobile-nav__scroll .mobile-nav__pill');
    this.mobileActivePill = page.locator('.mobile-nav__pill.is-active');

    // Main content
    this.mainContent = page.locator('#main-content');

    // Overview
    this.overviewSection = page.locator('#overview');
    this.overviewTable = page.locator('#overview .itinerary-table');
    this.overviewTableRows = page.locator('#overview .itinerary-table tbody tr');

    // Days
    this.daySections = page.locator('.day-card[id^="day-"]');
    this.dayCards = page.locator('.day-card');
    this.dayBanners = page.locator('.day-card__banner');

    // POI
    this.poiCards = page.locator('.poi-card');

    // Activity labels
    this.activityLabels = page.locator('.activity-label');
    this.clickableActivityLabels = page.locator('a.activity-label[href^="#poi-day-"]');

    // Budget
    this.budgetSection = page.locator('#budget');

    // Inline style
    this.inlineStyle = page.locator('head style');
  }

  async goto() {
    await this.page.goto(this.page.context().browser()?.version() ? '' : '');
    // For file:// protocol, we use baseURL from config
    await this.page.goto('');
  }

  getDaySection(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber}`);
  }

  getDayBannerTitle(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} .day-card__banner-title`);
  }

  getDayBannerDate(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} .day-card__banner-date`);
  }

  getDayItineraryTable(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} .itinerary-table-wrapper .itinerary-table`).first();
  }

  getDayItineraryRows(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} .itinerary-table-wrapper`).first().locator('.itinerary-table tbody tr');
  }

  getDayPoiCards(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} .poi-card`);
  }

  getDayPlanB(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} .advisory--info`);
  }

  getDayLogistics(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} .advisory--info`).filter({ hasText: 'Логистика' });
  }

  getDayPricingTable(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} .itinerary-table`).last();
  }

  getPoiCardLinks(poiCard: Locator): Locator {
    return poiCard.locator('.poi-card__link');
  }

  getPoiCardName(poiCard: Locator): Locator {
    return poiCard.locator('.poi-card__name');
  }

  getPoiCardProTip(poiCard: Locator): Locator {
    return poiCard.locator('.pro-tip');
  }

  getDayActivityLabels(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} .activity-label`);
  }

  getDayClickableActivityLabels(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} a.activity-label[href^="#poi-day-"]`);
  }

  getDayPoiCardById(dayNumber: number, poiIndex: number): Locator {
    return this.page.locator(`#poi-day-${dayNumber}-${poiIndex}`);
  }

  getAllSvgs(): Locator {
    return this.page.locator('svg');
  }
}
