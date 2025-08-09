export default function Footer() {
  return (
    <footer className="p-6 text-center bg-white dark:bg-black">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        &copy; {new Date().getFullYear()} Eduble. Created by Keith Lim.
      </p>
    </footer>
  );
}
