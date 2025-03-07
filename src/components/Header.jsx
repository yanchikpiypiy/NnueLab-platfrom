export default function Header() {
  return (
    <header className="w-full bg-[#121212] text-gray-100 px-8 py-6 flex items-center justify-between shadow-md">
      <div className="logo pb-2">
        <h2 className="text-2xl font-bold">Maze &amp; Game AI</h2>
      </div>
      <nav>
        <ul className="flex space-x-6">
          <li>
            <a href="/maze" className="hover:text-gray-400 transition-colors">
              Maze Solving
            </a>
          </li>
          <li>
            <a href="/chess" className="hover:text-gray-400 transition-colors">
              Chess &amp; Game AI
            </a>
          </li>
          <li>
            <a href="/AITree" className="hover:text-gray-400 transition-colors">
              Ai DecisionTree
            </a>
          </li>
          <li>
            <a href="#docs" className="hover:text-gray-400 transition-colors">
              Docs
            </a>
          </li>
          <li>
            <a href="#contact" className="hover:text-gray-400 transition-colors">
              Contact
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
