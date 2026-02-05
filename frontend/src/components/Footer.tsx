export default function Footer() {
  return (
    <footer className="py-8 text-center border-t border-gray-800 bg-black">
      <p className="text-sm text-gray-400">
        © {new Date().getFullYear()} Eduble · Built for better learning
      </p>
    </footer>
  );
}
