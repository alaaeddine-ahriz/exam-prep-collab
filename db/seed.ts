/**
 * Database Seed Data
 * 
 * Sample data for development and testing.
 * This file is used by both SQLite and Supabase seed scripts.
 */

export const DEFAULT_USER = {
  id: "local-user",
  name: "Guest",
  email: "guest@local",
  streak: 0,
};

export const SAMPLE_QUESTIONS = [
  // MCQ Questions
  {
    type: "mcq" as const,
    question: "What is the primary function of the mitochondria in a cell?",
    createdBy: "Professor Kim",
    options: [
      { id: "a", text: "Protein synthesis", votes: 45 },
      { id: "b", text: "Energy production (ATP synthesis)", votes: 285 },
      { id: "c", text: "Waste breakdown", votes: 23 },
      { id: "d", text: "Genetic storage", votes: 12 },
    ],
  },
  {
    type: "mcq" as const,
    question: "Explain the process of photosynthesis.",
    createdBy: "Professor Kim",
    options: [
      { id: "a", text: "Conversion of light energy into chemical energy", votes: 156 },
      { id: "b", text: "Breaking down glucose for energy", votes: 45 },
      { id: "c", text: "Cellular respiration process", votes: 34 },
      { id: "d", text: "DNA replication mechanism", votes: 8 },
    ],
  },
  {
    type: "mcq" as const,
    question: "What is the role of the cell membrane?",
    createdBy: "Student A",
    options: [
      { id: "a", text: "It acts as a barrier", votes: 89 },
      { id: "b", text: "Controls what enters and exits the cell", votes: 134 },
      { id: "c", text: "Produces energy", votes: 23 },
      { id: "d", text: "Stores genetic information", votes: 18 },
    ],
  },
  {
    type: "mcq" as const,
    question: "Which organelle is responsible for protein synthesis?",
    createdBy: "Student E",
    options: [
      { id: "a", text: "Mitochondria", votes: 34 },
      { id: "b", text: "Ribosome", votes: 198 },
      { id: "c", text: "Golgi apparatus", votes: 23 },
      { id: "d", text: "Lysosome", votes: 12 },
    ],
  },
  // SAQ Questions
  {
    type: "saq" as const,
    question: "Describe the structure of DNA and explain how it stores genetic information.",
    createdBy: "Professor Kim",
    answers: [
      {
        id: "saq1-1",
        text: "DNA has a double helix structure made of nucleotides. Each nucleotide contains a sugar, phosphate, and one of four bases (A, T, G, C). The sequence of these bases encodes genetic information.",
        votes: 156,
        createdBy: "Student B",
      },
      {
        id: "saq1-2",
        text: "DNA is a double-stranded molecule twisted into a helix. The two strands are held together by hydrogen bonds between complementary base pairs (A-T and G-C). Genes are segments of DNA that code for proteins.",
        votes: 89,
        createdBy: "Student C",
      },
    ],
  },
  {
    type: "saq" as const,
    question: "What is the significance of the water cycle in maintaining Earth's ecosystems?",
    createdBy: "Professor Lee",
    answers: [
      {
        id: "saq2-1",
        text: "The water cycle distributes fresh water across the planet, supporting all living organisms. It regulates temperature, transports nutrients, and maintains the balance of ecosystems through evaporation, condensation, and precipitation.",
        votes: 78,
        createdBy: "Student D",
      },
    ],
  },
];

export const SAMPLE_HISTORY = [
  {
    id: "h1",
    questionId: 1,
    questionType: "mcq" as const,
    userAnswer: "Energy production (ATP synthesis)",
    consensusAnswer: "Energy production (ATP synthesis)",
    isCorrect: true,
  },
  {
    id: "h2",
    questionId: 2,
    questionType: "mcq" as const,
    userAnswer: "Breaking down glucose for energy",
    consensusAnswer: "Conversion of light energy into chemical energy",
    isCorrect: false,
  },
  {
    id: "h3",
    questionId: 5,
    questionType: "saq" as const,
    userAnswer: "DNA has a double helix structure...",
    consensusAnswer: "DNA has a double helix structure made of nucleotides...",
    isCorrect: true,
  },
  {
    id: "h4",
    questionId: 4,
    questionType: "mcq" as const,
    userAnswer: "Ribosome",
    consensusAnswer: "Ribosome",
    isCorrect: true,
  },
  {
    id: "h5",
    questionId: 3,
    questionType: "mcq" as const,
    userAnswer: "It acts as a barrier",
    consensusAnswer: "Controls what enters and exits the cell",
    isCorrect: false,
  },
];

