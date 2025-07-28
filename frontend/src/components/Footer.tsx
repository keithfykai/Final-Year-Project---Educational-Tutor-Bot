export default function Footer() {
  return (
    <footer className="p-6 text-center border-t border-sky-100 dark:border-slate-700 bg-white dark:bg-slate-900">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        &copy; {new Date().getFullYear()} Educational Tutor Bot. All rights reserved.
      </p>
    </footer>
  );
}
