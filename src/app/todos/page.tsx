import Link from "next/link";
import {
  CheckSquare,
  Square,
  Trash2,
  ListTodo,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChartColumn,
} from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { listTodosByDate } from "@/lib/todos";
import { addDays, formatDateVi, todayDateString } from "@/lib/date";
import { createTodo, toggleTodo, deleteTodo } from "./actions";

export const dynamic = "force-dynamic";

export default async function TodosPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = todayDateString();
  const dateStr = date ?? today;
  const isToday = dateStr === today;

  const user = await getCurrentUser();
  const todos = await listTodosByDate(user.id, dateStr);
  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-5 p-4 pb-28">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Việc cần làm
          </h1>
          <p className="text-sm text-foreground/50">
            Danh sách riêng tư của bạn, chỉ bạn thấy được.
          </p>
        </div>
        <Link
          href="/todos/stats"
          aria-label="Xem thống kê"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-foreground/40 transition-colors hover:bg-indigo-50 hover:text-brand-dark"
        >
          <ChartColumn className="size-5" />
        </Link>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-indigo-950/5 bg-white p-2 shadow-sm shadow-indigo-950/5">
        <Link
          href={`/todos?date=${addDays(dateStr, -1)}`}
          aria-label="Ngày trước"
          className="flex size-8 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-indigo-50 hover:text-brand-dark"
        >
          <ChevronLeft className="size-4.5" />
        </Link>
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-foreground">
            {isToday ? "Hôm nay" : formatDateVi(dateStr)}
          </span>
          {!isToday && (
            <Link
              href="/todos"
              className="text-xs text-brand-dark underline underline-offset-2"
            >
              Về hôm nay
            </Link>
          )}
        </div>
        <Link
          href={`/todos?date=${addDays(dateStr, 1)}`}
          aria-label="Ngày sau"
          className="flex size-8 items-center justify-center rounded-lg text-foreground/40 transition-colors hover:bg-indigo-50 hover:text-brand-dark"
        >
          <ChevronRight className="size-4.5" />
        </Link>
      </div>

      <form
        action={createTodo.bind(null, dateStr)}
        className="flex items-center gap-2 rounded-2xl border border-indigo-950/5 bg-white p-2 pl-4 shadow-sm shadow-indigo-950/5"
      >
        <input
          name="title"
          placeholder="Thêm việc cần làm..."
          required
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-foreground/35"
        />
        <button
          type="submit"
          aria-label="Thêm"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-sm shadow-indigo-300 transition-colors hover:bg-brand-dark"
        >
          <Plus className="size-4.5" strokeWidth={2.5} />
        </button>
      </form>

      {todos.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-indigo-950/15 bg-white/60 px-6 py-12 text-center">
          <ListTodo className="size-7 text-foreground/25" />
          <p className="text-sm text-foreground/50">
            {isToday
              ? "Chưa có việc gì hôm nay, thêm việc đầu tiên ở trên."
              : "Không có việc nào cho ngày này."}
          </p>
        </div>
      )}

      {activeTodos.length > 0 && (
        <ul className="space-y-2">
          {activeTodos.map((todo) => (
            <TodoRow key={todo.id} todo={todo} />
          ))}
        </ul>
      )}

      {completedTodos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-semibold tracking-wide text-foreground/40 uppercase">
            Đã xong ({completedTodos.length})
          </h2>
          <ul className="space-y-2">
            {completedTodos.map((todo) => (
              <TodoRow key={todo.id} todo={todo} />
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

function TodoRow({
  todo,
}: {
  todo: { id: string; title: string; completed: boolean };
}) {
  return (
    <li className="flex items-center gap-2 rounded-xl border border-indigo-950/5 bg-white p-3 shadow-sm shadow-indigo-950/5">
      <form action={toggleTodo.bind(null, todo.id)}>
        <button
          type="submit"
          aria-label={todo.completed ? "Đánh dấu chưa xong" : "Đánh dấu đã xong"}
          className={`flex size-6 shrink-0 items-center justify-center rounded-md transition-colors ${
            todo.completed
              ? "text-brand-dark"
              : "text-foreground/25 hover:text-brand"
          }`}
        >
          {todo.completed ? (
            <CheckSquare className="size-5" />
          ) : (
            <Square className="size-5" />
          )}
        </button>
      </form>

      <p
        className={`min-w-0 flex-1 truncate text-sm ${
          todo.completed
            ? "text-foreground/35 line-through"
            : "text-foreground"
        }`}
      >
        {todo.title}
      </p>

      <form action={deleteTodo.bind(null, todo.id)}>
        <button
          type="submit"
          aria-label="Xóa"
          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-foreground/25 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-4" />
        </button>
      </form>
    </li>
  );
}
