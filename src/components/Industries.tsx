import {Section} from './Section';
import {industries} from '../data';

export const Industries = () => (
  <Section id="projects" className="bg-zinc-950">
    <h2 className="text-4xl font-bold mb-16">Industries We Serve</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {industries.map(ind => (
        <div key={ind} className="border border-white/10 p-6 flex items-center justify-center text-center">
          {ind}
        </div>
      ))}
    </div>
  </Section>
);
