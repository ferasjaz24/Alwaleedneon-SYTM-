import {Section} from './Section';
import {motion} from 'motion/react';

export const Manufacturing = () => (
  <Section id="manufacturing">
    <h2 className="text-4xl font-bold mb-16">Manufacturing Capabilities</h2>
    <div className="grid md:grid-cols-3 gap-8">
      {[
        {title: "Ductile Iron Valves", desc: "Manufacturing of gate valves, butterfly valves, and check valves designed for high-performance water and infrastructure networks."},
        {title: "Epoxy Coating Systems", desc: "Advanced epoxy coating technologies delivering corrosion resistance and long-term operational durability for harsh environments."},
        {title: "Pipe Fittings & Accessories", desc: "Comprehensive range of fittings, couplings, dismantling joints, and mechanical accessories engineered for reliable network integration."}
      ].map((card, i) => (
        <motion.div 
          key={i} 
          className="border border-white/20 p-8 hover:bg-white/5 transition-colors"
          whileHover={{y: -10}}
        >
          <h3 className="text-xl font-semibold mb-4">{card.title}</h3>
          <p className="text-gray-400">{card.desc}</p>
        </motion.div>
      ))}
    </div>
  </Section>
);
