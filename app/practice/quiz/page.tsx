"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  useTokenToast,
  BottomSheet,
} from "../../components";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { Question } from "../../lib/services/types";
import { getTopAnswer } from "../../lib/utils";
import {
  verifyAnswer as verifyAnswerAI,
  AnswerVerificationResponse,
  generateExplanation,
  getExplanations,
  saveExplanation,
  SavedExplanation,
} from "../../lib/services/ai/client";

function PracticeQuizPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { questions, addToHistory, getPracticeQuestions, isCramModeActive, refreshMastery, refreshCurrency, currencyInfo } = useApp();
  const { user: authUser } = useAuth();
  const { showTokenToast } = useTokenToast();
  const userId = authUser?.id;

  const source = searchParams.get("source") || "all";
  const count = Number(searchParams.get("count")) || 10;

  // Ref to prevent re-fetching questions during the session
  const questionsLoadedRef = useRef(false);
  const questionsRef = useRef<Question[]>([]);

  // State for question selection
  const [practiceQuestionIds, setPracticeQuestionIds] = useState<number[] | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  // Fetch questions once on mount (or when questions become available)
  useEffect(() => {
    // Skip if already loaded
    if (questionsLoadedRef.current) return;

    // Wait for questions to load
    if (questions.length === 0) return;

    const fetchQuestions = async () => {
      setIsLoadingQuestions(true);
      try {
        const ids = await getPracticeQuestions(
          source as "all" | "mcq" | "saq",
          count
        );
        setPracticeQuestionIds(ids);
        questionsLoadedRef.current = true;
        // Store a snapshot of questions to prevent re-renders
        questionsRef.current = questions;
      } catch (error) {
        console.error("Error fetching practice questions:", error);
        // Fallback to random
        const filtered = questions.filter((q) =>
          source === "all" || q.type === source
        );
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        setPracticeQuestionIds(shuffled.slice(0, count).map(q => q.id));
        questionsLoadedRef.current = true;
        questionsRef.current = questions;
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [questions.length, source, count, getPracticeQuestions]);

  // Refresh mastery when leaving the quiz
  useEffect(() => {
    return () => {
      // Refresh mastery data when leaving quiz
      refreshMastery(true);
    };
  }, [refreshMastery]);

  // Get practice questions from IDs - use snapshot to prevent re-renders
  const practiceQuestions = useMemo(() => {
    if (!practiceQuestionIds) return [];
    const questionSource = questionsRef.current.length > 0 ? questionsRef.current : questions;
    return practiceQuestionIds
      .map(id => questionSource.find(q => q.id === id))
      .filter((q): q is Question => q !== undefined);
  }, [practiceQuestionIds, questions]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedMCQAnswer, setSelectedMCQAnswer] = useState<string | null>(null);
  const [saqAnswer, setSaqAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [isVerifying, setIsVerifying] = useState(false);
  const [aiVerification, setAiVerification] = useState<AnswerVerificationResponse | null>(null);

  // Explanation state
  const [showExplanationSheet, setShowExplanationSheet] = useState(false);
  const [savedExplanations, setSavedExplanations] = useState<SavedExplanation[]>([]);
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const [isLoadingExplanations, setIsLoadingExplanations] = useState(false);

  const currentQuestion = practiceQuestions[currentQuestionIndex];
  const progress = practiceQuestions.length > 0 ? ((currentQuestionIndex + 1) / practiceQuestions.length) * 100 : 0;

  // Helper functions that don't depend on hooks
  const getCorrectAnswer = useCallback((question: Question): string => {
    return getTopAnswer(question);
  }, []);

  const getTopAnswers = useCallback((question: Question): string[] => {
    if (question.type === "saq" && question.answers && question.answers.length > 0) {
      // Get top 3 answers sorted by votes
      return question.answers
        .sort((a, b) => b.votes - a.votes)
        .slice(0, 3)
        .map(a => a.text);
    }
    return [getTopAnswer(question)];
  }, []);

  // Load saved explanations when opening the bottom sheet
  const handleOpenExplanationSheet = useCallback(async () => {
    if (!currentQuestion) return;
    
    setShowExplanationSheet(true);
    setIsLoadingExplanations(true);
    setCurrentExplanation(null);
    
    try {
      const explanations = await getExplanations(currentQuestion.id);
      setSavedExplanations(explanations);
    } catch (error) {
      console.error("Error loading explanations:", error);
      setSavedExplanations([]);
    } finally {
      setIsLoadingExplanations(false);
    }
  }, [currentQuestion]);

  // Loading state
  if (isLoadingQuestions) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-center">
          {isCramModeActive ? "Preparing cram session..." : "Selecting questions for review..."}
        </p>
      </div>
    );
  }

  if (practiceQuestions.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background-light dark:bg-background-dark p-4">
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

  const checkMCQAnswer = (): boolean => {
    if (currentQuestion.type === "mcq" && currentQuestion.options) {
      const topOption = currentQuestion.options.reduce((max, opt) =>
        opt.votes > max.votes ? opt : max
      );
      return selectedMCQAnswer === topOption.id;
    }
    return false;
  };

  const handleMCQSelect = (optionId: string) => {
    if (showResult) return; // Don't allow selection after showing result

    setSelectedMCQAnswer(optionId);

    // Immediately check the answer
    if (currentQuestion.type === "mcq" && currentQuestion.options) {
      const topOption = currentQuestion.options.reduce((max, opt) =>
        opt.votes > max.votes ? opt : max
      );
      const isCorrect = optionId === topOption.id;

      setShowResult(true);
      setScore(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));

      addToHistory({
        questionId: currentQuestion.id,
        questionText: currentQuestion.question,
        questionType: currentQuestion.type,
        userAnswer: currentQuestion.options?.find(o => o.id === optionId)?.text || "",
        consensusAnswer: getCorrectAnswer(currentQuestion),
        isCorrect,
        answeredAt: new Date(),
      });
    }
  };

  const handleCheckAnswer = async () => {
    if (currentQuestion.type === "mcq") {
      // MCQ is now handled by handleMCQSelect
      return;
    } else {
      // SAQ - use AI verification
      setIsVerifying(true);
      try {
        const topAnswers = getTopAnswers(currentQuestion);
        const result = await verifyAnswerAI(
          saqAnswer,
          topAnswers,
          currentQuestion.question,
          userId // Pass userId for token deduction
        );

        // Handle token deduction
        if (result.newBalance !== undefined && currencyInfo) {
          const cost = currencyInfo.config.aiVerificationCost;
          showTokenToast(-cost, "AI verification");
          // Refresh currency to update the header/profile
          await refreshCurrency();
        }

        const verification = result.verification;
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

  const handleSkipAI = () => {
    // Skip AI verification and just show result without AI analysis
    setShowResult(true);
    // Don't count as correct/incorrect - just move on
    addToHistory({
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      questionType: currentQuestion.type,
      userAnswer: saqAnswer,
      consensusAnswer: getCorrectAnswer(currentQuestion),
      isCorrect: false, // Skipped, not verified
      answeredAt: new Date(),
    });
  };

  // Generate a new AI explanation
  const handleGenerateExplanation = async () => {
    if (!currentQuestion || !userId) return;
    
    setIsGeneratingExplanation(true);
    setCurrentExplanation(null);
    
    try {
      const correctAnswer = getCorrectAnswer(currentQuestion);
      // Pass MCQ options for better context
      const options = currentQuestion.type === "mcq" && currentQuestion.options
        ? currentQuestion.options.map(o => ({ id: o.id, text: o.text }))
        : undefined;
      const result = await generateExplanation(
        currentQuestion.question,
        correctAnswer,
        userId,
        options
      );
      
      if (result.insufficientBalance) {
        showTokenToast(0, "Insufficient tokens");
      } else {
        // Handle token deduction
        if (result.newBalance !== undefined && currencyInfo) {
          const cost = currencyInfo.config.aiExplanationCost;
          showTokenToast(-cost, "AI explanation");
          await refreshCurrency();
        }
        
        setCurrentExplanation(result.explanation);
      }
    } catch (error) {
      console.error("Error generating explanation:", error);
      setCurrentExplanation("Unable to generate explanation at this time.");
    } finally {
      setIsGeneratingExplanation(false);
    }
  };

  // Save the current explanation
  const handleSaveExplanation = async () => {
    if (!currentQuestion || !userId || !currentExplanation) return;
    
    try {
      const saved = await saveExplanation(
        currentQuestion.id,
        userId,
        currentExplanation
      );
      
      if (saved) {
        setSavedExplanations(prev => [saved, ...prev]);
        setCurrentExplanation(null);
        showTokenToast(0, "Explanation saved");
      }
    } catch (error) {
      console.error("Error saving explanation:", error);
    }
  };

  // Discard the current explanation
  const handleDiscardExplanation = () => {
    setCurrentExplanation(null);
  };

  const handleNext = () => {
    if (currentQuestionIndex < practiceQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedMCQAnswer(null);
      setSaqAnswer("");
      setShowResult(false);
      setAiVerification(null);
      // Reset explanation state
      setShowExplanationSheet(false);
      setSavedExplanations([]);
      setCurrentExplanation(null);
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
    <div className="relative flex min-h-dvh w-full flex-col bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">
      {/* Top App Bar */}
      <header className="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
        <div className="flex items-center p-4 pb-2 justify-between">
          <button
            onClick={() => router.push("/questions")}
            className="flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 bg-transparent"
          >
            <Icon name="close" />
          </button>
          <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            {isCramModeActive ? "Cram Mode" : "Smart Review"}
          </h2>
          <div className="flex w-12 items-center justify-end">
            <QuestionTypeBadge type={currentQuestion.type} />
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 pb-24 space-y-6">
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
                  onChange={() => handleMCQSelect(option.id)}
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
            className={`flex flex-col gap-2 p-4 rounded-xl ${isCorrect
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

            {/* Explain with AI Button - Only for MCQ */}
            {currentQuestion.type === "mcq" && (
              <Button
                variant="primary"
                fullWidth
                onClick={handleOpenExplanationSheet}
                className="mt-3 !bg-gradient-to-br !from-amber-400 !to-orange-500 hover:!from-amber-500 hover:!to-orange-600"
              >
                <Icon name="lightbulb" size="sm" />
                Explain with AI
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
        {/* For MCQ: show Next button after selection (result shown automatically) */}
        {/* For SAQ: show Check Answer button, then Next button after result */}
        {currentQuestion.type === "mcq" ? (
          showResult && (
            <Button variant="primary" fullWidth onClick={handleNext}>
              {currentQuestionIndex < practiceQuestions.length - 1 ? "Next Question" : "See Results"}
            </Button>
          )
        ) : !showResult ? (
          <div className="flex flex-col gap-2">
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
                <span className="flex items-center justify-center gap-2">
                  Check Answer
                  {currencyInfo && (
                    <span className="opacity-80">
                      ({currencyInfo.config.aiVerificationCost} {currencyInfo.config.currencyName})
                    </span>
                  )}
                </span>
              )}
            </Button>
            <button
              type="button"
              onClick={handleSkipAI}
              disabled={!canCheck || isVerifying}
              className="text-sm text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-2"
            >
              Skip AI verification
            </button>
          </div>
        ) : (
          <Button variant="primary" fullWidth onClick={handleNext}>
            {currentQuestionIndex < practiceQuestions.length - 1 ? "Next Question" : "See Results"}
          </Button>
        )}
      </div>

      {/* Explanation Bottom Sheet */}
      <BottomSheet
        isOpen={showExplanationSheet}
        onClose={() => setShowExplanationSheet(false)}
        title="AI Explanation"
      >
        <div className="p-4 space-y-4">
          {/* Loading state */}
          {isLoadingExplanations && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
          )}

          {/* Current Generated Explanation */}
          {!isLoadingExplanations && currentExplanation && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="auto_awesome" size="sm" className="text-primary" />
                  <span className="text-sm font-medium text-primary">New Explanation</span>
                </div>
                <p className="text-text-primary-light dark:text-text-primary-dark">
                  {currentExplanation}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={handleDiscardExplanation}
                >
                  Discard
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSaveExplanation}
                >
                  <Icon name="bookmark" size="sm" />
                  Save
                </Button>
              </div>
            </div>
          )}

          {/* Generating state */}
          {!isLoadingExplanations && isGeneratingExplanation && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Thinking...
              </p>
            </div>
          )}

          {/* Saved Explanations */}
          {!isLoadingExplanations && !currentExplanation && !isGeneratingExplanation && (
            <>
              {savedExplanations.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                    Saved Explanations ({savedExplanations.length})
                  </h3>
                  {savedExplanations.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark"
                    >
                      <p className="text-text-primary-light dark:text-text-primary-dark">
                        {exp.explanation}
                      </p>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">
                        {new Date(exp.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleGenerateExplanation}
                    disabled={isGeneratingExplanation}
                  >
                    <Icon name="auto_awesome" size="sm" />
                    New Explanation
                    {currencyInfo && (
                      <span className="text-sm opacity-70 ml-1">
                        ({currencyInfo.config.aiExplanationCost} {currencyInfo.config.currencyName})
                      </span>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <Icon name="lightbulb" size="xl" className="text-text-secondary-light dark:text-text-secondary-dark mb-2" />
                    <p className="text-text-secondary-light dark:text-text-secondary-dark">
                      No explanations saved yet for this question.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleGenerateExplanation}
                    disabled={isGeneratingExplanation}
                  >
                    <Icon name="auto_awesome" size="sm" />
                    Generate Explanation
                    {currencyInfo && (
                      <span className="text-sm opacity-70 ml-1">
                        ({currencyInfo.config.aiExplanationCost} {currencyInfo.config.currencyName})
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </BottomSheet>
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
