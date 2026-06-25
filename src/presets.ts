import { RolePreset } from "./types";

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: "frontend-eng",
    label: "Senior Frontend Engineer",
    roleTitle: "Senior Frontend Engineer (React/TypeScript)",
    iconName: "Code2",
    rawNotes: `Looking for a strong Senior Frontend Engineer to join our core SaaS product squad.
Needs to have been using React for at least 5+ years, very comfortable with typescript, tailwind css, and state management.
We have some legacy redux code we are migrating to react-query (tanstack query) and custom hooks.
They must have high empathy and beautiful communication skills because they will mentor two junior devs.
Needs experience with web performance optimization - we need our Core Web Vitals to improve by 30%.
Remote friendly but must work overlap with EST hours.
Nice to have: experience with Vite, Figma to clean tailwind code conversions, and writing cypress testing.`
  },
  {
    id: "product-manager",
    label: "Growth Product Manager",
    roleTitle: "Growth Product Manager",
    iconName: "TrendingUp",
    rawNotes: `Need a Growth PM for our mobile consumer app.
Must be highly data-driven. Familiar with Amplitude, Mixpanel, and running tight A/B testing cycles.
Should have past experience optimized onboarding flows, signup funnels, and referral channels.
Will work closely with 3 software devs and 1 UX designer.
Must have strong stakeholder management skills - you'll be justifying roadmap items directly to the Chief Product Officer.
We like people who are biased for action over long planning cycles.
Targeting 3-5 years of product management, ideally in consumer mobile subscription apps.`
  },
  {
    id: "devops-engineer",
    label: "DevOps & Cloud Engineer",
    roleTitle: "Cloud DevOps Architect (AWS & Terraform)",
    iconName: "Cloud",
    rawNotes: `Our cloud infra is getting expensive and unreliable. Need someone to take ownership.
AWS environment. Everything needs to be managed via Terraform (Infrastructure as Code) - right now it is a manual point-and-click mess.
Need strong multi-region failover configuration and database migration safety.
We use Kubernetes (EKS), Docker, GitHub Actions, and Prometheus for monitoring.
They will lead our migration from EC2 instances to autoscaling container pods.
Must be on-call rotated but we want to build a highly self-healing infrastructure.
Excellent problem-solving during high-severity server downtime and great documentation habits.`
  },
  {
    id: "ai-engineer",
    label: "AI Solutions Architect",
    roleTitle: "Generative AI Solutions Architect",
    iconName: "Cpu",
    rawNotes: `Looking for a tech-savvy engineer to build and optimize LLM-powered internal utilities.
Should know how to write robust, structured system prompts (like JSON schema response, function calling), and set up retrieval augmented generation (RAG) pipelines.
Experience with Python, Node.js, @google/genai SDK, LangChain, or direct API integration with Gemini, Claude, OpenAI is key.
Must understand vector search databases - we are testing Pinecone and pgvector.
Soft skills: Must be able to explain machine learning/LLM prompt engineering concepts strictly, and translate complex business ideas into viable agentic architectures. 
Strong business domain empathy for user workflows.`
  }
];
