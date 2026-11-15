export const ANSWERS_SESSION_KEY = "scheme-saathi-answers";

export const wizardSteps = [
  ["age", "gender"],
  ["state"],
  ["area", "income"],
  ["category", "occupation"],
  ["education", "disability"],
  ["maritalStatus", "ownsLand"],
  ["bpl"]
];

const answerFields = new Set([
  "age",
  "gender",
  "state",
  "area",
  "income",
  "category",
  "occupation",
  "education",
  "disability",
  "maritalStatus",
  "ownsLand",
  "bpl"
]);

function isValidSavedAnswers(value) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length === 0 ||
    Object.keys(value).some((field) => !answerFields.has(field))
  ) {
    return false;
  }

  const hasAnswer = Object.values(value).some(
    (answer) => answer !== null && answer !== ""
  );
  if (!hasAnswer) return false;

  return Object.entries(value).every(([field, answer]) => {
    if (field === "age") {
      return (
        answer === "" ||
        (Number.isInteger(answer) && answer >= 0 && answer <= 120)
      );
    }

    if (field === "income") {
      return (
        answer === "" ||
        answer === null ||
        (typeof answer === "number" && Number.isFinite(answer) && answer >= 0)
      );
    }

    if (["disability", "ownsLand", "bpl"].includes(field)) {
      return answer === null || typeof answer === "boolean";
    }

    return answer === null || typeof answer === "string";
  });
}

export function readSessionAnswers() {
  try {
    const stored = sessionStorage.getItem(ANSWERS_SESSION_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (isValidSavedAnswers(parsed)) return parsed;
    clearSessionAnswers();
    return null;
  } catch (error) {
    console.warn("Could not read saved eligibility answers; starting fresh.", error);
    clearSessionAnswers();
    return null;
  }
}

export function persistSessionAnswers(answers) {
  try {
    sessionStorage.setItem(ANSWERS_SESSION_KEY, JSON.stringify(answers));
  } catch (error) {
    console.warn("Could not save eligibility answers for this session.", error);
  }
}

export function clearSessionAnswers() {
  try {
    sessionStorage.removeItem(ANSWERS_SESSION_KEY);
  } catch (error) {
    console.warn("Could not clear saved eligibility answers.", error);
  }
}

export function validateWizardStep(stepIndex, answers) {
  const errors = {};
  const currentStep = wizardSteps[stepIndex] ?? [];

  if (currentStep.includes("age")) {
    if (answers.age === "" || answers.age === null || answers.age === undefined) {
      errors.age = "required";
    } else {
      const age = Number(answers.age);
      if (!Number.isInteger(age) || age < 0 || age > 120) {
        errors.age = "invalidAge";
      }
    }
  }

  for (const requiredField of ["state", "area", "income"]) {
    if (
      currentStep.includes(requiredField) &&
      (answers[requiredField] === "" ||
        answers[requiredField] === null ||
        answers[requiredField] === undefined)
    ) {
      errors[requiredField] =
        requiredField === "income" ? "invalidIncome" : "required";
    }
  }

  return errors;
}
