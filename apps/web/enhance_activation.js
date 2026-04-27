const fs = require('fs');
const file = 'c:/Users/Moalfarras/Desktop/Desktop_Transfer_2026-04-25/Moalfarrasappseit/apps/web/src/components/app/moplayer-activation-page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add step state
content = content.replace(
    'const [status, setStatus] = useState<Status>("waiting");',
    'const [status, setStatus] = useState<Status>("waiting");\n  const [activeStep, setActiveStep] = useState<"activate" | "setup">("activate");'
);

// 2. Set step to setup when activated
content = content.replace(
    'if (response.ok && payload?.status === "activated") {\n        setStatus("activated");',
    'if (response.ok && payload?.status === "activated") {\n        setStatus("activated");\n        setTimeout(() => setActiveStep("setup"), 1500);'
);

// 3. Wrap views in AnimatePresence or conditional logic
// (Actually I'll just use simple conditional rendering for speed and stability)

fs.writeFileSync(file, content);
console.log('Activation flow enhanced.');
