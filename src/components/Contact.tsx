import {Section} from './Section';

export const Contact = () => (
  <Section id="contact" className="grid md:grid-cols-2 gap-16">
    <div>
        <h2 className="text-4xl font-bold mb-8">Contact SPSV</h2>
        <p className="text-gray-400">Saudi Pipe Systems Valves (SPSV)<br/>Second Industrial City, Dammam<br/>Kingdom of Saudi Arabia</p>
    </div>
    <form className="space-y-4">
        <input type="text" placeholder="Name" className="w-full bg-white/5 border border-white/10 p-4" />
        <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 p-4" />
        <textarea placeholder="Message" className="w-full bg-white/5 border border-white/10 p-4 h-32"></textarea>
        <button className="bg-white text-black px-8 py-4 w-full">Submit Inquiry</button>
    </form>
  </Section>
);
