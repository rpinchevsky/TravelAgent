import { type Page, type Locator } from '@playwright/test';
/**
 * Page Object Model for the Trip HTML page.
 * Covers: header, navigation, day sections, POI cards, tables, budget.
 *
 * Language-independent: all selectors use CSS classes, IDs, or data attributes.
 * No text-based filtering in any language.
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
  readonly poiCardRatings: Locator;

  // --- Activity labels (itinerary tables) ---
  readonly activityLabels: Locator;
  readonly clickableActivityLabels: Locator;

  // --- Budget ---
  readonly budgetSection: Locator;

  // --- Accommodation ---
  readonly accommodationSections: Locator;
  readonly accommodationCards: Locator;
  readonly accommodationCardRatings: Locator;
  readonly bookingCtas: Locator;

  // --- Car Rental ---
  readonly carRentalSections: Locator;
  readonly carRentalCategories: Locator;
  readonly carRentalTables: Locator;
  readonly rentalCtas: Locator;

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
    this.poiCardRatings = page.locator('.poi-card__rating');

    // Activity labels
    this.activityLabels = page.locator('.activity-label');
    this.clickableActivityLabels = page.locator('a.activity-label[href^="#poi-day-"]');

    // Budget
    this.budgetSection = page.locator('#budget');

    // Accommodation
    this.accommodationSections = page.locator('.accommodation-section');
    this.accommodationCards = page.locator('.accommodation-card');
    this.accommodationCardRatings = page.locator('.accommodation-card__rating');
    this.bookingCtas = page.locator('.booking-cta');

    // Car Rental
    this.carRentalSections = page.locator('.car-rental-section');
    this.carRentalCategories = page.locator('.car-rental-category');
    this.carRentalTables = page.locator('.car-rental-table');
    this.rentalCtas = page.locator('.rental-cta');

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
    return this.page.locator(`#day-${dayNumber} .advisory--info[data-section-type="plan-b"]`);
  }

  getDayLogistics(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} .advisory--info[data-section-type="logistics"]`);
  }

  getDayPricingTable(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} .pricing-grid`);
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

  getPoiCardPhoneLink(poiCard: Locator): Locator {
    return poiCard.locator('.poi-card__link[href^="tel:"]');
  }

  getPoiCardRating(poiCard: Locator): Locator {
    return poiCard.locator('.poi-card__rating');
  }

  getPoiCardAccessibleBadge(poiCard: Locator): Locator {
    return poiCard.locator('.poi-card__accessible');
  }

  // --- Accommodation helpers ---

  getAccommodationSection(): Locator {
    return this.page.locator('#accommodation');
  }

  getAccommodationCards(): Locator {
    return this.page.locator('#accommodation .accommodation-card');
  }

  getAccommodationCardName(card: Locator): Locator {
    return card.locator('.accommodation-card__name');
  }

  getAccommodationCardRating(card: Locator): Locator {
    return card.locator('.accommodation-card__rating');
  }

  getAccommodationCardBookingCta(card: Locator): Locator {
    return card.locator('.booking-cta');
  }

  getAccommodationCardPriceLevel(card: Locator): Locator {
    return card.locator('.accommodation-card__price-level');
  }

  getAccommodationCardTag(card: Locator): Locator {
    return card.locator('.accommodation-card__tag');
  }

  getAccommodationCardLinks(card: Locator): Locator {
    return card.locator('.accommodation-card__link');
  }

  getAccommodationCardProTip(card: Locator): Locator {
    return card.locator('.pro-tip');
  }

  // --- Car Rental helpers ---

  getCarRentalSection(): Locator {
    return this.page.locator('#car-rental');
  }

  getCarRentalCategories(): Locator {
    return this.page.locator('#car-rental .car-rental-category');
  }

  getCarRentalCategoryTitle(cat: Locator): Locator {
    return cat.locator('.car-rental-category__title');
  }

  getCarRentalCategoryTable(cat: Locator): Locator {
    return cat.locator('.car-rental-table');
  }

  getCarRentalTableRows(table: Locator): Locator {
    return table.locator('tbody tr');
  }

  getCarRentalTableHeaderCells(table: Locator): Locator {
    return table.locator('thead th');
  }

  getCarRentalCategoryEstimate(cat: Locator): Locator {
    return cat.locator('.car-rental-category__estimate');
  }

  getCarRentalCategoryRecommendation(cat: Locator): Locator {
    return cat.locator('.car-rental-category__recommendation');
  }

  getRentalCtas(): Locator {
    return this.page.locator('#car-rental .rental-cta');
  }

  getCarRentalProTip(section: Locator): Locator {
    return section.locator('.pro-tip');
  }
}
