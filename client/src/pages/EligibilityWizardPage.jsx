import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PageMeta from "../components/PageMeta.jsx";
import RequestError from "../components/RequestError.jsx";
import { matchQueryKey } from "../hooks/useMatchSchemes.js";
import { matchSchemes } from "../services/api.js";
import {
  clearSessionAnswers,
  persistSessionAnswers,
  readSessionAnswers,
  validateWizardStep,
  wizardSteps
} from "../utils/wizard.js";

const initialAnswers = {
  age: "",
  gender: null,
  state: "",
  area: "",
  income: "",
  category: null,
  occupation: null,
  education: null,
  disability: null,
  maritalStatus: null,
  ownsLand: null,
  bpl: null
};

function SelectField({ name, value, error, onChange, required }) {
  const { t } = useTranslation();
  const choiceName = ["disability", "ownsLand", "bpl"].includes(name)
    ? "yesNo"
    : name;
  const translatedOptions = t(
    name === "state" ? "states" : `choices.${choiceName}`,
    { returnObjects: true }
  );
  const options = Array.isArray(translatedOptions)
    ? translatedOptions.filter(
        (option) =>
          option &&
          typeof option.value === "string" &&
          typeof option.label === "string"
      )
    : [];
  const optional = !required;

  return (
    <div className="space-y-2">
      <label htmlFor={`answer-${name}`} className="block text-sm font-bold text-slate-900">
        {t(`questions.${name}`)}
        {required && <span aria-hidden="true" className="text-red-700"> *</span>}
      </label>
      <select
        id={`answer-${name}`}
        name={name}
        value={value ?? ""}
        required={required}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(
            name,
            nextValue === ""
              ? null
              : name === "income"
                ? Number(nextValue)
                : name === "disability" || name === "ownsLand" || name === "bpl"
                  ? nextValue === "true"
                  : nextValue
          );
        }}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `error-${name}` : undefined}
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
      >
        <option value="">
          {optional ? t("choices.preferNot") : t("choices.select")}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`error-${name}`} role="alert" className="text-sm font-semibold text-red-800">
          {t(`wizard.${error}`)}
        </p>
      )}
    </div>
  );
}

