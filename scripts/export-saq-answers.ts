/**
 * Export SAQ Questions and Community Answers from Supabase
 * 
 * Usage: npx tsx --env-file=.env.local scripts/export-saq-answers.ts
 * 
 * Requires environment variables:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

interface SAQAnswer {
    id: string;
    text: string;
    votes: number;
    createdBy: string;
    createdAt: string;
}

interface SAQQuestion {
    id: number;
    question: string;
    createdBy: string;
    createdAt: string;
    answers: SAQAnswer[];
    totalAnswers: number;
    totalVotes: number;
}

interface ExportData {
    exportedAt: string;
    totalQuestions: number;
    totalAnswers: number;
    questions: SAQQuestion[];
}

const OUTPUT_PATH = path.join(process.cwd(), "data", "saq-export.json");

async function exportSAQData() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Missing Supabase environment variables.");
        console.error("   Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
        console.error("\n   Run with: npx tsx --env-file=.env.local scripts/export-saq-answers.ts");
        process.exit(1);
    }

    console.log("🔗 Connecting to Supabase...");
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Get all SAQ questions
        console.log("📝 Fetching SAQ questions...");
        const { data: questions, error: questionsError } = await supabase
            .from("questions")
            .select("id, question, created_by, created_at")
            .eq("type", "saq")
            .order("id", { ascending: true });

        if (questionsError) {
            console.error("❌ Error fetching questions:", questionsError.message);
            process.exit(1);
        }

        console.log(`📝 Found ${questions?.length || 0} SAQ questions`);

        // Get all SAQ answers
        console.log("💬 Fetching community answers...");
        const { data: allAnswers, error: answersError } = await supabase
            .from("saq_answers")
            .select("id, question_id, text, vote_count, created_by, created_at")
            .order("question_id", { ascending: true })
            .order("vote_count", { ascending: false });

        if (answersError) {
            console.error("❌ Error fetching answers:", answersError.message);
            process.exit(1);
        }

        console.log(`💬 Found ${allAnswers?.length || 0} total community answers`);

        // Group answers by question
        const answersByQuestion = new Map<number, SAQAnswer[]>();
        for (const answer of allAnswers || []) {
            const existing = answersByQuestion.get(answer.question_id) || [];
            existing.push({
                id: answer.id,
                text: answer.text,
                votes: answer.vote_count,
                createdBy: answer.created_by,
                createdAt: answer.created_at
            });
            answersByQuestion.set(answer.question_id, existing);
        }

        // Build export data
        const exportQuestions: SAQQuestion[] = (questions || []).map(q => {
            const answers = answersByQuestion.get(q.id) || [];
            const totalVotes = answers.reduce((sum, a) => sum + a.votes, 0);
            return {
                id: q.id,
                question: q.question,
                createdBy: q.created_by,
                createdAt: q.created_at,
                answers,
                totalAnswers: answers.length,
                totalVotes
            };
        });

        const exportData: ExportData = {
            exportedAt: new Date().toISOString(),
            totalQuestions: exportQuestions.length,
            totalAnswers: allAnswers?.length || 0,
            questions: exportQuestions
        };

        // Write to file
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(exportData, null, 2));
        console.log(`\n✅ Export complete! Saved to: ${OUTPUT_PATH}`);

        // Print summary
        console.log("\n📊 Summary:");
        console.log(`   - SAQ Questions: ${exportQuestions.length}`);
        console.log(`   - Community Answers: ${allAnswers?.length || 0}`);

        const questionsWithAnswers = exportQuestions.filter(q => q.answers.length > 0);
        console.log(`   - Questions with answers: ${questionsWithAnswers.length}`);

        if (questionsWithAnswers.length > 0) {
            const avgAnswers = (allAnswers?.length || 0) / questionsWithAnswers.length;
            console.log(`   - Average answers per question: ${avgAnswers.toFixed(1)}`);
        }

    } catch (error) {
        console.error("❌ Unexpected error:", error);
        process.exit(1);
    }
}

exportSAQData();
