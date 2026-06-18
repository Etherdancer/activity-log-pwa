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
      "sunday": "Nedjelja"
    }
  },
  en: {
    translation: {
      "app_title": "Activity Log",
      "add_activity": "Add Activity",
      "now": "Now",
      "export_data": "Export Data",
      "export_failed": "Export failed",
      "import_data": "Import Data",
      "import_success": "Import successful!",
      "import_failed": "Import failed",
      "print": "Print",
      "users": "Users",
      "add_user": "New User",
      "first_name": "First Name",
      "last_name": "Last Name",
      "save": "Save",
      "cancel": "Cancel",
      "description": "Description",
      "time": "Time",
      "date": "Date",
      "week_of": "Week of",
      "monday": "Monday",
      "tuesday": "Tuesday",
      "wednesday": "Wednesday",
      "thursday": "Thursday",
      "friday": "Friday",
      "saturday": "Saturday",
      "sunday": "Sunday"
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
