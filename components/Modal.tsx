import React from "react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "warning" | "danger" | "info";
}

const typeColors = {
  warning: {
    border: "border-amber-400/40",
    title: "text-amber-300",
    confirmBg: "bg-amber-400 hover:bg-amber-300 text-gray-900",
  },
  danger: {
    border: "border-red-400/40",
    title: "text-red-300",
    confirmBg: "bg-red-400 hover:bg-red-300 text-gray-900",
  },
  info: {
    border: "border-blue-400/40",
    title: "text-blue-300",
    confirmBg: "bg-blue-400 hover:bg-blue-300 text-gray-900",
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  type = "warning",
}) => {
  const colors = typeColors[type];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-gray-900 rounded-xl shadow-xl w-full max-w-xs sm:max-w-sm md:max-w-md text-center border ${colors.border} p-4 sm:p-6`}
      >
        <h2 className={`text-xl sm:text-2xl font-bold ${colors.title} mb-3 sm:mb-4`}>
          {title}
        </h2>
        <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            onClick={onConfirm}
            className={`${colors.confirmBg} font-bold py-2 px-4 rounded-lg transition-colors text-sm sm:text-base`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm sm:text-base"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};
