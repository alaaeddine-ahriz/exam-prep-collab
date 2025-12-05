"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Icon,
  ProgressBar,
  PracticeAnswerOption,
  Button,
  Card,
  TextArea,
  QuestionTypeBadge,
  ProtectedRoute,
} from "../../components";
import { useApp } from "../../context/AppContext";
import { Question } from "../../lib/services/types";
import { getTopAnswer } from "../../lib/utils";
import { verifyAnswer as verifyAnswerAI, AnswerVerificationResponse } from "../../lib/services/ai/client";

function PracticeQuizPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { questions, addToHistory } = useApp();

  const source = searchParams.get("source") || "all";
  const count = Number(searchParams.get("count")) || 10;

  // Filter and shuffle questions
  const practiceQuestions = useMemo(() => {
    let filtered = questions.filter((q) => 
      source === "all" || q.type === source
    );
    // Shuffle
    filtered = [...filtered].sort(() => Math.random() - 0.5);
    return filtered.slice(0, count);
  }, [questions, source, count]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedMCQAnswer, setSelectedMCQAnswer] = useState<string | null>(null);
  const [saqAnswer, setSaqAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiVerification, setAiVerification] = useState<AnswerVerificationResponse | null>(null);

  const currentQuestion = practiceQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / practiceQuestions.length) * 100;

  if (practiceQuestions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4">
        <Icon name="quiz" size="xl" className="text-text-secondary-light dark:text-text-secondary-dark mb-4" />
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-center mb-4">
          No questions available for this practice mode.
        </p>
        <Button variant="primary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const getCorrectAnswer = (question: Question): string => {
    return getTopAnswer(question);
  };

  const getTopAnswers = (question: Question): string[] => {
    if (question.type === "saq" && question.answers && question.answers.length > 0) {
      // Get top 3 answers sorted by votes
      return question.answers
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 3)
        .map(a => a.text);
    }
    return [getTopAnswer(question)];
  };

  const checkMCQAnswer = (): boolean => {
    if (currentQuestion.type === "mcq" && currentQuestion.options) {
      const topOption = currentQuestion.options.reduce((max, opt) =>
        opt.votes > max.votes ? opt : max
      );
      return selectedMCQAnswer === topOption.id;
    }
    return false;
  };

  const handleCheckAnswer = async () => {
    if (currentQuestion.type === "mcq") {
      // MCQ - simple check
      const isCorrect = checkMCQAnswer();
      setShowResult(true);
      setScore(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));

      addToHistory({
        questionId: currentQuestion.id,
        questionText: currentQuestion.question,
        questionType: currentQuestion.type,
        userAnswer: currentQuestion.options?.find(o => o.id === selectedMCQAnswer)?.text || "",
        consensusAnswer: getCorrectAnswer(currentQuestion),
        isCorrect,
        answeredAt: new Date(),
      });
    } else {
      // SAQ - use AI verification
      setIsVerifying(true);
      try {
        const topAnswers = getTopAnswers(currentQuestion);
        const verification = await verifyAnswerAI(
          saqAnswer,
          topAnswers,
          currentQuestion.question
        );
        
        setAiVerification(verification);
        setShowResult(true);
        setScore(prev => ({
          correct: prev.correct + (verification.isCorrect ? 1 : 0),
          total: prev.total + 1,
        }));

        addToHistory({
          questionId: currentQuestion.id,
          questionText: currentQuestion.question,
          questionType: currentQuestion.type,
          userAnswer: saqAnswer,
          consensusAnswer: getCorrectAnswer(currentQuestion),
          isCorrect: verification.isCorrect,
          answeredAt: new Date(),
        });
      } catch (error) {
        console.error("Error verifying answer:", error);
        // Fallback to showing result without AI
        setShowResult(true);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedMCQAnswer(null);
      setSaqAnswer("");
      setShowResult(false);
      setAiVerification(null);
    } else {
      // Quiz complete - show results
      router.push(`/practice/results?correct=${score.correct}&total=${practiceQuestions.length}`);
    }
  };

  const isCorrect = showResult 
    ? (currentQuestion.type === "mcq" ? checkMCQAnswer() : (aiVerification?.isCorrect ?? false))
    : false;
  const canCheck = currentQuestion.type === "mcq" 
    ? selectedMCQAnswer !== null 
    : saqAnswer.trim().length > 0;

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">
      {/* Top App Bar */}
      <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
        <div className="flex w-12 items-center justify-start">
          <button
            onClick={() => router.push("/questions")}
            className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 bg-transparent"
          >
            <Icon name="close" />
          </button>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">
          Practice Mode
        </h2>
        <div className="flex w-12 items-center justify-end">
          <QuestionTypeBadge type={currentQuestion.type} />
        </div>
      </div>

      <div className="flex flex-col flex-grow">
        <main className="flex-grow p-4 space-y-6">
          {/* Progress Bar */}
          <div className="flex flex-col gap-2">
            <div className="flex gap-6 justify-between items-center">
              <p className="text-sm font-medium leading-normal">
                Question {currentQuestionIndex + 1} of {practiceQuestions.length}
              </p>
              <p className="text-sm font-medium text-primary">
                Score: {score.correct}/{score.total}
              </p>
            </div>
            <ProgressBar value={progress} variant="primary" size="md" />
          </div>

          {/* Question */}
          <h3 className="text-xl font-bold leading-tight pt-4 pb-2">
            {currentQuestion.question}
          </h3>

          {/* MCQ Options */}
          {currentQuestion.type === "mcq" && currentQuestion.options && (
            <div className="flex flex-col gap-3">
              {currentQuestion.options.map((option) => {
                let optionClassName = "";
                if (showResult && currentQuestion.options) {
                  const topOption = currentQuestion.options.reduce((max, opt) =>
                    opt.votes > max.votes ? opt : max
                  );
                  if (option.id === topOption.id) {
                    optionClassName = "!border-success !bg-success/10";
                  } else if (option.id === selectedMCQAnswer && option.id !== topOption.id) {
                    optionClassName = "!border-error !bg-error/10";
                  }
                }

                return (
                  <PracticeAnswerOption
                    key={option.id}
                    id={option.id}
                    name="answer-options"
                    label={`${option.id.toUpperCase()}. ${option.text}`}
                    checked={selectedMCQAnswer === option.id}
                    onChange={() => !showResult && setSelectedMCQAnswer(option.id)}
                    className={optionClassName}
                  />
                );
              })}
            </div>
          )}

          {/* SAQ Input */}
          {currentQuestion.type === "saq" && (
            <div className="space-y-4">
              {!showResult ? (
                <TextArea
                  label="Your Answer"
                  placeholder="Type your answer here..."
                  value={saqAnswer}
                  onChange={(e) => setSaqAnswer(e.target.value)}
                  maxLength={1000}
                />
              ) : (
                <div className="space-y-4">
                  <Card variant="outlined">
                    <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                      Your Answer:
                    </p>
                    <p className="text-text-primary-light dark:text-text-primary-dark">
                      {saqAnswer}
                    </p>
                  </Card>
                  <Card className="bg-primary/5 dark:bg-primary/10 border-primary/20">
                    <p className="text-sm font-medium text-primary mb-2">
                      Top Community Answer:
                    </p>
                    <p className="text-text-primary-light dark:text-text-primary-dark">
                      {getCorrectAnswer(currentQuestion)}
                    </p>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* Result Feedback */}
          {showResult && (
            <div
              className={`flex flex-col gap-2 p-4 rounded-xl ${
                isCorrect
                  ? "bg-success/10"
                  : "bg-warning/10"
              }`}
            >
              <div className={`flex items-center gap-3 ${isCorrect ? "text-success" : "text-warning"}`}>
                <Icon
                  name={isCorrect ? "check_circle" : "info"}
                  filled
                  size="lg"
                />
                <span className="font-semibold">
                  {isCorrect 
                    ? "Great! Your answer matches the consensus." 
                    : "Your answer differs from the consensus."}
                </span>
              </div>
              
              {/* AI Explanation for SAQ */}
              {currentQuestion.type === "saq" && aiVerification && (
                <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="psychology" size="sm" className="text-primary" />
                    <span className="text-sm font-medium text-primary">AI Analysis</span>
                    {aiVerification.confidence !== undefined && (
                      <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                        ({Math.round(aiVerification.confidence * 100)}% confidence)
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-primary-light dark:text-text-primary-dark">
                    {aiVerification.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer Action Button */}
      <div className="sticky bottom-0 bg-background-light dark:bg-background-dark p-4 border-t border-slate-200 dark:border-slate-800">
        {!showResult ? (
          <Button
            variant="primary"
            fullWidth
            onClick={handleCheckAnswer}
            disabled={!canCheck || isVerifying}
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Analyzing Answer...
              </span>
            ) : (
              "Check Answer"
            )}
          </Button>
        ) : (
          <Button variant="primary" fullWidth onClick={handleNext}>
            {currentQuestionIndex < practiceQuestions.length - 1 ? "Next Question" : "See Results"}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PracticeQuizPage() {
  return (
    <ProtectedRoute>
      <PracticeQuizPageContent />
    </ProtectedRoute>
  );
}
