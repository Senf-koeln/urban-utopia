import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";
import { GlobalStyle, IconSprite } from "@ui";
import { useThemeColor } from "@ui/hooks/useThemeColor";
import "./i18n/i18n";
import { useEffect } from "react";
import AdminPage from "./admin/pages/AdminPage";
import ProjectPage from "./admin/pages/ProjectPage.tsx";
import ProjectsPage from "./admin/pages/ProjectsPage";
import ResultsPage from "./admin/pages/ResultsPage";
import AiImageGenerator from "./aiImageGenerator/AiImageGenerator";
import { CreatedImagesProvider } from "./aiImageGenerator/context/CreatedImagesContext";
import LandingPage from "./aiImageGenerator/LandingPage";
import UseCaseDetailPage from "./landing/pages/UseCaseDetailPage";
import UseCasesOverviewPage from "./landing/pages/UseCasesOverviewPage";
import StartImage from "./aiImageGenerator/StartImage";

function AppContent() {
  const customTheme = useThemeColor({ color: "#95e565" });
  const { projectId } = useParams();

  useEffect(() => {
    if (projectId) {
      localStorage.setItem("projectId", projectId);
    }
  }, [projectId]);

  return (
    <>
      <GlobalStyle custom={customTheme} />
      <IconSprite />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/einsatz" element={<UseCasesOverviewPage />} />
        <Route path="/einsatz/:slug" element={<UseCaseDetailPage />} />

        <Route path="/admin" element={<AdminPage />} />
        <Route
          path="/organizations/:organizationId/results"
          element={<ResultsPage />}
        />
        <Route
          path="/organizations/:organizationId"
          element={<ProjectsPage />}
        />
        <Route
          path="/organizations/:organizationId/projects/"
          element={<ProjectsPage />}
        />
        <Route
          path="/organizations/:organizationId/projects/:projectId"
          element={<ProjectPage />}
        />
        <Route
          path="/organizations/:organizationId/projects/:projectId/results"
          element={<ResultsPage />}
        />

        <Route
          path="/:organizationId/projects/:projectId"
          element={<AdminPage />}
        />

        <Route path="/:projectId" element={<StartImage />} />
        <Route path="/:projectId/edit" element={<AiImageGenerator />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <CreatedImagesProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </CreatedImagesProvider>
  );
}

export default App;
