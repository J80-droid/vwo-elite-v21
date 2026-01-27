import { useQuizProgressStore } from "@shared/model/quizProgressStore";
import { QuizResult } from "@shared/types/index";
import {
  BarChart3,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import React from "react";

interface ProgressDashboardProps {
  onClose?: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  onClose,
}) => {
  const { stats, history, clearHistory } = useQuizProgressStore();

  // Calculate type percentages
  const typeData = (
    Object.entries(stats.typeScores) as [
      string,
      { correct: number; total: number },
    ][]
  )
    .filter(([_, data]) => data.total > 0)
    .map(([type, data]) => ({
      type: type.replace("_", " "),
      percentage: Math.round((data.correct / data.total) * 100),
      total: data.total,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const typeLabels: Record<string, string> = {
    "multiple choice": "MC",
    "error spotting": "Foutenjager",
    "source analysis": "Bronanalyse",
    ordering: "Ordening",
    "open question": "Open",
    "fill blank": "Invul",
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Jouw Voortgang</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-white">{stats.totalQuizzes}</p>
          <p className="text-xs text-gray-400 uppercase mt-1">Quizzen</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-emerald-400">
            {stats.averageScore}%
          </p>
          <p className="text-xs text-gray-400 uppercase mt-1">Gem. Score</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-amber-400">
            {Object.keys(stats.topicScores).length}
          </p>
          <p className="text-xs text-gray-400 uppercase mt-1">Onderwerpen</p>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      {(stats.strongestTopics.length > 0 || stats.weakestTopics.length > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Strongest */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-bold uppercase">
                Sterkste
              </span>
            </div>
            {stats.strongestTopics.length > 0 ? (
              <ul className="space-y-1">
                {stats.strongestTopics.map((topic: string, i: number) => (
                  <li key={i} className="text-sm text-green-200 truncate">
                    • {topic}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-green-200/50">Nog niet genoeg data</p>
            )}
          </div>

          {/* Weakest */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-400 font-bold uppercase">
                Focus Nodig
              </span>
            </div>
            {stats.weakestTopics.length > 0 ? (
              <ul className="space-y-1">
                {stats.weakestTopics.map((topic: string, i: number) => (
                  <li key={i} className="text-sm text-red-200 truncate">
                    • {topic}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-red-200/50">Nog niet genoeg data</p>
            )}
          </div>
        </div>
      )}

      {/* Type Breakdown */}
      {typeData.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">
            Per Vraagtype
          </h3>
          <div className="space-y-3">
            {typeData.map(({ type, percentage, total: _total }) => (
              <div key={type} className="flex items-center gap-4">
                <span className="text-xs text-gray-400 w-24 truncate">
                  {typeLabels[type] || type}
                </span>
                <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      percentage >= 70
                        ? "bg-emerald-500"
                        : percentage >= 50
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm font-mono text-white w-12 text-right">
                  {percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent History */}
      {history.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">
            Recente Quizzen
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {history.slice(0, 5).map((entry: QuizResult) => (
              <div
                key={entry.id}
                className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-white font-medium truncate max-w-[180px]">
                    {entry.topic}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(entry.date).toLocaleDateString("nl-NL")}
                  </p>
                </div>
                <span
                  className={`font-mono font-bold ${
                    entry.score / entry.totalQuestions >= 0.7
                      ? "text-emerald-400"
                      : entry.score / entry.totalQuestions >= 0.5
                        ? "text-amber-400"
                        : "text-red-400"
                  }`}
                >
                  {entry.score}/{entry.totalQuestions}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Button */}
      {stats.totalQuizzes > 0 && (
        <button
          onClick={() => {
            if (confirm("Weet je zeker dat je alle voortgang wilt wissen?")) {
              clearHistory();
            }
          }}
          className="w-full py-2 text-sm text-red-400 hover:text-red-300 border border-red-500/30 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Wis Voortgang
        </button>
      )}

      {/* Empty State */}
      {stats.totalQuizzes === 0 && (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nog geen quizzen gemaakt.</p>
          <p className="text-sm text-gray-500 mt-1">
            Begin met oefenen om je voortgang te zien!
          </p>
        </div>
      )}
    </div>
  );
};
