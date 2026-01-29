export default function Footer() {
  return (
    <footer className="py-8 text-center border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      <p className="text-sm text-slate-500">
        © {new Date().getFullYear()} Eduble · Built for better learning
      </p>
    </footer>
  );
}
