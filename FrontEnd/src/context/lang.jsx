import { createContext, useContext } from 'react';

const shared = {
  msgTemplateBn: (name, amt, shop, owner, ph, ledgerLink = '') =>
    `প্রিয় ${name},\n\n${shop} এ আপনার বাকি আছে *₹${amt}*।\n\nদয়া করে যত দ্রুত সম্ভব পরিশোধ করুন।\n\nআপনার লেজার / PDF দেখুন বা ডাউনলোড করুন:\n${ledgerLink || '{ledgerLink}'}\n\nধন্যবাদ,\n${owner}\n${ph}`,
  msgTemplateEn: (name, amt, shop, owner, ph, ledgerLink = '') =>
    `Dear ${name},\n\nYour outstanding balance at ${shop} is *₹${amt}*.\n\nKindly clear your dues at the earliest.\n\nView / download your ledger PDF:\n${ledgerLink || '{ledgerLink}'}\n\nThank you,\n${owner}\n${ph}`,
};

export const DEFAULT_MESSAGE_EN =
  'Dear {name},\n\nYour outstanding balance at {shop} is *{amount}*.\n\nKindly clear your dues at the earliest.\n\nView / download your ledger PDF:\n{ledgerLink}\n\nThank you,\n{owner}\n{phone}';

export const DEFAULT_MESSAGE_BN =
  'প্রিয় {name},\n\n{shop} এ আপনার বাকি আছে *{amount}*।\n\nদয়া করে যত দ্রুত সম্ভব পরিশোধ করুন।\n\nআপনার লেজার / PDF দেখুন বা ডাউনলোড করুন:\n{ledgerLink}\n\nধন্যবাদ,\n{owner}\n{phone}';

/** Fill {name} {amount} {shop} {owner} {phone} {ledgerLink} placeholders in a saved template. */
export function fillReminderTemplate(template, { name, amount, shop, owner, phone, ledgerLink }) {
  return String(template || '')
    .replaceAll('{name}', name ?? '')
    .replaceAll('{amount}', amount ?? '')
    .replaceAll('{shop}', shop ?? '')
    .replaceAll('{owner}', owner ?? '')
    .replaceAll('{phone}', phone ?? '')
    .replaceAll('{ledgerLink}', ledgerLink ?? '');
}

export function buildReminderMessage({ lang, shopInfo, t, name, amount, ledgerLink = '' }) {
  const shop = (shopInfo?.brandName || shopInfo?.shopName || 'Your Shop').trim();
  const owner = (shopInfo?.quickSignature || shopInfo?.ownerName || 'Shop Owner').trim();
  const phone = (shopInfo?.shopPhone || '').trim() || 'XXXXXXXXXX';
  const amt = typeof amount === 'number'
    ? `₹${Math.abs(Math.round(amount)).toLocaleString('en-IN')}`
    : String(amount || '');
  const link = String(ledgerLink || '').trim();

  const customTpl = lang === 'bn'
    ? (shopInfo?.messageBn || '').trim()
    : (shopInfo?.messageEn || '').trim();

  let message;
  if (customTpl) {
    // Older saved templates may omit {ledgerLink} — still inject it.
    const withLinkPlaceholder = customTpl.includes('{ledgerLink}')
      ? customTpl
      : `${customTpl}\n\n${lang === 'bn' ? 'আপনার লেজার / PDF দেখুন বা ডাউনলোড করুন:' : 'View / download your ledger PDF:'}\n{ledgerLink}`;
    message = fillReminderTemplate(withLinkPlaceholder, { name, amount: amt, shop, owner, phone, ledgerLink: link });
  } else {
    const fn = lang === 'bn' ? t.msgTemplateBn : t.msgTemplateEn;
    const plainAmt = typeof amount === 'number'
      ? Math.abs(Math.round(amount)).toLocaleString('en-IN')
      : String(amount || '').replace(/^₹/, '');
    message = fn(name, plainAmt, shop, owner, phone, link);
  }

  if (link && !message.includes(link)) {
    const label = lang === 'bn'
      ? 'আপনার লেজার / PDF দেখুন বা ডাউনলোড করুন:'
      : 'View / download your ledger PDF:';
    message = `${message}\n\n${label}\n${link}`;
  }

  // Never leave the raw placeholder in the shared WhatsApp/SMS text
  message = message.replaceAll('{ledgerLink}', link);

  return message;
}

