import Link from "next/link";
import { ArrowLeft, CheckCircle2, Minus } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { getDailyStats } from "@/lib/todos";
import { formatDateVi, todayDateString } from "@/lib/date";

export const dynamic = "force-dynamic";

const DAYS_TO_SHOW = 30;

export default async function TodoStatsPage() {
  const user = await getCurrentUser();
  const stats = await getDailyStats(user.id, DAYS_TO_SHOW);
  const today = todayDateString();

  const daysWithTasks = stats.filter((s) => s.total > 0);
  const daysAllDone = daysWithTasks.filter((s) => s.allDone);

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-5 p-4 pb-28">
      <Link
        href="/todos"
        className="inline-flex items-center gap-1 text-sm text-foreground/50 transition-colors hover:text-brand-dark"
      >
        <ArrowLeft className="size-4" />
        Quay lại
      </Link>

      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Thống kê</h1>
        <p className="text-sm text-foreground/50">
          {daysWithTasks.length === 0
            ? "Chưa có dữ liệu trong 30 ngày qua."
            : `${daysAllDone.length}/${daysWithTasks.length} ngày hoàn thành hết mục tiêu trong ${DAYS_TO_SHOW} ngày qua.`}
        </p>
      </div>

      <ul className="space-y-2">
        {[...stats].reverse().map((stat) => (
          <li key={stat.date}>
            <Link
              href={`/todos?date=${stat.date}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-indigo-950/5 bg-white p-3.5 shadow-sm shadow-indigo-950/5 transition-colors hover:bg-indigo-50/40"
            >
              <span className="text-sm font-medium text-foreground">
                {stat.date === today ? "Hôm nay" : formatDateVi(stat.date)}
              </span>

              {stat.total === 0 ? (
                <span className="flex items-center gap-1 text-xs text-foreground/35">
                  <Minus className="size-3.5" />
                  Không có việc
                </span>
              ) : stat.allDone ? (
                <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="size-3.5" />
                  Hoàn thành {stat.completed}/{stat.total}
                </span>
              ) : (
                <span className="flex items-center gap-2 text-xs font-medium text-orange-600">
                  <span className="h-1.5 w-12 overflow-hidden rounded-full bg-indigo-950/5">
                    <span
                      className="block h-full rounded-full bg-orange-500"
                      style={{
                        width: `${(stat.completed / stat.total) * 100}%`,
                      }}
                    />
                  </span>
                  {stat.completed}/{stat.total}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
