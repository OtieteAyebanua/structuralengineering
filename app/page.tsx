import BeamAnalysis from "./component/main";

export default function Home() {
  return (
    <main
      style={{
        padding: "50px",
        backgroundColor: "#f0f2f5",
        minHeight: "100vh"
      }}
    >
      <h1 style={{ textAlign: "center", color: "#2d3748" }}>
        Structural Analysis Dashboard
      </h1>

      <BeamAnalysis />
    </main>
  );
}
