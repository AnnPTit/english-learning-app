import { getServerSession } from "next-auth/next";
import { CheckSquare, Square, Trash2, ListTodo, Plus } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { listTodos } from "@/lib/todos";
import { createTodo, toggleTodo, deleteTodo } from "./actions";

export default async function TodosPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const todos = await listTodos(userId);
  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-5 p-4 pb-28">
      <div className="space-y-1 pt-2">
        <h1 className="text-xl font-semibold text-foreground">
          Việc cần làm
        </h1>
        <p className="text-sm text-foreground/50">
          Danh sách riêng tư của bạn, chỉ bạn thấy được.
        </p>
      </div>

      <form
        action={createTodo}
        className="flex items-center gap-2 rounded-2xl border border-indigo-950/5 bg-white p-2 pl-4 shadow-sm shadow-indigo-950/5"
      >
        <input
          name="title"
          placeholder="Thêm việc cần làm..."
          required
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/35"
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
            Chưa có việc gì, thêm việc đầu tiên ở trên.
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
