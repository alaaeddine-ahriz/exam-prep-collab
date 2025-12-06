"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  TextArea,
  Icon,
  SegmentedControl,
  ProtectedRoute,
} from "../components";
import { useApp } from "../context/AppContext";
import { QuestionType } from "../lib/services/types";

function AddQuestionPageContent() {
  const router = useRouter();
  const { addQuestion, currentUserName } = useApp();
  
  const [questionType, setQuestionType] = useState<QuestionType>("mcq");
  const [questionText, setQuestionText] = useState("");
  const [options, setOptions] = useState([
    { id: "a", text: "" },
    { id: "b", text: "" },
    { id: "c", text: "" },
    { id: "d", text: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddOption = () => {
    const nextId = String.fromCharCode(97 + options.length); // a, b, c, d, e...
    setOptions([...options, { id: nextId, text: "" }]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      // Remove the option and recalculate IDs to avoid duplicates
      const newOptions = options
        .filter((_, i) => i !== index)
        .map((opt, i) => ({ ...opt, id: String.fromCharCode(97 + i) }));
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text };
    setOptions(newOptions);
  };

  const canSubmit = () => {
    if (!questionText.trim()) return false;
    if (questionType === "mcq") {
      const filledOptions = options.filter((opt) => opt.text.trim());
      return filledOptions.length >= 2;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (questionType === "mcq") {
        const validOptions = options
          .filter((opt) => opt.text.trim());

        await addQuestion({
          type: "mcq",
          question: questionText,
          createdBy: currentUserName,
          options: validOptions,
        });
      } else {
        await addQuestion({
          type: "saq",
          question: questionText,
          createdBy: currentUserName,
        });
      }

      router.push("/questions");
    } catch (err) {
      console.error("Error submitting question:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
        <div className="flex items-center p-4 justify-between">
          <button
            onClick={() => router.back()}
            className="flex size-10 items-center justify-center rounded-full text-text-primary-light dark:text-text-primary-dark hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <Icon name="close" />
          </button>
          <h1 className="text-text-primary-light dark:text-text-primary-dark text-lg font-bold leading-tight tracking-tight">
            Add Question
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-grow px-4 py-4 pb-28 overflow-y-auto">
        {/* Question Type Selector */}
        <div className="mb-4">
          <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
            Question Type
          </p>
          <SegmentedControl
            options={[
              { value: "mcq", label: "Multiple Choice" },
              { value: "saq", label: "Short Answer" },
            ]}
            value={questionType}
            onChange={(v) => setQuestionType(v as QuestionType)}
            className="!px-0"
          />
        </div>

        {/* Question Text */}
        <div className="mb-6">
          <TextArea
            label="Question"
            placeholder="Enter your question here..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            maxLength={1000}
            className="min-h-[120px]"
          />
        </div>

        {/* MCQ Options */}
        {questionType === "mcq" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-base font-medium text-text-primary-light dark:text-text-primary-dark">
                Answer Options
              </p>
              <button
                onClick={handleAddOption}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                <Icon name="add" size="sm" />
                Add Option
              </button>
            </div>

            {options.map((option, index) => (
              <Card key={option.id} variant="outlined" padding="none">
                <div className="flex items-center gap-3 p-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm uppercase">
                    {option.id}
                  </span>
                  <input
                    type="text"
                    placeholder={`Option ${option.id.toUpperCase()}`}
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark"
                  />
                  {options.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(index)}
                      className="text-text-secondary-light dark:text-text-secondary-dark hover:text-error transition-colors"
                    >
                      <Icon name="close" size="sm" />
                    </button>
                  )}
                </div>
              </Card>
            ))}

            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Add at least 2 options. Students will vote on which answer they think is correct.
            </p>
          </div>
        )}

        {/* SAQ Info */}
        {questionType === "saq" && (
          <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
            <div className="flex gap-3">
              <Icon name="info" className="text-primary flex-shrink-0" />
              <div>
                <p className="text-text-primary-light dark:text-text-primary-dark font-medium mb-1">
                  Short Answer Question
                </p>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Students will be able to submit their own answers and vote on the best ones.
                  The community will determine the consensus answer.
                </p>
              </div>
            </div>
          </Card>
        )}
      </main>

      {/* Submit Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={handleSubmit}
          disabled={!canSubmit() || isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add Question"}
        </Button>
      </div>
    </div>
  );
}

export default function AddQuestionPage() {
  return (
    <ProtectedRoute>
      <AddQuestionPageContent />
    </ProtectedRoute>
  );
}
