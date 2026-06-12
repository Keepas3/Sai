import Navbar from "@/components/Navbar";

export default function GamesPage() {
  const games = [
    { title: "Library of Ruina", art: "/libraryofruina.png" },
    { title: "Osu!", art: "/osu.png" },
    { title: "Risk of Rain 2", art: "/riskofrain.png" },
    { title: "Nier Automata", art: "/nierautomata.png" },
    { title: "Tetr.io", art: "/tetr.io.png" },
    { title: "Mudkip", art: "https://picsum.photos/id/101/400/600" },
  ];

  return (
    <div className="content-wrapper">
      <Navbar />

      <main className="page-container">
        {/* Header Title */}
        <h1 className="page-title">Games</h1>
        
        {/* Grid Container */}
        <div className="games-grid">
          {games.map((game, index) => (
            <div key={index} className="game-card">
              <img src={game.art} alt={game.title} className="game-art" />
              <h3 className="game-title text-center">{game.title}</h3>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}