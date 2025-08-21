import { DominoVariant } from "@/components/games/domino/types";
import { useTranslation } from "react-i18next";

const useDominoCategories = () => {
  const { t } = useTranslation();

  return [
    {
      variant: 'internacional' as DominoVariant,
      title: t('variants.internacional.title'),
      description: t('variants.internacional.description'),
    },
    {
      variant: 'cubano' as DominoVariant,
      title: t('variants.cubano.title'),
      description: t('variants.cubano.description'),
    },
    {
      variant: 'dominicano' as DominoVariant,
      title: t('variants.dominicano.title'),
      description: t('variants.dominicano.description'),
    },
    {
      variant: 'mexicano' as DominoVariant,
      title: t('variants.mexicano.title'),
      description: t('variants.mexicano.description'),
      disabled: true,
    }
  ];
};

export default useDominoCategories;