function AnswerField({ name, answers, errors, onChange }) {
  const { t } = useTranslation();
  const required = ["age", "state", "area", "income"].includes(name);
  if (name !== "age") {
    return (
      <SelectField
        name={name}
        value={answers[name]}
        error={errors[name]}
        onChange={onChange}
        required={required}
      />
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="answer-age" className="block text-sm font-bold text-slate-900">
        {t("questions.age")}
        <span aria-hidden="true" className="text-red-700"> *</span>
      </label>
      <input
        id="answer-age"
        name="age"
        type="number"
        required
        inputMode="numeric"
        min="0"
        max="120"
        step="1"
        value={answers.age}
        onChange={(event) =>
          onChange(
            "age",
            event.target.value === "" ? "" : Number(event.target.value)
          )
        }
        aria-invalid={Boolean(errors.age)}
        aria-describedby={errors.age ? "error-age" : "hint-age"}
        className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 shadow-sm focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
      />
      {errors.age ? (
        <p id="error-age" role="alert" className="text-sm font-semibold text-red-800">
          {t(`wizard.${errors.age}`)}
        </p>
      ) : (
        <p id="hint-age" className="text-sm text-slate-600">
          {t("wizard.ageHint")}
        </p>
      )}
    </div>
  );
}

export default function EligibilityWizardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState(() => ({
    ...initialAnswers,
    ...(readSessionAnswers() ?? {})
  }));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(false);
  const formRef = useRef(null);

  const fields = wizardSteps[step];
  useEffect(() => {
    formRef.current?.querySelector("input, select")?.focus();
  }, [step]);

  const mutation = useMutation({
    mutationFn: matchSchemes,
    onSuccess: (result, submittedAnswers) => {
      queryClient.setQueryData(matchQueryKey(submittedAnswers), result);
      navigate("/results");
    },
    onError: () => setSubmitError(true)
  });

  function updateAnswer(name, value) {
    const next = { ...answers, [name]: value };
    persistSessionAnswers(next);
    setAnswers(next);
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError(false);
  }

  function continueWizard() {
    const nextErrors = validateWizardStep(step, answers);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (step < wizardSteps.length - 1) setStep((current) => current + 1);
  }

  function startOver() {
    clearSessionAnswers();
    queryClient.removeQueries({ queryKey: ["match"] });
    setAnswers(initialAnswers);
    setErrors({});
    setSubmitError(false);
    setStep(0);
  }

  function submitAnswers(event) {
    event.preventDefault();
    const nextErrors = validateWizardStep(step, answers);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitError(false);
    const requestAnswers = {
      ...answers,
      age: Number(answers.age),
      income: Number(answers.income)
    };
    mutation.mutate(requestAnswers);
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-6">
        <Link
          to="/"
          className="text-sm font-bold text-teal-900 underline underline-offset-4"
        >
          {t("wizard.homeLink")}
        </Link>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
          {t("wizard.title")}
        </h1>
        <p className="mt-2 leading-6 text-slate-600">{t("wizard.intro")}</p>
        <PageMeta
          title={t("seo.checkTitle")}
          description={t("seo.checkDescription")}
        />
      </div>

      <div className="mb-5">
        <div className="mb-2 flex justify-between text-sm font-semibold text-slate-700">
          <span>
            {t("wizard.step")} {step + 1} {t("wizard.of")} {wizardSteps.length}
          </span>
          <span>{Math.round(((step + 1) / wizardSteps.length) * 100)}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={t("wizard.progress")}
          aria-valuemin={1}
          aria-valuemax={wizardSteps.length}
          aria-valuenow={step + 1}
          aria-valuetext={t("wizard.progressValue", {
            current: step + 1,
            total: wizardSteps.length
          })}
          className="h-2 overflow-hidden rounded-full bg-slate-200"
        >
          <div
            className="h-full rounded-full bg-teal-700 transition-all"
            style={{ width: `${((step + 1) / wizardSteps.length) * 100}%` }}
          />
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={submitAnswers}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {fields.map((name) => (
            <AnswerField
              key={name}
              name={name}
              answers={answers}
              errors={errors}
              onChange={updateAnswer}
            />
          ))}
        </div>
        {step === 2 && (
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {t("wizard.conservativeIncome")}
          </p>
        )}
        {submitError && (
          <div className="mt-5">
            <RequestError message={t("errors.submit")} />
          </div>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setStep((current) => Math.max(0, current - 1));
              }}
              disabled={step === 0 || mutation.isPending}
              className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("wizard.back")}
            </button>
            <button
              type="button"
              onClick={startOver}
              disabled={mutation.isPending}
              className="min-h-11 rounded-xl px-4 text-sm font-bold text-slate-600 underline underline-offset-4 hover:text-slate-950"
            >
              {t("wizard.startOver")}
            </button>
          </div>
          {step < wizardSteps.length - 1 ? (
            <button
              type="button"
              onClick={continueWizard}
              className="min-h-11 rounded-xl bg-teal-800 px-5 text-sm font-bold text-white hover:bg-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              {t("wizard.next")}
            </button>
          ) : (
            <button
              type="submit"
              disabled={mutation.isPending}
              className="min-h-11 rounded-xl bg-teal-800 px-5 text-sm font-bold text-white hover:bg-teal-900 disabled:cursor-wait disabled:opacity-70"
            >
              {mutation.isPending ? t("wizard.finding") : t("wizard.find")}
            </button>
          )}
        </div>
        <p className="mt-5 text-xs leading-5 text-slate-500">
          {t("wizard.privacy")}
        </p>
      </form>
    </section>
  );
}
