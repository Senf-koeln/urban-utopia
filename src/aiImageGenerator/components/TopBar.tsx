import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

const TopBar = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "de" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="fixed top-0 right-0 z-50 p-3 md:p-6 pointer-events-none">
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-1.5 px-3 py-1.5 md:gap-2 md:px-4 md:py-2 bg-white border-2 border-gray-900 rounded-lg hover:shadow-md transition-all pointer-events-auto cursor-pointer"
        title={
          i18n.language === "en" ? "Switch to German" : "Switch to English"
        }
      >
        <Globe className="w-4 h-4 md:w-5 md:h-5" />
        <span className="font-semibold text-xs md:text-sm">
          {i18n.language === "en" ? "EN" : "DE"}
        </span>
      </button>
    </div>
  );
};

export default TopBar;
