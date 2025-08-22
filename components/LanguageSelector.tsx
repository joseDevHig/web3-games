import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", name: "English", flag: "fi fi-gb" },
  { code: "es", name: "Español", flag: "fi fi-es" },
  { code: "fr", name: "Français", flag: "fi fi-fr" },
  { code: "de", name: "Deutsch", flag: "fi fi-de" },
  // { code: "it", name: "Italiano", flag: "fi fi-it" },
  { code: "tr", name: "Türkçe", flag: "fi fi-tr" },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(
    localStorage.getItem("appLanguage") || i18n.language || "es"
  );
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    i18n.changeLanguage(selectedLang);
    localStorage.setItem("appLanguage", selectedLang);
  }, [selectedLang, i18n]);

  // Cierra cuando haces click afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className="absolute top-4 right-4 z-50"
      ref={selectorRef}
    >
     
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 flex items-center justify-center border border-gray-400 rounded-md bg-transparent hover:bg-gray-100 shadow-md transition"
      >
        <span className={languages.find(l => l.code === selectedLang)?.flag}></span>
      </button>

     
      {open && (
        <div className="mt-2 w-40 bg-transparent border border-gray-300 rounded-md shadow-lg">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setSelectedLang(lang.code);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left"
            >
              <span className={lang.flag}></span>
              <span>{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
