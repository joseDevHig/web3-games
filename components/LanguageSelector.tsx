import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

const languages = [
  { code: "en", name: "English", flag: "fi fi-gb" },
  { code: "es", name: "Español", flag: "fi fi-es" },
  { code: "fr", name: "Français", flag: "fi fi-fr" },
  { code: "de", name: "Deutsch", flag: "fi fi-de" },
  { code: "tr", name: "Türkçe", flag: "fi fi-tr" },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState(
    localStorage.getItem("appLanguage") || i18n.language || "es"
  );
  const selectorRef = useRef<HTMLDivElement>(null);
  const [alignRight, setAlignRight] = useState(false);

  useEffect(() => {
    i18n.changeLanguage(selectedLang);
    localStorage.setItem("appLanguage", selectedLang);
  }, [selectedLang, i18n]);

  // Detecta si hay espacio suficiente para abrir a la derecha
  useEffect(() => {
    if (open && selectorRef.current) {
      const rect = selectorRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const dropdownWidth = 160; // igual a min-w-[160px]

      if (rect.left + dropdownWidth > viewportWidth) {
        setAlignRight(true); // abre hacia la izquierda
      } else {
        setAlignRight(false); // abre normal (hacia la derecha)
      }
    }
  }, [open]);

  // Cierra al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={selectorRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 flex items-center justify-center border border-gray-400 rounded-md bg-transparent hover:bg-gray-100 shadow-md transition"
      >
        <span
          className={languages.find((l) => l.code === selectedLang)?.flag}
        ></span>
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 min-w-[160px] border border-gray-300 rounded-md shadow-lg z-50 bg-white
          ${alignRight ? "right-0" : "left-0"}`}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setSelectedLang(lang.code);
                setOpen(false);
              }}
              className="group w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 text-left"
            >
              <span className={lang.flag}></span>
              <span className="text-gray-700 group-hover:text-amber-600">
                {lang.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
