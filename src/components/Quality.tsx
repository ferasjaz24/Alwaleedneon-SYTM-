import {Section} from './Section';

export const Quality = () => (
    <Section id="quality">
      <h2 className="text-4xl font-bold mb-8">Engineered to International Standards.</h2>
      <p className="text-gray-400 mb-12 max-w-2xl">
        SPSV products are manufactured under rigorous quality control systems and comply with globally recognized standards.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-gray-300">
        {["ISO Certified Processes", "AWWA Standards", "BS EN Standards", "Pressure Testing", "Leakage Testing", "Material Traceability", "Quality Documentation", "Factory Inspection"].map(q => (
            <div key={q} className="border-l border-white/20 pl-4 py-2">{q}</div>
        ))}
      </div>
    </Section>
  );
