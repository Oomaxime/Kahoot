import { useFieldArray, useForm, Controller } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";
import { motion, AnimatePresence } from "motion/react";
import { playClick } from "@shared-hooks/clickSound";
import type { QuizQuestion } from "@shared/index";

const QuestionSchema = v.object({
  id: v.string(),
  text: v.pipe(v.string(), v.minLength(1, "Question text required")),
  choices: v.tuple([
    v.pipe(v.string(), v.minLength(1, "Choice required")),
    v.pipe(v.string(), v.minLength(1, "Choice required")),
    v.pipe(v.string(), v.minLength(1, "Choice required")),
    v.pipe(v.string(), v.minLength(1, "Choice required")),
  ]),
  correctIndexes: v.pipe(
    v.array(v.number()),
    v.minLength(1, "Select at least one correct answer"),
  ),
  timerSec: v.pipe(v.number(), v.minValue(5), v.maxValue(120)),
});

const FormSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, "Title required")),
  questions: v.pipe(
    v.array(QuestionSchema),
    v.minLength(1, "Add at least one question"),
  ),
});

type FormValues = v.InferOutput<typeof FormSchema>;

interface CreateQuizProps {
  onSubmit: (title: string, questions: QuizQuestion[]) => void;
}

function newQuestion() {
  return {
    id: crypto.randomUUID(),
    text: "",
    choices: ["", "", "", ""] as [string, string, string, string],
    correctIndexes: [] as number[],
    timerSec: 30,
  };
}

const CHOICE_COLORS = [
  "var(--c-red)",
  "var(--c-blue)",
  "var(--c-amber)",
  "var(--c-green)",
];

function CreateQuiz({ onSubmit }: CreateQuizProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: valibotResolver(FormSchema),
    defaultValues: { title: "", questions: [newQuestion()] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  const onFormSubmit = (data: FormValues) => {
    playClick();
    onSubmit(data.title, data.questions as QuizQuestion[]);
  };

  return (
    <div
      className="phase-container"
      style={{ maxWidth: 700, textAlign: "left" }}
    >
      <motion.h1
        style={{ textAlign: "center" }}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Create Quiz
      </motion.h1>

      <form className="create-form" onSubmit={handleSubmit(onFormSubmit)}>
        <div className="form-group">
          <label>Quiz Title</label>
          <input
            {...register("title")}
            placeholder="My Awesome Quiz"
            autoFocus
          />
          {errors.title && (
            <span
              style={{
                color: "var(--status-err)",
                fontSize: "0.8rem",
                marginTop: "0.25rem",
                display: "block",
              }}
            >
              {errors.title.message}
            </span>
          )}
        </div>

        <AnimatePresence>
          {fields.map((field, qIdx) => {
            const qErrors = errors.questions?.[qIdx];
            return (
              <motion.div
                key={field.id}
                className="question-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
              >
                <div className="question-card-header">
                  <h3>Question {qIdx + 1}</h3>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => remove(qIdx)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>Question</label>
                  <input
                    {...register(`questions.${qIdx}.text`)}
                    placeholder="What is…?"
                  />
                  {qErrors?.text && (
                    <span
                      style={{
                        color: "var(--status-err)",
                        fontSize: "0.78rem",
                      }}
                    >
                      {qErrors.text.message}
                    </span>
                  )}
                </div>

                <div className="choices-inputs">
                  {([0, 1, 2, 3] as const).map((cIdx) => (
                    <div key={cIdx} className="choice-input-group">
                      <Controller
                        control={control}
                        name={`questions.${qIdx}.correctIndexes`}
                        render={({ field: f }) => (
                          <input
                            type="checkbox"
                            style={{ accentColor: CHOICE_COLORS[cIdx] }}
                            checked={(f.value as number[]).includes(cIdx)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...(f.value as number[]), cIdx]
                                : (f.value as number[]).filter(
                                    (i) => i !== cIdx,
                                  );
                              f.onChange(next);
                            }}
                          />
                        )}
                      />
                      <input
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        {...register(
                          `questions.${qIdx}.choices.${cIdx}` as any,
                        )}
                        placeholder={`Choice ${cIdx + 1}`}
                        style={{
                          borderLeft: `3px solid ${CHOICE_COLORS[cIdx]}`,
                        }}
                      />
                    </div>
                  ))}
                </div>
                {qErrors?.correctIndexes && (
                  <span
                    style={{ color: "var(--status-err)", fontSize: "0.78rem" }}
                  >
                    {qErrors.correctIndexes.message}
                  </span>
                )}

                <div
                  className="form-group"
                  style={{ marginTop: "0.75rem", maxWidth: 200 }}
                >
                  <label>Timer</label>
                  <select
                    {...register(`questions.${qIdx}.timerSec`, {
                      valueAsNumber: true,
                    })}
                  >
                    {[10, 20, 30, 45, 60, 90, 120].map((s) => (
                      <option key={s} value={s}>
                        {s} seconds
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <button
          type="button"
          className="btn-add-question"
          onClick={() => {
            playClick();
            append(newQuestion());
          }}
        >
          + Add Question
        </button>

        <motion.button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "0.75rem" }}
          whileTap={{ scale: 0.97, x: 3, y: 3 }}
        >
          Publish Quiz →
        </motion.button>
      </form>
    </div>
  );
}

export default CreateQuiz;
