"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  TopAppBar,
  Card,
  AnswerOption,
  SAQAnswerCard,
  Button,
  Icon,
  BottomNavigation,
  BottomSheet,
  TextArea,
  QuestionTypeBadge,
  ProtectedRoute,
} from "../../components";
import { useApp } from "../../context/AppContext";
import { getTotalVotes } from "../../lib/utils";

function QuestionDetailsPageContent() {
  const router = useRouter();
  const params = useParams();
  const questionId = Number(params.id);
  
  const { 
    getQuestion, 
    voteOnMCQ, 
    voteOnSAQ, 
    addSAQAnswer, 
    questions,
    getUserVoteForQuestion,
    loading 
  } = useApp();
  
  const question = getQuestion(questionId);
  const userVote = getUserVoteForQuestion(questionId);

  const [selectedMCQAnswer, setSelectedMCQAnswer] = useState<string | null>(null);
  const [selectedSAQAnswer, setSelectedSAQAnswer] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [newAnswerText, setNewAnswerText] = useState("");
  const [showAddAnswer, setShowAddAnswer] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  // Sync selected answers with user's existing vote
  useEffect(() => {
    if (userVote) {
      if (userVote.optionId) {
        setSelectedMCQAnswer(userVote.optionId);
      }
      if (userVote.answerId) {
        setSelectedSAQAnswer(userVote.answerId);
      }
    }
  }, [userVote]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          Question not found
        </p>
      </div>
    );
  }

  const totalVotes = getTotalVotes(question);
  const questionIndex = questions.findIndex((q) => q.id === questionId);
  const prevQuestion = questionIndex > 0 ? questions[questionIndex - 1] : null;
  const nextQuestion = questionIndex < questions.length - 1 ? questions[questionIndex + 1] : null;

  const hasVoted = !!userVote;
  const hasChangedSelection = 
    (question.type === "mcq" && selectedMCQAnswer && selectedMCQAnswer !== userVote?.optionId) ||
    (question.type === "saq" && selectedSAQAnswer && selectedSAQAnswer !== userVote?.answerId);

  const handleVote = async () => {
    setIsVoting(true);
    try {
      if (question.type === "mcq" && selectedMCQAnswer) {
        await voteOnMCQ(questionId, selectedMCQAnswer);
      } else if (question.type === "saq" && selectedSAQAnswer) {
        await voteOnSAQ(questionId, selectedSAQAnswer);
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleAddAnswer = async () => {
    if (newAnswerText.trim() && question.type === "saq") {
      await addSAQAnswer(questionId, newAnswerText.trim());
      setNewAnswerText("");
      setShowAddAnswer(false);
    }
  };

  const handleSubmitFeedback = () => {
    console.log("Submitting feedback:", { text: feedbackText });
    setIsReportOpen(false);
    setFeedbackText("");
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      {/* Top App Bar */}
      <TopAppBar
        title={`Question #${questionId}`}
        onBack={() => router.push("/questions")}
        rightAction={<QuestionTypeBadge type={question.type} />}
      />

      <main className="flex-1 px-4 pt-2 pb-28">
        {/* Question Card */}
        <Card className="mb-6" padding="lg">
          <h2 className="text-text-primary-light dark:text-text-primary-dark tracking-tight text-xl font-bold leading-tight text-left">
            {question.question}
          </h2>
        </Card>

        {/* Vote Status Banner */}
        {hasVoted && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center gap-2">
            <Icon name="check_circle" size="sm" className="text-primary" />
            <span className="text-sm text-primary font-medium">
              You voted • Tap another option to change your vote
            </span>
          </div>
        )}

        {/* MCQ Options */}
        {question.type === "mcq" && question.options && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Select the answer you believe is correct:
            </p>
            {question.options.map((option) => {
              const percentage = totalVotes > 0
                ? Math.round((option.votes / totalVotes) * 100)
                : 0;
              const isUserVote = userVote?.optionId === option.id;
              
              return (
                <AnswerOption
                  key={option.id}
                  id={option.id}
                  name="answer"
                  label={`${option.id.toUpperCase()}. ${option.text}`}
                  percentage={percentage}
                  checked={selectedMCQAnswer === option.id}
                  onChange={() => setSelectedMCQAnswer(option.id)}
                  isUserVote={isUserVote}
                />
              );
            })}
          </div>
        )}

        {/* SAQ Answers */}
        {question.type === "saq" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
                Community Answers ({question.answers?.length || 0})
              </h3>
              <button
                onClick={() => setShowAddAnswer(true)}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
              >
                <Icon name="add" size="sm" />
                Add Answer
              </button>
            </div>

            {(!question.answers || question.answers.length === 0) ? (
              <Card className="text-center py-8">
                <Icon name="lightbulb" size="xl" className="text-text-secondary-light dark:text-text-secondary-dark mb-2" />
                <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
                  No answers yet. Be the first to contribute!
                </p>
                <Button variant="primary" onClick={() => setShowAddAnswer(true)}>
                  Add Your Answer
                </Button>
              </Card>
            ) : (
              question.answers
                .sort((a, b) => b.votes - a.votes)
                .map((answer, index) => {
                  const percentage = totalVotes > 0
                    ? Math.round((answer.votes / totalVotes) * 100)
                    : 0;
                  const isUserVote = userVote?.answerId === answer.id;
                  
                  return (
                    <SAQAnswerCard
                      key={answer.id}
                      answer={answer.text}
                      votes={answer.votes}
                      percentage={percentage}
                      createdBy={answer.createdBy}
                      isTopAnswer={index === 0}
                      isSelected={selectedSAQAnswer === answer.id}
                      isUserVote={isUserVote}
                      onVote={() => setSelectedSAQAnswer(answer.id)}
                    />
                  );
                })
            )}
          </div>
        )}

        {/* Total Votes */}
        <div className="mt-6 flex justify-center items-center">
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-normal">
            {totalVotes.toLocaleString()} votes total
          </p>
        </div>

        {/* Report Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
          >
            <Icon name="flag" size="sm" />
            <span>Report Issue</span>
          </button>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <BottomNavigation>
        <button
          onClick={() => prevQuestion && router.push(`/questions/${prevQuestion.id}`)}
          disabled={!prevQuestion}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <Icon name="chevron_left" size="md" />
        </button>
        
        {/* Vote Button - shows when selection changed or not yet voted */}
        {((question.type === "mcq" && selectedMCQAnswer && (!hasVoted || hasChangedSelection)) ||
          (question.type === "saq" && selectedSAQAnswer && (!hasVoted || hasChangedSelection))) && (
          <Button 
            variant="primary" 
            onClick={handleVote}
            disabled={isVoting}
          >
            {isVoting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Voting...
              </span>
            ) : hasVoted ? (
              "Change Vote"
            ) : (
              "Vote"
            )}
          </Button>
        )}
        
        <button
          onClick={() => nextQuestion && router.push(`/questions/${nextQuestion.id}`)}
          disabled={!nextQuestion}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-hover transition-colors"
        >
          <Icon name="chevron_right" size="md" />
        </button>
      </BottomNavigation>

      {/* Add Answer Bottom Sheet */}
      <BottomSheet
        isOpen={showAddAnswer}
        onClose={() => setShowAddAnswer(false)}
        title="Add Your Answer"
      >
        <div className="px-4 py-3">
          <TextArea
            label="Your Answer"
            placeholder="Share your answer to this question..."
            value={newAnswerText}
            onChange={(e) => setNewAnswerText(e.target.value)}
            maxLength={1000}
          />
        </div>

        <div className="flex flex-col items-stretch px-4 pb-8 pt-2">
          <Button
            variant="primary"
            fullWidth
            onClick={handleAddAnswer}
            disabled={!newAnswerText.trim()}
          >
            Submit Answer
          </Button>
        </div>
      </BottomSheet>

      {/* Report Bottom Sheet */}
      <BottomSheet
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        title="Report Issue"
      >
        <div className="px-4 py-3">
          <TextArea
            label="Description"
            placeholder="Please explain the issue. Is there a typo, is the information outdated, or is the question unclear?"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            maxLength={500}
          />
        </div>

        <div className="flex flex-col items-stretch px-4 pb-8 pt-2">
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmitFeedback}
            disabled={!feedbackText.trim()}
          >
            Submit Report
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

export default function QuestionDetailsPage() {
  return (
    <ProtectedRoute>
      <QuestionDetailsPageContent />
    </ProtectedRoute>
  );
}
