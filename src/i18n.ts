import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
const resources = {
  hr: {
    translation: {
      "app_title": "Dnevnik Aktivnosti",
      "add_activity": "Dodaj Aktivnost",
      "now": "Sada",
      "export_data": "Izvezi Podatke",
      "export_failed": "Izvoz nije uspio",
      "import_data": "Uvezi Podatke",
      "import_success": "Uspješan uvoz!",
      "import_failed": "Uvoz nije uspio",
      "print": "Ispiši",
      "users": "Korisnici",
      "add_user": "Novi Korisnik",
      "first_name": "Ime",
      "last_name": "Prezime",
      "save": "Spremi",
      "cancel": "Odustani",
      "description": "Opis",
      "time": "Vrijeme",
      "date": "Datum",
      "week_of": "Tjedan od",
      "monday": "Ponedjeljak",
      "tuesday": "Utorak",
      "wednesday": "Srijeda",
      "thursday": "Četvrtak",
      "friday": "Petak",
      "saturday": "Subota",
      "sunday": "Nedjelja",
      "privacy_notice": "Ova aplikacija pohranjuje sve podatke isključivo lokalno na vašem uređaju. Ne prikupljamo, ne obrađujemo i ne šaljemo vaše podatke na nikakve poslužitelje ili trećim stranama. Vaši podaci se dijele isključivo kada vi eksplicitno koristite funkciju izvoza ili dijeljenja.",
      "privacy_accept": "Razumijem",
      "export_options_title": "Odaberite način izvoza",
      "export_type_link": "Podijeli putem brze poveznice",
      "export_type_file": "Spremi kao datoteku (.json)",
      "export_link_desc": "Najlakši način. Druga osoba samo treba kliknuti na poveznicu kako bi automatski uvezla podatke u svoju aplikaciju.",
      "export_file_desc": "Sigurnosna kopija. Druga osoba mora spremiti datoteku na svoj uređaj i ručno je učitati pomoću gumba za uvoz.",
      "generate_link": "Generiraj poveznicu",
      "generate_file": "Generiraj datoteku",
      "whatsapp_preview_warning": "Savjet: Kada zalijepite ovo u WhatsApp ili Viber, pričekajte nekoliko sekundi da se pojavi pregled aplikacije prije slanja, kako poveznica ne bi izgledala čudno!",
      "copy_link": "Kopiraj poveznicu",
      "share_link": "Podijeli poveznicu",
      "link_copied": "Poveznica kopirana!",
      "incoming_data_title": "Dolazni podaci",
      "incoming_data_desc": "Želite li uvesti Dnevnik Aktivnosti za korisnika",
      "import_now": "Uvezi odmah",
      "invalid_link": "Nevažeća poveznica. Podaci su oštećeni."
    }
  },
  en: {
    translation: {
      "app_title": "Activity Log",
      "add_activity": "Add Activity",
      "edit_activity": "Edit Activity",
      "delete_activity": "Delete Activity",
      "save": "Save",
      "cancel": "Cancel",
      "title": "Title",
      "description": "Description",
      "color": "Color",
      "users": "Users",
      "add_user": "Add User",
      "first_name": "First Name",
      "last_name": "Last Name",
      "create_user": "Create User",
      "welcome": "Welcome user, weekly calendar view coming soon",
      "now": "Now",
      "start_time": "Start Time",
      "end_time": "End Time",
      "print": "Print",
      "week_of": "Week of",
      "monday": "Monday",
      "tuesday": "Tuesday",
      "wednesday": "Wednesday",
      "thursday": "Thursday",
      "friday": "Friday",
      "saturday": "Saturday",
      "sunday": "Sunday",
      "export_data": "Export Data",
      "import_data": "Import Data",
      "export_failed": "Export failed",
      "import_success": "Import successful!",
      "import_failed": "Import failed",
      "privacy_notice": "This app stores all data locally on your device. We do not collect, process, or send your data to any servers or third parties. Data is only shared when you explicitly use the export/share function.",
      "privacy_accept": "I understand",
      "export_options_title": "Choose Export Method",
      "export_type_link": "Share via Quick Link",
      "export_type_file": "Save as File (.json)",
      "export_link_desc": "Easiest method. The other person just needs to tap the link to automatically import the data into their app.",
      "export_file_desc": "Manual backup. The other person must save the file to their device and manually upload it using the import button.",
      "generate_link": "Generate Link",
      "generate_file": "Generate File",
      "whatsapp_preview_warning": "Tip: When pasting this into WhatsApp or Viber, wait a few seconds for the app preview to appear before pressing send, so the link doesn't look weird!",
      "copy_link": "Copy Link",
      "share_link": "Share Link",
      "link_copied": "Link copied!",
      "incoming_data_title": "Incoming Data",
      "incoming_data_desc": "Would you like to import the Activity Log for user",
      "import_now": "Import Now",
      "invalid_link": "Invalid link. Data is corrupted."
    }
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: "hr", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
