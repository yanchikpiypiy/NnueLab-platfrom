import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="w-full bg-[#121212] text-gray-100 px-8 py-6 flex items-center justify-between shadow-md">
      <div className="logo pb-2">
        <Link to="/" className="text-2xl font-bold">
          Maze &amp; Game AI
        </Link>
      </div>
      <nav>
        <ul className="flex space-x-6">
          <li>
            <Link to="/maze" className="hover:text-gray-400 transition-colors">
              Maze Solving
            </Link>
          </li>
          <li>
            <Link to="/chess" className="hover:text-gray-400 transition-colors">
              Chess &amp; Game AI
            </Link>
          </li>
          <li>
            <Link to="/AITree" className="hover:text-gray-400 transition-colors">
              AI Decision Tree
            </Link>
          </li>
          <li>
            <Link to="/docs" className="hover:text-gray-400 transition-colors">
              Docs
            </Link>
          </li>
          <li>
            <Link to="/contact" className="hover:text-gray-400 transition-colors">
              Contact
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
