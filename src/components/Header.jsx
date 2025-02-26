export default function Header(){
    return (
        <header className="container mx-auto px-8 py-6 flex items-center">
        <div className="logo pb-2">
          <h2 className="text-2xl font-bold">Maze &amp; Game AI</h2>
        </div>
        <nav className="pl-20">
          <ul className="flex space-x-6">
            <li>
              <a href="/maze" className="nav-link hover:text-gray-600">
                Maze Solving
              </a>
            </li>
            <li>
              <a href="/chess" className="nav-link hover:text-gray-600">
                Chess &amp; Game AI
              </a>
            </li>
            <li>
              <a href="/AITree" className="nav-link hover:text-gray-600">
                Ai DecisionTree
              </a>
            </li>
            <li>
              <a href="#docs" className="nav-link hover:text-gray-600">
                Docs
              </a>
            </li>
            <li>
              <a href="#contact" className="nav-link hover:text-gray-600">
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </header>
    )
}