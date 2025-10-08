import Header from "../Header";
import { ThemeProvider } from "../ThemeProvider";

export default function HeaderExample() {
  return (
    <ThemeProvider>
      <Header onSearch={(query) => console.log("Search:", query)} />
    </ThemeProvider>
  );
}
