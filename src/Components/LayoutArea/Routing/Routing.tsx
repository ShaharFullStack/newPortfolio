import { Route, Routes } from 'react-router-dom';
// import './Layout.css';
import { ParticleNavigation } from '../../Scenes/ParticleNavigation/ParticleNavigation';
import { AboutScene } from '../../Scenes/AboutScene/AboutScene';
import { WorkspaceScene } from '../../Scenes/WorkspaceScene/WorkspaceScene';
import { ContactScene } from '../../Scenes/ContactScene/ContactScene';

export function Routing(): JSX.Element {
  
  return (
    <div className="Routing">
      <Routes>
        <Route path="/" element={<ParticleNavigation />} />
        <Route path="/home" element={<WorkspaceScene />} />
        {/* <Route path="/projects" element={<Projects />} /> */}
        <Route path="/about" element={<AboutScene />} />
        <Route path="/contact" element={<ContactScene />} />
      </Routes>
    </div>
  );
};

