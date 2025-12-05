import { Question } from "./services/types";

export function getConsensusPercent(question: Question): number {
  if (question.type === "mcq" && question.options) {
    const totalVotes = question.options.reduce((sum, opt) => sum + opt.votes, 0);
    if (totalVotes === 0) return 0;
    const maxVotes = Math.max(...question.options.map((opt) => opt.votes));
    return Math.round((maxVotes / totalVotes) * 100);
  } else if (question.type === "saq" && question.answers) {
    const totalVotes = question.answers.reduce((sum, ans) => sum + ans.votes, 0);
    if (totalVotes === 0) return 0;
    const maxVotes = Math.max(...question.answers.map((ans) => ans.votes));
    return Math.round((maxVotes / totalVotes) * 100);
  }
  return 0;
}

export function getTopAnswer(question: Question): string {
  if (question.type === "mcq" && question.options && question.options.length > 0) {
    const topOption = question.options.reduce((max, opt) =>
      opt.votes > max.votes ? opt : max
    );
    return topOption.text;
  } else if (question.type === "saq" && question.answers) {
    if (question.answers.length === 0) return "No answers yet";
    const topAnswer = question.answers.reduce((max, ans) =>
      ans.votes > max.votes ? ans : max
    );
    return topAnswer.text;
  }
  return "No answer";
}

export function getTotalVotes(question: Question): number {
  if (question.type === "mcq" && question.options) {
    return question.options.reduce((sum, opt) => sum + opt.votes, 0);
  } else if (question.type === "saq" && question.answers) {
    return question.answers.reduce((sum, ans) => sum + ans.votes, 0);
  }
  return 0;
}

