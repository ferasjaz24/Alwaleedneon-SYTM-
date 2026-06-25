import {motion} from 'motion/react';
import type {FC, ReactNode} from 'react';

export const Section: FC<{children: ReactNode; id?: string; className?: string}> = ({children, id, className = ""}) => (
  <motion.section
    id={id}
    className={`py-24 px-6 ${className}`}
    initial={{opacity: 0, y: 20}}
    whileInView={{opacity: 1, y: 0}}
    viewport={{once: true}}
    transition={{duration: 0.6}}
  >
    {children}
  </motion.section>
);
