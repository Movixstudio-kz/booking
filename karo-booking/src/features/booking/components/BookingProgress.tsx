const steps = ["Услуга", "Специалист", "Дата и время", "Контакты"];

export function BookingProgress({ currentStep }: { currentStep: number }) {
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Этапы записи">
      {steps.map((label, index) => {
        const step = index + 1;
        const isActive = step === currentStep;
        const isComplete = step < currentStep;

        return (
          <li key={label} className="min-w-0">
            <div className={`h-1 rounded-full ${step <= currentStep ? "bg-[#3ee58c]" : "bg-[#dfe5da]"}`} />
            <p className={`mt-2 truncate text-[11px] font-semibold sm:text-xs ${isActive ? "text-[#10231d]" : isComplete ? "text-[#3c7355]" : "text-[#8a9990]"}`}>
              {step}. {label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