export const T = {
  en: {
    ...shared,
    appName: 'KhataApp', appSub: 'Manage Better. Grow Faster.',
    dashboard: 'Dashboard', home: 'Home', customers: 'Customers', reminders: 'Reminders', settings: 'Settings',
    totalDue: 'Total Due', todaySales: "Today's Sales", todayCollection: "Today's Collection",
    customersPending: 'customers pending', creditToday: 'Credit given today', paymentReceived: 'Payments received',
    totalCustomers: 'Total Customers', withDues: 'With Dues', settled: 'Settled',
    helloOwner: 'Hello, Shop Owner', dailyOverview: "Here's your daily overview",
    addCustomer: 'Add Customer', addEntry: 'Add Entry', pickCustomer: 'Pick a customer first',
    recentActivity: 'Recent Activity', viewAll: 'View All →',
    search: 'Search by name or phone...', all: 'All', due: 'Due', clear: 'Clear', advance: 'Advance',
    newCustomer: 'New Customer', page: 'Page', of: 'of', prev: 'Prev', next: 'Next',
    totalDueLabel: 'Total Due', accountSettled: 'Account Settled', advanceBalance: 'Advance Balance',
    creditAdded: 'Credit (Due Added)', paymentRecorded: 'Payment Received',
    newEntryFor: 'New entry for', credit: 'Credit (Due)', debit: 'Debit (Paid)',
    amount: 'Amount', note: 'Note (optional)',     notePlaceholder: 'e.g. Monthly bill, Order #12...',
    addCredit: 'Add Credit Entry', recordPayment: 'Record Payment',
    validAmount: 'Please enter a valid amount', addedAsDue: 'will be added as due on customer', recordedAsPayment: 'will be recorded as payment received',
    fullName: 'Full Name *', phone: 'Phone Number', area: 'Area / Address',
    namePlaceholder: 'e.g. Rajan Kumar', phonePlaceholder: '10 digit mobile', areaPlaceholder: 'e.g. Main Market',
    saveCustomer: 'Save Customer',
    noTransactions: 'No transactions yet', firstEntry: 'Tap "Add Entry" to record the first', noCustomers: 'No customers found',
    sendReminder: 'Send Reminder', reminderTitle: 'Payment Reminder', reminderDesc: 'Remind customer about outstanding due',
    messagePreview: 'Message Preview', sendViaWhatsApp: 'Send via WhatsApp', sendViaSMS: 'Send SMS',
    copyMessage: 'Copy Message', copied: 'Copied',
    language: 'Language', messageLanguage: 'Message Language', customMessage: 'Write custom message', useTemplate: 'Use template',
    lastReminded: 'Last reminded', daysAgo: 'days ago', today: 'Today', neverReminded: 'Never reminded',
    allDueCustomers: 'All Due Customers', sortByDue: 'Sort by amount', sortByName: 'Sort by name', sortByDate: 'Sort by date',
    noDueCustomers: 'No pending dues! 🎉', noDueDesc: 'All customers have settled',
    settingsTitle: 'Settings', shopInfo: 'Shop Information', shopName: 'Shop Name', ownerName: 'Owner Name',
    shopPhone: 'Shop Phone', shopAddress: 'Shop Address', appLanguage: 'App Language',
    bengali: 'Bengali', english: 'English', saveSettings: 'Save Settings', saved: 'Saved',
    reminderSent: 'Reminder marked as sent',
    preferences: 'Preferences',
    reminderMessages: 'Reminder messages',
    reminderMessagesHint: 'These become the default WhatsApp/SMS templates. Use: {name}, {amount}, {shop}, {owner}, {phone}, {ledgerLink}',
    defaultMsgLang: 'Default reminder language',
    englishTemplate: 'English template',
    bengaliTemplate: 'Bengali template',
    savePreferences: 'Save preferences',
    preferencesSaved: 'Preferences saved',
    editProfile: 'Edit profile',
    shopProfile: 'Shop profile',
    shopProfileSub: 'View and update your shop details',
  },
  bn: {
    ...shared,
    appName: 'KhataApp', appSub: 'Manage Better. Grow Faster.',
    dashboard: 'ড্যাশবোর্ড', home: 'হোম', customers: 'গ্রাহক', reminders: 'রিমাইন্ডার', settings: 'সেটিংস',
    totalDue: 'মোট বাকি', todaySales: 'আজকের বিক্রি', todayCollection: 'আজকের আদায়',
    customersPending: 'গ্রাহকের বাকি', creditToday: 'আজকের বাকি', paymentReceived: 'পেমেন্ট পাওয়া গেছে',
    totalCustomers: 'মোট গ্রাহক', withDues: 'বাকি আছে', settled: 'পরিশোধিত',
    helloOwner: 'নমস্কার', dailyOverview: 'আজকের সারসংক্ষেপ',
    addCustomer: 'নতুন গ্রাহক', addEntry: 'এন্ট্রি যোগ', pickCustomer: 'আগে গ্রাহক বেছে নিন',
    recentActivity: 'সাম্প্রতিক কাজ', viewAll: 'সব দেখুন →',
    search: 'নাম বা ফোন দিয়ে খুঁজুন...', all: 'সব', due: 'বাকি', clear: 'ক্লিয়ার', advance: 'অগ্রিম',
    newCustomer: 'নতুন গ্রাহক', page: 'পৃষ্ঠা', of: 'এর', prev: 'আগে', next: 'পরের',
    totalDueLabel: 'মোট বাকি', accountSettled: 'হিসাব মেলেছে', advanceBalance: 'অগ্রিম ব্যালেন্স',
    creditAdded: 'বাকি যোগ', paymentRecorded: 'পেমেন্ট রেকর্ড',
    newEntryFor: 'নতুন এন্ট্রি', credit: 'বাকি (ক্রেডিট)', debit: 'জমা (ডেবিট)',
    amount: 'পরিমাণ', note: 'নোট (ঐচ্ছিক)', notePlaceholder: 'যেমন: মাসিক ওষুধ...',
    addCredit: 'বাকি যোগ করুন', recordPayment: 'পেমেন্ট রেকর্ড',
    validAmount: 'সঠিক পরিমাণ লিখুন', addedAsDue: 'গ্রাহকের বাকি হিসেবে যোগ হবে', recordedAsPayment: 'পেমেন্ট হিসেবে রেকর্ড হবে',
    fullName: 'পূর্ণ নাম *', phone: 'ফোন নম্বর', area: 'এলাকা / ঠিকানা',
    namePlaceholder: 'যেমন: রাজন কুমার', phonePlaceholder: 'যেমন: ৯৮৭৬৫৪৩২১০', areaPlaceholder: 'যেমন: মেইন মার্কেট',
    saveCustomer: 'গ্রাহক সেভ',
    noTransactions: 'এখনও কোনো লেনদেন নেই', firstEntry: 'প্রথম এন্ট্রি রেকর্ড করতে "এন্ট্রি যোগ" চাপুন', noCustomers: 'কোনো গ্রাহক পাওয়া যায়নি',
    sendReminder: 'রিমাইন্ডার পাঠান', reminderTitle: 'পেমেন্ট রিমাইন্ডার', reminderDesc: 'বাকি সম্পর্কে গ্রাহককে মনে করিয়ে দিন',
    messagePreview: 'মেসেজ প্রিভিউ', sendViaWhatsApp: 'WhatsApp এ পাঠান', sendViaSMS: 'SMS পাঠান',
    copyMessage: 'মেসেজ কপি', copied: 'কপি হয়েছে',
    language: 'ভাষা', messageLanguage: 'মেসেজের ভাষা', customMessage: 'কাস্টম মেসেজ', useTemplate: 'টেমপ্লেট ব্যবহার',
    lastReminded: 'শেষ রিমাইন্ডার', daysAgo: 'দিন আগে', today: 'আজ', neverReminded: 'কখনও পাঠানো হয়নি',
    allDueCustomers: 'সব বাকি গ্রাহক', sortByDue: 'পরিমাণ অনুসারে', sortByName: 'নাম অনুসারে', sortByDate: 'তারিখ অনুসারে',
    noDueCustomers: 'কোনো বাকি নেই! 🎉', noDueDesc: 'সব গ্রাহকের হিসাব পরিশোধিত',
    settingsTitle: 'সেটিংস', shopInfo: 'দোকানের তথ্য', shopName: 'দোকানের নাম', ownerName: 'মালিকের নাম',
    shopPhone: 'দোকানের ফোন', shopAddress: 'ঠিকানা', appLanguage: 'অ্যাপের ভাষা',
    bengali: 'বাংলা', english: 'ইংরেজি', saveSettings: 'সেভ করুন', saved: 'সেভ হয়েছে',
    reminderSent: 'রিমাইন্ডার পাঠানো হিসেবে চিহ্নিত',
    preferences: 'পছন্দসমূহ',
    reminderMessages: 'রিমাইন্ডার মেসেজ',
    reminderMessagesHint: 'সেভ করলে এটিই ডিফল্ট WhatsApp/SMS টেমপ্লেট হবে। ব্যবহার করুন: {name}, {amount}, {shop}, {owner}, {phone}, {ledgerLink}',
    defaultMsgLang: 'ডিফল্ট রিমাইন্ডার ভাষা',
    englishTemplate: 'ইংরেজি টেমপ্লেট',
    bengaliTemplate: 'বাংলা টেমপ্লেট',
    savePreferences: 'পছন্দ সেভ করুন',
    preferencesSaved: 'পছন্দ সেভ হয়েছে',
    editProfile: 'প্রোফাইল এডিট',
    shopProfile: 'দোকান প্রোফাইল',
    shopProfileSub: 'দোকানের তথ্য দেখুন ও আপডেট করুন',
  },
};

export const LangCtx = createContext('en');
export const useLang = () => {
  const l = useContext(LangCtx);
  return T[l] || T.en;
};
