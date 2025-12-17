import Header from "../Header";
import { ThemeProvider } from "../ThemeProvider";

export default function HeaderExample() {
  return (
    <ThemeProvider>
      <Header onSearch={(query) => logger.info("Search:", query)} />
    </ThemeProvider>
  );
}
