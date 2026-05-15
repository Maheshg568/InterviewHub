import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Clock, 
  Sparkles, 
  Brain, 
  Trophy,
  Zap,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export default function QuizPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  const questions: Question[] = [
    {
      id: 1,
      text: "If 2x + 7 = 15, what is the value of x?",
      options: ["x = 4", "x = 8", "x = 11", "x = 4.5"],
      correctAnswer: "x = 4",
      explanation: "Subtract 7 from both sides: 2x = 8. Then divide by 2: x = 4."
    },
    {
      id: 2,
      text: "Which property is used when you perform the same operation on both sides of an equation?",
      options: ["Distributive Property", "Equality Property", "Identity Property", "Commutative Property"],
      correctAnswer: "Equality Property",
      explanation: "The Equality Property states that if you perform the same operation on both sides, the equation remains true."
    },
    {
      id: 3,
      text: "Translate 'Four times a number increased by six is thirty' into an equation.",
      options: ["4n + 30 = 6", "6n + 4 = 30", "4n + 6 = 30", "4(n + 6) = 30"],
      correctAnswer: "4n + 6 = 30",
      explanation: "'Four times a number' is 4n, 'increased by six' is +6, and 'is thirty' is = 30."
    }
  ];

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered && !quizComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleAnswer(null);
    }
  }, [timeLeft, isAnswered, quizComplete]);

  const handleAnswer = (option: string | null) => {
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === questions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(30);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setQuizComplete(false);
    setTimeLeft(30);
  };

  if (quizComplete) {
    return (
      <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
        <div className="glass-card p-16 text-center space-y-10 relative overflow-hidden bg-gradient-to-br from-[#EEF2FF] via-[#F8FAFC] to-[#E0F2FE]-light border-white/70">
           <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 blur-[120px] rounded-full -mr-48 -mt-48 transition-opacity duration-1000" />
           <div className="w-24 h-24 bg-indigo-600/20 rounded-[2rem] flex items-center justify-center mx-auto border border-indigo-500/30">
              <Trophy className="w-12 h-12 text-indigo-400" />
           </div>
           <div className="space-y-4">
              <h2 className="text-4xl font-bold text-white tracking-tight">Neural Sync Complete</h2>
              <p className="text-slate-600 text-lg font-medium">Knowledge anchors have been successfully verified.</p>
           </div>
           
           <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
              <div className="p-8 bg-white/75 border border-white/70 rounded-3xl space-y-2">
                 <p className="status-label text-slate-500">Final Score</p>
                 <p className="text-4xl font-bold text-white tabular-nums">{score}/{questions.length}</p>
              </div>
              <div className="p-8 bg-white/75 border border-white/70 rounded-3xl space-y-2">
                 <p className="status-label text-slate-500">Efficiency</p>
                 <p className="text-4xl font-bold text-emerald-400 tabular-nums">{Math.round((score/questions.length)*100)}%</p>
              </div>
           </div>

           <div className="flex flex-col md:flex-row gap-4 justify-center">
              <button 
                onClick={resetQuiz}
                className="premium-button !py-4 !px-10 flex items-center gap-3 justify-center"
              >
                <RotateCcw className="w-5 h-5" />
                Retake Phase
              </button>
              <button className="premium-button !bg-white/5 !border !border-white/70 !text-slate-500 hover:!text-white hover:!bg-white/10 !py-4 !px-10 flex items-center gap-3 justify-center">
                Review Mistakes
              </button>
           </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Progress Header */}
      <div className="flex items-center justify-between bg-white/75 border border-white/70 p-6 rounded-[2rem] px-10">
         <div className="flex items-center gap-6">
            <div className="space-y-1">
               <p className="status-label text-slate-500">Phase {currentQuestionIndex + 1} of {questions.length}</p>
               <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/70">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-700" 
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} 
                  />
               </div>
            </div>
         </div>
         
         <div className={cn("flex items-center gap-3 px-6 py-2.5 rounded-2xl border transition-all", timeLeft < 10 ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-white/5 border-white/70 text-slate-500")}>
            <Clock className={cn("w-4 h-4", timeLeft < 10 && "animate-pulse")} />
            <span className="text-xl font-bold tabular-nums tracking-tighter">{timeLeft}s</span>
         </div>
      </div>

      {/* Question Card styled like exam UI */}
      <div className="exam-card relative overflow-hidden group">
        <div className="space-y-8 relative z-10">
          <div>
            <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-2">Question {currentQuestionIndex + 1} of {questions.length}</h3>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">{currentQuestion.text}</h2>
          </div>

          <div className="space-y-4 mt-6">
            {currentQuestion.options.map((option, i) => (
              <button
                key={i}
                onClick={() => !isAnswered && handleAnswer(option)}
                disabled={isAnswered}
                className={cn(
                 "w-full p-6 rounded-xl border bg-white text-left flex items-center gap-6 justify-between",
                 selectedOption === option 
                  ? (option === currentQuestion.correctAnswer ? "border-emerald-400" : "border-rose-400")
                  : "border-gray-200 hover:border-indigo-300"
                )}
              >
                <div className="flex items-center gap-4">
                  <span className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-700">{String.fromCharCode(65 + i)}</span>
                  <span className="text-base font-medium text-gray-800">{option}</span>
                </div>
                <div className="text-sm text-gray-500">&nbsp;</div>
              </button>
            ))}
          </div>

          <AnimatePresence>
            {isAnswered && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-gray-50 border border-gray-100 rounded-xl space-y-4 mt-6"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm text-gray-600 uppercase tracking-wider">Explanation</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{currentQuestion.explanation}</p>
                <div className="pt-2 flex justify-end">
                  <button 
                    onClick={nextQuestion}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-md shadow-md flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

