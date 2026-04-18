import { cn } from "@/lib/cn";

type GradientOrbsProps = {
  className?: string;
  variant?: "hero" | "inner" | "footer";
};

const positions = {
  hero: [
    "left-[-12%] top-[6%] h-[22rem] w-[22rem] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.24),transparent_65%)] md:h-[34rem] md:w-[34rem]",
    "right-[-8%] top-[10%] h-[18rem] w-[18rem] bg-[radial-gradient(circle_at_center,rgba(255,111,171,0.18),transparent_68%)] md:h-[26rem] md:w-[26rem]",
    "bottom-[-8%] right-[24%] h-[16rem] w-[16rem] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.14),transparent_70%)] md:h-[24rem] md:w-[24rem]",
  ],
  inner: [
    "left-[-16%] top-[-6%] h-[18rem] w-[18rem] bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.16),transparent_68%)] md:h-[26rem] md:w-[26rem]",
    "right-[-12%] top-[18%] h-[16rem] w-[16rem] bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.16),transparent_70%)] md:h-[24rem] md:w-[24rem]",
    "bottom-[-10%] left-[24%] h-[14rem] w-[14rem] bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12),transparent_72%)] md:h-[18rem] md:w-[18rem]",
  ],
  footer: [
    "left-[-12%] top-[-18%] h-[16rem] w-[16rem] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_72%)]",
    "right-[-8%] top-[10%] h-[14rem] w-[14rem] bg-[radial-gradient(circle_at_center,rgba(255,111,171,0.16),transparent_72%)]",
    "bottom-[-22%] left-[36%] h-[12rem] w-[12rem] bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_74%)]",
  ],
} as const;

export function GradientOrbs({ className, variant = "hero" }: GradientOrbsProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      {positions[variant].map((orbClass, index) => (
        <span
          key={`${variant}-${index}`}
          className={cn("orb-float absolute rounded-full blur-3xl", orbClass)}
          style={{ animationDelay: `${index * 2.6}s` }}
        />
      ))}
    </div>
  );
}
