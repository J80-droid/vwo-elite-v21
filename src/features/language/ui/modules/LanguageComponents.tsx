import { useTranslations } from "@shared/hooks/useTranslations";

export const ScenarioSidebar = () => {
  const { t } = useTranslations();
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
      <h3 className="text-white font-bold mb-2">
        {t("language.modules.scenarios")}
      </h3>
      <p className="text-sm text-slate-400">
        {t(
          "language.scenarios.sidebar_description",
          "Kies een scenario om te oefenen.",
        )}
      </p>
    </div>
  );
};

export const IdiomSidebar = () => {
  const { t } = useTranslations();
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
      <h3 className="text-white font-bold mb-2">
        {t("language.modules.idioms")}
      </h3>
      <p className="text-sm text-slate-400">
        {t(
          "language.idioms.sidebar_description",
          "Kies een taal en onderwerp.",
        )}
      </p>
    </div>
  );
};

export const SJTSidebar = () => {
  const { t } = useTranslations();
  return (
    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
      <h3 className="text-white font-bold mb-2">{t("language.modules.sjt")}</h3>
      <p className="text-sm text-slate-400">
        {t("language.sjt.sidebar_description", "Situational Judgement Tests.")}
      </p>
    </div>
  );
};
