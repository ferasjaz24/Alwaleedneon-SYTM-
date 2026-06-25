import {Section} from './Section';
import {products} from '../data';
import {motion} from 'motion/react';

export const Products = () => (
  <Section id="products">
    <h2 className="text-4xl font-bold mb-16">Enterprise Products</h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <motion.div key={product.name} className="border border-white/10 p-6">
          <h3 className="text-lg font-semibold mb-3">{product.name}</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            {product.features.map(f => <li key={f}>• {f}</li>)}
          </ul>
        </motion.div>
      ))}
    </div>
  </Section>
);
